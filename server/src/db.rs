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

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::Row;
    use tanaka_server::config::DatabaseConfig;
    use tempfile::tempdir;

    #[tokio::test]
    async fn test_init_db_with_config_success() {
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let config = DatabaseConfig {
            url: format!("sqlite://{}", db_path.display()),
            max_connections: 5,
            connection_timeout_secs: 10,
        };

        let pool = init_db_with_config(&config).await.unwrap();

        // Verify database was created
        assert!(db_path.exists());

        // Verify migrations were applied
        let result = sqlx::query("SELECT name FROM sqlite_master WHERE type='table'")
            .fetch_all(&pool)
            .await
            .unwrap();

        let table_names: Vec<String> = result
            .iter()
            .map(|row| row.get::<String, _>("name"))
            .collect();

        assert!(table_names.contains(&"crdt_operations".to_string()));
        assert!(table_names.contains(&"crdt_state".to_string()));
        assert!(table_names.contains(&"_sqlx_migrations".to_string()));
    }

    #[tokio::test]
    async fn test_init_db_with_memory_database() {
        let config = DatabaseConfig {
            url: "sqlite::memory:".to_string(),
            max_connections: 1,
            connection_timeout_secs: 5,
        };

        let pool = init_db_with_config(&config).await.unwrap();

        // Verify migrations were applied to in-memory database
        let result = sqlx::query("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'")
            .fetch_one(&pool)
            .await
            .unwrap();

        let count: i32 = result.get("count");
        assert!(count >= 3); // At least crdt_operations, crdt_state, and _sqlx_migrations
    }

    #[tokio::test]
    async fn test_init_db_idempotent() {
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let config = DatabaseConfig {
            url: format!("sqlite://{}", db_path.display()),
            max_connections: 5,
            connection_timeout_secs: 10,
        };

        // Initialize database twice
        let pool1 = init_db_with_config(&config).await.unwrap();
        drop(pool1);

        let pool2 = init_db_with_config(&config).await.unwrap();

        // Should succeed without errors
        let result = sqlx::query("SELECT COUNT(*) as count FROM _sqlx_migrations")
            .fetch_one(&pool2)
            .await
            .unwrap();

        let count: i32 = result.get("count");
        assert_eq!(count, 1); // Only one migration should be recorded
    }

    #[tokio::test]
    async fn test_init_db_verifies_pragma_settings() {
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let config = DatabaseConfig {
            url: format!("sqlite://{}", db_path.display()),
            max_connections: 1,
            connection_timeout_secs: 5,
        };

        let pool = init_db_with_config(&config).await.unwrap();

        // Verify WAL mode is set (only works with file-based databases)
        let result = sqlx::query("PRAGMA journal_mode")
            .fetch_one(&pool)
            .await
            .unwrap();
        let mode: String = result.get(0);
        assert_eq!(mode, "wal");

        // Verify synchronous mode
        let result = sqlx::query("PRAGMA synchronous")
            .fetch_one(&pool)
            .await
            .unwrap();
        let sync_mode: i32 = result.get(0);
        assert_eq!(sync_mode, 1); // NORMAL = 1
    }
}
