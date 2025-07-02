pub mod config;
pub mod crdt;
pub mod error;
pub mod models;
pub mod repository;
pub mod services;
pub mod sync;

use crate::crdt::CrdtManager;
use axum::{
    middleware,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::Serialize;
use sqlx::SqlitePool;
use std::sync::Arc;
use tower_http::cors::CorsLayer;

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    version: String,
}

/// Create the app router for testing
pub fn create_app(
    db_pool: SqlitePool,
    crdt_manager: Arc<CrdtManager>,
    auth_config: config::AuthConfig,
) -> Router {
    let auth_middleware_layer = middleware::from_fn_with_state(auth_config, auth_middleware);

    let mut app = Router::new().route("/health", get(health)).route(
        "/sync",
        post(sync::sync_handler)
            .with_state((crdt_manager, db_pool))
            .route_layer(auth_middleware_layer),
    );

    app = app.layer(CorsLayer::permissive());
    app
}

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}

/// Auth middleware for testing
///
/// # Errors
///
/// Returns an error response if authentication fails
pub async fn auth_middleware(
    axum::extract::State(auth_config): axum::extract::State<config::AuthConfig>,
    req: axum::extract::Request,
    next: axum::middleware::Next,
) -> Result<axum::response::Response, axum::response::Response> {
    const BEARER_PREFIX: &str = "Bearer ";

    let auth_header = req
        .headers()
        .get(&auth_config.token_header)
        .and_then(|value| value.to_str().ok());

    match auth_header {
        Some(auth) if auth.starts_with(BEARER_PREFIX) => {
            let token = &auth[BEARER_PREFIX.len()..];
            if token == auth_config.shared_token {
                Ok(next.run(req).await)
            } else {
                Err(
                    error::AppError::auth_token_invalid("Invalid authentication token")
                        .into_response(),
                )
            }
        }
        Some(_) => Err(error::AppError::auth_token_invalid(
            "Invalid authorization format. Use: Bearer <token>",
        )
        .into_response()),
        None => Err(error::AppError::auth_token_missing().into_response()),
    }
}

/// Setup database for testing
///
/// # Errors
///
/// Returns `AppError` if database setup fails
pub async fn setup_database(
    config: &config::DatabaseConfig,
) -> Result<SqlitePool, error::AppError> {
    use sqlx::sqlite::SqlitePoolOptions;
    use std::time::Duration;

    const CREATE_TABS_TABLE_SQL: &str = r#"
        CREATE TABLE IF NOT EXISTS tabs (
            id TEXT PRIMARY KEY,
            window_id TEXT NOT NULL,
            url TEXT NOT NULL,
            title TEXT NOT NULL,
            active INTEGER NOT NULL DEFAULT 0,
            "index" INTEGER NOT NULL DEFAULT 0,
            updated_at INTEGER NOT NULL
        )
    "#;

    const CREATE_CRDT_OPERATIONS_TABLE_SQL: &str = r"
        CREATE TABLE IF NOT EXISTS crdt_operations (
            id TEXT PRIMARY KEY,
            clock INTEGER NOT NULL,
            device_id TEXT NOT NULL,
            operation_type TEXT NOT NULL,
            target_id TEXT NOT NULL,
            operation_data TEXT NOT NULL,
            created_at INTEGER NOT NULL
        )
    ";

    const CREATE_CRDT_STATE_TABLE_SQL: &str = r"
        CREATE TABLE IF NOT EXISTS crdt_state (
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            current_data TEXT NOT NULL,
            last_clock INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            PRIMARY KEY (entity_type, entity_id)
        )
    ";

    let pool = SqlitePoolOptions::new()
        .max_connections(config.max_connections)
        .acquire_timeout(Duration::from_secs(config.connection_timeout_secs))
        .connect(&config.url)
        .await
        .map_err(|e| error::AppError::database(format!("Failed to connect to database: {e}"), e))?;

    // Configure SQLite for better performance
    sqlx::query("PRAGMA journal_mode = WAL")
        .execute(&pool)
        .await
        .map_err(|e| error::AppError::database("Failed to set journal mode", e))?;

    let busy_timeout_ms = config.connection_timeout_secs * 1000;
    sqlx::query(&format!("PRAGMA busy_timeout = {busy_timeout_ms}"))
        .execute(&pool)
        .await
        .map_err(|e| error::AppError::database("Failed to set busy timeout", e))?;

    sqlx::query("PRAGMA synchronous = NORMAL")
        .execute(&pool)
        .await
        .map_err(|e| error::AppError::database("Failed to set synchronous mode", e))?;

    // Create tables
    sqlx::query(CREATE_TABS_TABLE_SQL)
        .execute(&pool)
        .await
        .map_err(|e| error::AppError::database("Failed to create tabs table", e))?;

    sqlx::query(CREATE_CRDT_OPERATIONS_TABLE_SQL)
        .execute(&pool)
        .await
        .map_err(|e| error::AppError::database("Failed to create CRDT operations table", e))?;

    sqlx::query(CREATE_CRDT_STATE_TABLE_SQL)
        .execute(&pool)
        .await
        .map_err(|e| error::AppError::database("Failed to create CRDT state table", e))?;

    // Create indexes
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_crdt_operations_clock ON crdt_operations(clock)")
        .execute(&pool)
        .await
        .map_err(|e| error::AppError::database("Failed to create clock index", e))?;

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_crdt_operations_target ON crdt_operations(target_id)",
    )
    .execute(&pool)
    .await
    .map_err(|e| error::AppError::database("Failed to create target index", e))?;

    Ok(pool)
}
