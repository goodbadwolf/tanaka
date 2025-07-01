use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use std::time::Duration;
use tanaka_server::config::DatabaseConfig;
use tanaka_server::error::AppResult;

#[allow(dead_code)] // Kept for backwards compatibility
pub async fn init_db() -> Result<SqlitePool, sqlx::Error> {
    let default_config = DatabaseConfig {
        url: "sqlite://tabs.db".to_string(),
        max_connections: 5,
        connection_timeout_secs: 10,
    };

    init_db_with_config(&default_config)
        .await
        .map_err(|e| match e {
            tanaka_server::error::AppError::Database { source, .. } => source,
            _ => sqlx::Error::Configuration("Unexpected error type".into()),
        })
}

pub async fn init_db_with_config(config: &DatabaseConfig) -> AppResult<SqlitePool> {
    // Extract database path from URL
    let db_path = config.url.strip_prefix("sqlite://").unwrap_or(&config.url);

    // Create database file if it doesn't exist
    if !db_path.starts_with(":memory:") {
        let _ = tokio::fs::File::create(db_path).await;
    }

    let pool = SqlitePoolOptions::new()
        .max_connections(config.max_connections)
        .acquire_timeout(Duration::from_secs(config.connection_timeout_secs))
        .connect(&config.url)
        .await
        .map_err(|e| {
            tanaka_server::error::AppError::database(
                format!("Failed to connect to database: {e}"),
                e,
            )
        })?;

    // Configure SQLite for better performance
    sqlx::query("PRAGMA journal_mode = WAL")
        .execute(&pool)
        .await
        .map_err(|e| tanaka_server::error::AppError::database("Failed to set journal mode", e))?;

    // Set busy timeout based on connection timeout
    let busy_timeout_ms = config.connection_timeout_secs * 1000;
    sqlx::query(&format!("PRAGMA busy_timeout = {busy_timeout_ms}"))
        .execute(&pool)
        .await
        .map_err(|e| tanaka_server::error::AppError::database("Failed to set busy timeout", e))?;

    sqlx::query("PRAGMA synchronous = NORMAL")
        .execute(&pool)
        .await
        .map_err(|e| {
            tanaka_server::error::AppError::database("Failed to set synchronous mode", e)
        })?;

    // Create tables
    sqlx::query(
        r"
        CREATE TABLE IF NOT EXISTS tabs (
            id TEXT PRIMARY KEY,
            window_id TEXT NOT NULL,
            data TEXT NOT NULL,
            updated_at INTEGER NOT NULL
        )
        ",
    )
    .execute(&pool)
    .await
    .map_err(|e| tanaka_server::error::AppError::database("Failed to create tabs table", e))?;

    Ok(pool)
}
