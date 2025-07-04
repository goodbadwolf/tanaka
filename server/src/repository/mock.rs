use async_trait::async_trait;
use dashmap::DashMap;
use std::sync::Arc;

use crate::error::AppError;
use crate::models::{Tab, Window};
use crate::repository::{OperationRepository, TabRepository, WindowRepository};
use crate::sync::{CrdtOperation, StoredOperation};

/// Mock implementation of `OperationRepository` for testing
pub struct MockOperationRepository {
    operations: Arc<DashMap<String, StoredOperation>>,
}

impl MockOperationRepository {
    #[must_use]
    pub fn new() -> Self {
        Self {
            operations: Arc::new(DashMap::new()),
        }
    }
}

impl Default for MockOperationRepository {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl OperationRepository for MockOperationRepository {
    async fn store(
        &self,
        operation: &CrdtOperation,
        clock: u64,
        device_id: &str,
    ) -> Result<(), AppError> {
        let operation_id = format!("{}_{}_{}", clock, device_id, operation.target_id());

        let stored = StoredOperation {
            id: operation_id.clone(),
            clock,
            device_id: device_id.to_string(),
            operation: operation.clone(),
            created_at: chrono::Utc::now().timestamp(),
        };

        self.operations.insert(operation_id, stored);
        Ok(())
    }

    async fn get_since(
        &self,
        device_id: &str,
        since_clock: u64,
    ) -> Result<Vec<StoredOperation>, AppError> {
        let mut operations: Vec<StoredOperation> = self
            .operations
            .iter()
            .filter(|entry| entry.clock > since_clock && entry.device_id != device_id)
            .map(|entry| entry.value().clone())
            .collect();

        operations.sort_by_key(|op| op.clock);
        Ok(operations)
    }

    async fn get_recent(
        &self,
        device_id: &str,
        limit: i64,
    ) -> Result<Vec<StoredOperation>, AppError> {
        let mut operations: Vec<StoredOperation> = self
            .operations
            .iter()
            .filter(|entry| entry.device_id != device_id)
            .map(|entry| entry.value().clone())
            .collect();

        operations.sort_by_key(|op| std::cmp::Reverse(op.clock));
        operations.truncate(usize::try_from(limit).unwrap_or(usize::MAX));
        operations.reverse();
        Ok(operations)
    }

    async fn get_max_clock(&self) -> Result<u64, AppError> {
        let max_clock = self
            .operations
            .iter()
            .map(|entry| entry.clock)
            .max()
            .unwrap_or(0);
        Ok(max_clock)
    }

    async fn get_all(&self) -> Result<Vec<StoredOperation>, AppError> {
        let mut operations: Vec<StoredOperation> = self
            .operations
            .iter()
            .map(|entry| entry.value().clone())
            .collect();

        operations.sort_by_key(|op| op.clock);
        Ok(operations)
    }
}

/// Mock implementation of `TabRepository` for testing
pub struct MockTabRepository {
    tabs: Arc<DashMap<String, Tab>>,
}

impl MockTabRepository {
    #[must_use]
    pub fn new() -> Self {
        Self {
            tabs: Arc::new(DashMap::new()),
        }
    }
}

impl Default for MockTabRepository {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl TabRepository for MockTabRepository {
    async fn get(&self, id: &str) -> Result<Option<Tab>, AppError> {
        Ok(self.tabs.get(id).map(|entry| entry.value().clone()))
    }

    async fn upsert(&self, tab: &Tab) -> Result<(), AppError> {
        self.tabs.insert(tab.id.clone(), tab.clone());
        Ok(())
    }

    async fn delete(&self, id: &str) -> Result<(), AppError> {
        self.tabs.remove(id);
        Ok(())
    }

    async fn get_all(&self) -> Result<Vec<Tab>, AppError> {
        let mut tabs: Vec<Tab> = self
            .tabs
            .iter()
            .map(|entry| entry.value().clone())
            .collect();
        tabs.sort_by(|a, b| {
            a.window_id
                .cmp(&b.window_id)
                .then_with(|| a.index.cmp(&b.index))
        });
        Ok(tabs)
    }
}

/// Mock implementation of `WindowRepository` for testing
pub struct MockWindowRepository {
    windows: Arc<DashMap<String, Window>>,
}

impl MockWindowRepository {
    #[must_use]
    pub fn new() -> Self {
        Self {
            windows: Arc::new(DashMap::new()),
        }
    }
}

impl Default for MockWindowRepository {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl WindowRepository for MockWindowRepository {
    async fn get(&self, id: &str) -> Result<Option<Window>, AppError> {
        Ok(self.windows.get(id).map(|entry| entry.value().clone()))
    }

    async fn upsert(&self, window: &Window) -> Result<(), AppError> {
        self.windows.insert(window.id.clone(), window.clone());
        Ok(())
    }

    async fn delete(&self, id: &str) -> Result<(), AppError> {
        self.windows.remove(id);
        Ok(())
    }

    async fn get_all(&self) -> Result<Vec<Window>, AppError> {
        let mut windows: Vec<Window> = self
            .windows
            .iter()
            .map(|entry| entry.value().clone())
            .collect();
        windows.sort_by_key(|w| w.id.clone());
        Ok(windows)
    }

    async fn get_tracked(&self) -> Result<Vec<Window>, AppError> {
        let mut windows: Vec<Window> = self
            .windows
            .iter()
            .map(|entry| entry.value().clone())
            .filter(|w| w.tracked)
            .collect();
        windows.sort_by_key(|w| w.id.clone());
        Ok(windows)
    }
}
