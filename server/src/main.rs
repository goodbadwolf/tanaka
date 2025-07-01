use axum::{
    middleware,
    routing::{get, post},
    Json, Router,
};
use serde::Serialize;
use std::net::SocketAddr;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod auth;
mod db;
mod error;
mod models;
mod sync;

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    version: String,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "tanaka_server=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Initialize database
    let db_pool = db::init_db().await.expect("Failed to initialize database");
    tracing::info!("Database initialized");

    let app = Router::new()
        .route("/health", get(health))
        .route(
            "/sync",
            post(sync::sync_handler).route_layer(middleware::from_fn(auth::auth_middleware)),
        )
        .layer(CorsLayer::permissive()) // Allow all origins for development
        .layer(TraceLayer::new_for_http())
        .with_state(db_pool);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    tracing::info!("Starting Tanaka server on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}
