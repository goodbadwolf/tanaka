use dashmap::DashMap;
use sqlx::{Executor, SqlitePool};
use std::sync::Arc;

/// A thread-safe cache for prepared `SQLite` statements to improve performance
/// by avoiding recompilation of frequently used queries.
///
/// This cache tracks which statements have been prepared to ensure they are warmed up
/// on database startup. `SQLx` handles the actual statement caching internally.
pub struct StatementCache {
    /// The underlying database connection pool
    pool: Arc<SqlitePool>,
    /// Cache tracking which statement keys have been prepared
    /// Key format: "table:operation" (e.g., "`crdt_operations:insert`", "`tabs:select_by_id`")
    prepared_statements: DashMap<String, bool>,
}

impl StatementCache {
    /// Creates a new statement cache with the given database pool.
    #[must_use]
    pub fn new(pool: Arc<SqlitePool>) -> Self {
        Self {
            pool,
            prepared_statements: DashMap::new(),
        }
    }

    /// Ensures a statement is prepared and tracked in the cache.
    ///
    /// This method prepares the statement if it hasn't been prepared before.
    /// `SQLx` handles the actual caching internally, so we just track that
    /// the statement has been warmed up.
    ///
    /// # Arguments
    ///
    /// * `key` - Unique identifier for the statement (e.g., "`crdt_operations:insert`")
    /// * `sql` - The SQL query to prepare if not cached
    ///
    /// # Errors
    ///
    /// Returns a database error if statement preparation fails.
    pub async fn get_or_prepare(&self, key: &str, sql: &str) -> Result<(), sqlx::Error> {
        // Check if statement has already been prepared
        if self.prepared_statements.contains_key(key) {
            return Ok(());
        }

        // Prepare the statement to warm up SQLx's internal cache
        let _stmt = self.pool.prepare(sql).await?;

        // Mark as prepared
        self.prepared_statements.insert(key.to_string(), true);

        Ok(())
    }

    /// Pre-warms the cache with commonly used statements to improve initial performance.
    /// Should be called during application startup.
    ///
    /// # Errors
    ///
    /// Returns a database error if any statement preparation fails.
    pub async fn warm_cache(&self) -> Result<(), sqlx::Error> {
        // CRDT Operations statements
        self.get_or_prepare(
            "crdt_operations:insert",
            r"INSERT INTO crdt_operations (
                id, clock, device_id, operation_type, target_id, operation_data, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .await?;

        self.get_or_prepare(
            "crdt_operations:get_since",
            "SELECT id, clock, device_id, operation_type, target_id, operation_data, created_at
             FROM crdt_operations
             WHERE clock > ? AND device_id != ?
             ORDER BY clock ASC",
        )
        .await?;

        self.get_or_prepare(
            "crdt_operations:get_recent",
            "SELECT id, clock, device_id, operation_type, target_id, operation_data, created_at
             FROM crdt_operations
             WHERE device_id != ?
             ORDER BY clock DESC
             LIMIT ?",
        )
        .await?;

        // Tabs statements
        self.get_or_prepare(
            "tabs:insert_or_replace",
            "INSERT OR REPLACE INTO tabs (id, window_id, url, title, active, \"index\", updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .await?;

        self.get_or_prepare(
            "tabs:select_by_id",
            "SELECT id, window_id, url, title, active, \"index\", updated_at FROM tabs WHERE id = ?",
        ).await?;

        self.get_or_prepare("tabs:delete_by_id", "DELETE FROM tabs WHERE id = ?")
            .await?;

        self.get_or_prepare(
            "tabs:select_all",
            "SELECT id, window_id, url, title, active, \"index\", updated_at FROM tabs ORDER BY window_id, \"index\"",
        ).await?;

        // Windows statements
        self.get_or_prepare(
            "windows:insert_or_replace",
            "INSERT OR REPLACE INTO windows (id, tracked, tab_count, updated_at) VALUES (?, ?, ?, ?)",
        ).await?;

        self.get_or_prepare(
            "windows:select_by_id",
            "SELECT id, tracked, tab_count, updated_at FROM windows WHERE id = ?",
        )
        .await?;

        self.get_or_prepare("windows:delete_by_id", "DELETE FROM windows WHERE id = ?")
            .await?;

        self.get_or_prepare(
            "windows:select_all",
            "SELECT id, tracked, tab_count, updated_at FROM windows ORDER BY id",
        )
        .await?;

        self.get_or_prepare(
            "windows:select_tracked",
            "SELECT id, tracked, tab_count, updated_at FROM windows WHERE tracked = true ORDER BY id",
        ).await?;

        Ok(())
    }

    /// Returns the number of prepared statements.
    #[must_use]
    pub fn size(&self) -> usize {
        self.prepared_statements.len()
    }

    /// Clears the statement cache. Useful for testing or memory management.
    pub fn clear(&self) {
        self.prepared_statements.clear();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::SqlitePool;

    async fn setup_test_pool() -> SqlitePool {
        SqlitePool::connect(":memory:").await.unwrap()
    }

    #[tokio::test]
    async fn test_statement_cache_basic_operations() {
        let pool = setup_test_pool().await;
        let cache = StatementCache::new(Arc::new(pool));

        // Test cache miss - statement should be prepared and tracked
        cache
            .get_or_prepare("test:select", "SELECT 1")
            .await
            .unwrap();

        assert_eq!(cache.size(), 1);

        // Test cache hit - statement should not be prepared again
        cache
            .get_or_prepare("test:select", "SELECT 1")
            .await
            .unwrap();

        assert_eq!(cache.size(), 1);
    }

    #[tokio::test]
    async fn test_statement_cache_warm_cache() {
        let pool = setup_test_pool().await;
        let cache = StatementCache::new(Arc::new(pool));

        // Initially empty
        assert_eq!(cache.size(), 0);

        // Note: warm_cache() will fail on :memory: db without tables, but we test the logic
        // In real usage, this would be called after database initialization
        let result = cache.warm_cache().await;

        // We expect this to fail since tables don't exist in memory DB
        assert!(result.is_err());

        // But we can test with a simple statement that should work
        cache
            .get_or_prepare("test:simple", "SELECT 1")
            .await
            .unwrap();
        assert_eq!(cache.size(), 1);
    }

    #[tokio::test]
    async fn test_statement_cache_clear() {
        let pool = setup_test_pool().await;
        let cache = StatementCache::new(Arc::new(pool));

        // Add some statements
        cache.get_or_prepare("test:1", "SELECT 1").await.unwrap();
        cache.get_or_prepare("test:2", "SELECT 2").await.unwrap();
        assert_eq!(cache.size(), 2);

        // Clear cache
        cache.clear();
        assert_eq!(cache.size(), 0);
    }

    #[tokio::test]
    async fn test_statement_cache_different_keys() {
        let pool = setup_test_pool().await;
        let cache = StatementCache::new(Arc::new(pool));

        // Different keys should create different cache entries
        cache.get_or_prepare("test:1", "SELECT 1").await.unwrap();
        cache.get_or_prepare("test:2", "SELECT 2").await.unwrap();
        cache.get_or_prepare("test:3", "SELECT 3").await.unwrap();

        assert_eq!(cache.size(), 3);
    }
}
