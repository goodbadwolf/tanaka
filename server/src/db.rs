use sqlx::{migrate::MigrateDatabase, sqlite::SqlitePoolOptions, Sqlite, SqlitePool};
use std::time::Duration;
use tanaka_server::config::DatabaseConfig;
use tanaka_server::error::AppResult;
use tanaka_server::repository::sqlite::StatementCache;

const MILLIS_PER_SECOND: u64 = 1000;

#[allow(clippy::too_many_lines)] // Database initialization requires many sequential setup steps
pub async fn init_db_with_config(config: &DatabaseConfig) -> AppResult<SqlitePool> {
    // Create database if it doesn't exist
    if !Sqlite::database_exists(&config.url).await.unwrap_or(false) {
        Sqlite::create_database(&config.url).await.map_err(|e| {
            tanaka_server::error::AppError::database(format!("Failed to create database: {e}"), e)
        })?;
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

    // Configure SQLite for optimal performance
    // Enable WAL mode for better concurrency
    sqlx::query("PRAGMA journal_mode = WAL")
        .execute(&pool)
        .await
        .map_err(|e| tanaka_server::error::AppError::database("Failed to set journal mode", e))?;

    // Set cache size to 64MB for better performance with 200+ tabs
    sqlx::query("PRAGMA cache_size = -65536") // Negative value = KB, so -65536 = 64MB
        .execute(&pool)
        .await
        .map_err(|e| tanaka_server::error::AppError::database("Failed to set cache size", e))?;

    // Optimize for performance over durability (acceptable for sync data)
    sqlx::query("PRAGMA synchronous = NORMAL")
        .execute(&pool)
        .await
        .map_err(|e| {
            tanaka_server::error::AppError::database("Failed to set synchronous mode", e)
        })?;

    // Busy timeout for concurrent access
    let busy_timeout_ms = config.connection_timeout_secs * MILLIS_PER_SECOND;
    sqlx::query(&format!("PRAGMA busy_timeout = {busy_timeout_ms}"))
        .execute(&pool)
        .await
        .map_err(|e| tanaka_server::error::AppError::database("Failed to set busy timeout", e))?;

    // Optimize memory usage and performance
    sqlx::query("PRAGMA temp_store = MEMORY") // Store temp tables in memory
        .execute(&pool)
        .await
        .map_err(|e| tanaka_server::error::AppError::database("Failed to set temp store", e))?;

    sqlx::query("PRAGMA mmap_size = 268435456") // 256MB memory-mapped I/O
        .execute(&pool)
        .await
        .map_err(|e| tanaka_server::error::AppError::database("Failed to set mmap size", e))?;

    // Run migrations
    sqlx::migrate!()
        .run(&pool)
        .await
        .map_err(|e| tanaka_server::error::AppError::Database {
            message: format!("Failed to run migrations: {e}"),
            source: sqlx::Error::Protocol(e.to_string()),
        })?;

    tracing::info!("Database migrations completed successfully");

    // Warm up statement cache for better performance
    let cache = StatementCache::new(std::sync::Arc::new(pool.clone()));
    if let Err(e) = cache.warm_cache().await {
        tracing::warn!("Failed to warm statement cache: {}", e);
        // Continue anyway as this is just an optimization
    } else {
        tracing::info!(
            "Statement cache warmed with {} prepared statements",
            cache.size()
        );
    }

    Ok(pool)
}
