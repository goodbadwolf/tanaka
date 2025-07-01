use axum::{
    middleware,
    routing::{get, post},
    Json, Router,
};
use clap::Parser;
use serde::Serialize;
use std::net::SocketAddr;
use tanaka_server::config::{Args, Config};
use tanaka_server::error::AppResult;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, Layer};

mod auth;
mod db;
mod sync;

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    version: String,
}

#[tokio::main]
async fn main() -> AppResult<()> {
    // Parse command line arguments
    let args = Args::parse();

    // Load configuration
    let config = Config::load(&args)?;

    // Initialize logging based on config
    init_logging(&config);

    tracing::info!("Starting Tanaka server v{}", env!("CARGO_PKG_VERSION"));
    tracing::debug!("Configuration loaded: {:?}", config);

    // Initialize database with config
    let db_pool = db::init_db_with_config(&config.database).await?;
    tracing::info!("Database initialized");

    // Create app with configuration
    let app = create_app(db_pool, &config);

    // Parse bind address
    let addr: SocketAddr = config
        .server
        .bind_addr
        .parse()
        .expect("Invalid bind address");

    tracing::info!("Starting server on {}", addr);

    // Start server
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

fn create_app(db_pool: sqlx::SqlitePool, config: &Config) -> Router {
    let mut app = Router::new().route("/health", get(health)).route(
        "/sync",
        post(sync::sync_handler).route_layer(middleware::from_fn_with_state(
            config.auth.clone(),
            auth::auth_middleware,
        )),
    );

    // Add CORS layer
    app = app.layer(CorsLayer::permissive());

    // Add request tracing if enabled
    if config.logging.request_logging {
        app = app.layer(TraceLayer::new_for_http());
    }

    app.with_state(db_pool)
}

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}
