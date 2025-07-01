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
    let args = Args::parse();
    let config = Config::load(&args)?;
    init_logging(&config);

    tracing::info!("Starting Tanaka server v{}", env!("CARGO_PKG_VERSION"));
    tracing::debug!("Configuration loaded: {:?}", config);

    let db_pool = db::init_db_with_config(&config.database).await?;
    tracing::info!("Database initialized");

    let app = create_app(db_pool, &config);

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

fn create_app(db_pool: sqlx::SqlitePool, config: &Config) -> Router {
    let mut app = Router::new().route("/health", get(health)).route(
        "/sync",
        post(sync::sync_handler).route_layer(middleware::from_fn_with_state(
            config.auth.clone(),
            auth::auth_middleware,
        )),
    );

    app = app.layer(CorsLayer::permissive());

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
