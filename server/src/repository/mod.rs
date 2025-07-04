use async_trait::async_trait;
use sqlx::SqlitePool;
use std::sync::Arc;

use crate::error::AppError;
use crate::models::{Tab, Window};
use crate::sync::{CrdtOperation, StoredOperation};

pub mod mock;
pub mod sqlite;
#[cfg(test)]
mod tests;

/// Repository for CRDT operations
#[async_trait]
pub trait OperationRepository: Send + Sync {
    /// Store a new CRDT operation with clock and device_id
    async fn store(
        &self,
        operation: &CrdtOperation,
        clock: u64,
        device_id: &str,
    ) -> Result<(), AppError>;

    /// Get operations since a given clock value, excluding operations from the specified device
    async fn get_since(
        &self,
        device_id: &str,
        since_clock: u64,
    ) -> Result<Vec<StoredOperation>, AppError>;

    /// Get recent operations, excluding operations from the specified device
    async fn get_recent(
        &self,
        device_id: &str,
        limit: i64,
    ) -> Result<Vec<StoredOperation>, AppError>;

    /// Get the maximum clock value from stored operations
    async fn get_max_clock(&self) -> Result<u64, AppError>;

    /// Get all operations in chronological order for state reconstruction
    async fn get_all(&self) -> Result<Vec<StoredOperation>, AppError>;
}

/// Repository for tab operations
#[async_trait]
pub trait TabRepository: Send + Sync {
    /// Get a tab by ID
    async fn get(&self, id: &str) -> Result<Option<Tab>, AppError>;

    /// Insert or update a tab
    async fn upsert(&self, tab: &Tab) -> Result<(), AppError>;

    /// Delete a tab by ID
    async fn delete(&self, id: &str) -> Result<(), AppError>;

    /// Get all tabs
    async fn get_all(&self) -> Result<Vec<Tab>, AppError>;
}

/// Repository for window operations
#[async_trait]
pub trait WindowRepository: Send + Sync {
    /// Get a window by ID
    async fn get(&self, id: &str) -> Result<Option<Window>, AppError>;

    /// Insert or update a window
    async fn upsert(&self, window: &Window) -> Result<(), AppError>;

    /// Delete a window by ID
    async fn delete(&self, id: &str) -> Result<(), AppError>;

    /// Get all windows
    async fn get_all(&self) -> Result<Vec<Window>, AppError>;

    /// Get all tracked windows
    async fn get_tracked(&self) -> Result<Vec<Window>, AppError>;
}

/// Container for all repositories
pub struct Repositories {
    pub operations: Arc<dyn OperationRepository>,
    pub tabs: Arc<dyn TabRepository>,
    pub windows: Arc<dyn WindowRepository>,
}

impl Repositories {
    /// Create new repositories with `SQLite` implementation and shared statement cache
    #[must_use]
    pub fn new_sqlite(pool: SqlitePool) -> Self {
        let pool = Arc::new(pool);
        // Create shared statement cache for optimal performance
        let cache = Arc::new(sqlite::StatementCache::new(Arc::clone(&pool)));

        Self {
            operations: Arc::new(sqlite::SqliteOperationRepository::with_cache(
                Arc::clone(&pool),
                Arc::clone(&cache),
            )),
            tabs: Arc::new(sqlite::SqliteTabRepository::with_cache(
                Arc::clone(&pool),
                Arc::clone(&cache),
            )),
            windows: Arc::new(sqlite::SqliteWindowRepository::with_cache(
                Arc::clone(&pool),
                Arc::clone(&cache),
            )),
        }
    }

    /// Create new repositories with mock implementation for testing
    #[must_use]
    pub fn new_mock() -> Self {
        Self {
            operations: Arc::new(mock::MockOperationRepository::new()),
            tabs: Arc::new(mock::MockTabRepository::new()),
            windows: Arc::new(mock::MockWindowRepository::new()),
        }
    }
}
