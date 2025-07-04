use axum::{
    middleware,
    routing::{get, post},
    Json, Router,
};
use clap::Parser;
use serde::Serialize;
use std::net::SocketAddr;
use std::sync::Arc;
use tanaka_server::config::{Args, Config};
use tanaka_server::crdt::CrdtManager;
use tanaka_server::error::AppResult;
use tanaka_server::repository::Repositories;
use tanaka_server::sync;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, Layer};

mod auth;
mod db;

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    version: String,
}

#[tokio::main]
async fn main() -> AppResult<()> {
    let args = Args::parse();
    let config = Config::load(&args)?;
    init_logging(&config);

    tracing::info!("Starting Tanaka server v{}", env!("CARGO_PKG_VERSION"));
    tracing::debug!("Configuration loaded: {:?}", config);

    let db_pool = db::init_db_with_config(&config.database).await?;
    tracing::info!("Database initialized");

    // Create repositories
    let repositories = Repositories::new_sqlite(db_pool.clone());

    // Initialize CRDT manager with node ID based on bind address hash
    let node_id = calculate_node_id(&config.server.bind_addr);

    // Restore state from database
    let max_clock = repositories.operations.get_max_clock().await?;
    let crdt_manager = if max_clock > 0 {
        tracing::info!("Restoring server state with max clock: {}", max_clock);

        // Create manager with existing clock
        let manager = Arc::new(CrdtManager::with_initial_clock(node_id, max_clock + 1));

        // Restore operations to rebuild CRDT state
        let operations = repositories.operations.get_all().await?;
        let op_count = operations.len();

        if op_count > 0 {
            tracing::info!("Replaying {} operations to restore CRDT state", op_count);
            if let Err(e) = manager.restore_from_operations(&operations) {
                tracing::error!("Failed to restore CRDT state: {}", e);
                return Err(tanaka_server::error::AppError::internal(format!(
                    "Failed to restore CRDT state: {e}"
                )));
            }
            tracing::info!(
                "Successfully restored CRDT state from {} operations",
                op_count
            );
        }

        manager
    } else {
        tracing::info!("No existing state found, starting fresh");
        Arc::new(CrdtManager::new(node_id))
    };

    tracing::info!(
        "CRDT manager initialized with node ID: {} and clock: {}",
        node_id,
        crdt_manager.current_clock()
    );

    let app = create_app(&db_pool, &crdt_manager, &config);

    let addr: SocketAddr =
        config
            .server
            .bind_addr
            .parse()
            .map_err(|e| tanaka_server::error::AppError::Config {
                message: format!("Invalid bind address '{}': {}", config.server.bind_addr, e),
                key: Some("server.bind_addr".to_string()),
            })?;

    tracing::info!("Starting server on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

fn init_logging(config: &Config) {
    let filter = tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
        format!(
            "tanaka_server={},tower_http={}",
            config.logging.level, config.logging.level
        )
        .into()
    });

    let fmt_layer = match config.logging.format.as_str() {
        "json" => tracing_subscriber::fmt::layer().json().boxed(),
        "compact" => tracing_subscriber::fmt::layer().compact().boxed(),
        _ => tracing_subscriber::fmt::layer().pretty().boxed(),
    };

    tracing_subscriber::registry()
        .with(filter)
        .with(fmt_layer)
        .init();
}

fn create_app(
    db_pool: &sqlx::SqlitePool,
    crdt_manager: &Arc<CrdtManager>,
    config: &Config,
) -> Router {
    let auth_middleware_layer =
        middleware::from_fn_with_state(config.auth.clone(), auth::auth_middleware);

    let mut app = Router::new().route("/health", get(health)).route(
        "/sync",
        post(sync::sync_handler)
            .with_state((crdt_manager.clone(), db_pool.clone()))
            .route_layer(auth_middleware_layer),
    );

    app = app.layer(CorsLayer::permissive());

    if config.logging.request_logging {
        app = app.layer(TraceLayer::new_for_http());
    }

    app
}

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}

fn calculate_node_id(bind_addr: &str) -> u32 {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();
    bind_addr.hash(&mut hasher);

    // Use lower 32 bits for node ID
    (hasher.finish() & 0xFFFF_FFFF) as u32
}
