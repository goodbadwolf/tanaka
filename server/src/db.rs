use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use std::time::Duration;
use tanaka_server::config::DatabaseConfig;
use tanaka_server::error::AppResult;

const CREATE_TABS_TABLE_SQL: &str = r"
    CREATE TABLE IF NOT EXISTS tabs (
        id TEXT PRIMARY KEY,
        window_id TEXT NOT NULL,
        data TEXT NOT NULL,
        updated_at INTEGER NOT NULL
    )
";

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

const MILLIS_PER_SECOND: u64 = 1000;

pub async fn init_db_with_config(config: &DatabaseConfig) -> AppResult<SqlitePool> {
    let db_path = config.url.strip_prefix("sqlite://").unwrap_or(&config.url);

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

    sqlx::query(CREATE_TABS_TABLE_SQL)
        .execute(&pool)
        .await
        .map_err(|e| tanaka_server::error::AppError::database("Failed to create tabs table", e))?;

    sqlx::query(CREATE_CRDT_OPERATIONS_TABLE_SQL)
        .execute(&pool)
        .await
        .map_err(|e| {
            tanaka_server::error::AppError::database("Failed to create CRDT operations table", e)
        })?;

    sqlx::query(CREATE_CRDT_STATE_TABLE_SQL)
        .execute(&pool)
        .await
        .map_err(|e| {
            tanaka_server::error::AppError::database("Failed to create CRDT state table", e)
        })?;

    // Create strategic indexes for optimal query performance

    // CRDT Operations indexes (optimized for sync queries)
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_crdt_operations_clock ON crdt_operations(clock)")
        .execute(&pool)
        .await
        .map_err(|e| tanaka_server::error::AppError::database("Failed to create clock index", e))?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_crdt_operations_device_clock ON crdt_operations(device_id, clock)")
        .execute(&pool)
        .await
        .map_err(|e| tanaka_server::error::AppError::database("Failed to create device-clock index", e))?;

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_crdt_operations_target ON crdt_operations(target_id)",
    )
    .execute(&pool)
    .await
    .map_err(|e| tanaka_server::error::AppError::database("Failed to create target index", e))?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_crdt_operations_type_target ON crdt_operations(operation_type, target_id)")
        .execute(&pool)
        .await
        .map_err(|e| tanaka_server::error::AppError::database("Failed to create type-target index", e))?;

    // Tabs table indexes (optimized for window-based queries)
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_tabs_window ON tabs(window_id)")
        .execute(&pool)
        .await
        .map_err(|e| {
            tanaka_server::error::AppError::database("Failed to create window index", e)
        })?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_tabs_updated ON tabs(updated_at)")
        .execute(&pool)
        .await
        .map_err(|e| {
            tanaka_server::error::AppError::database("Failed to create updated index", e)
        })?;

    // CRDT State indexes (optimized for entity lookups)
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_crdt_state_type ON crdt_state(entity_type)")
        .execute(&pool)
        .await
        .map_err(|e| {
            tanaka_server::error::AppError::database("Failed to create state type index", e)
        })?;

    Ok(pool)
}
