use async_trait::async_trait;
use std::sync::Arc;

use crate::crdt::CrdtManager;
use crate::error::AppError;
use crate::repository::Repositories;
use crate::services::{AuthContext, SyncService, SyncState};
use crate::sync::{CrdtOperation, SyncRequest, SyncResponse};

/// Implementation of `SyncService` that handles CRDT synchronization
pub struct CrdtSyncService {
    repositories: Arc<Repositories>,
    crdt_manager: Arc<CrdtManager>,
}

impl CrdtSyncService {
    /// Create a new `SyncService` with the given dependencies
    #[must_use]
    pub fn new(repositories: Arc<Repositories>, crdt_manager: Arc<CrdtManager>) -> Self {
        Self {
            repositories,
            crdt_manager,
        }
    }
}

#[async_trait]
impl SyncService for CrdtSyncService {
    async fn sync(
        &self,
        request: SyncRequest,
        auth: &AuthContext,
    ) -> Result<SyncResponse, AppError> {
        // Validate the request
        Self::validate_sync_request(&request, auth)?;

        // Validate operations before processing
        self.validate_operations(&request.operations).await?;

        // Update server clock based on client clock
        let server_clock = self.crdt_manager.update_clock(request.clock);

        // Store incoming operations
        for operation in &request.operations {
            let operation_clock = self.crdt_manager.tick_clock();
            self.repositories
                .operations
                .store(operation, operation_clock, &request.device_id)
                .await?;
        }

        // Get operations to send back to client
        let operations = if let Some(since_clock) = request.since_clock {
            // Incremental sync: get operations since the specified clock
            self.repositories
                .operations
                .get_since(&request.device_id, since_clock)
                .await?
                .into_iter()
                .map(|stored_op| stored_op.operation)
                .collect()
        } else {
            // Initial sync: get recent operations (up to 100)
            self.repositories
                .operations
                .get_recent(&request.device_id, 100)
                .await?
                .into_iter()
                .map(|stored_op| stored_op.operation)
                .collect()
        };

        Ok(SyncResponse {
            clock: server_clock,
            operations,
        })
    }

    async fn get_state(&self, device_id: &str) -> Result<SyncState, AppError> {
        // Get recent operations to determine state
        let recent_ops = self
            .repositories
            .operations
            .get_recent(device_id, 1)
            .await?;

        let last_clock = recent_ops.first().map_or(0, |op| op.clock);

        // Get total operation count (simplified - in production might want to cache this)
        let all_ops = self
            .repositories
            .operations
            .get_recent(device_id, 1000)
            .await?;

        Ok(SyncState {
            device_id: device_id.to_string(),
            last_clock,
            operation_count: all_ops.len(),
            last_sync_at: chrono::Utc::now().timestamp(),
        })
    }

    async fn validate_operations(&self, operations: &[CrdtOperation]) -> Result<(), AppError> {
        for operation in operations {
            // Validate each operation
            match operation {
                CrdtOperation::UpsertTab { id, data } => {
                    if id.is_empty() {
                        return Err(AppError::validation("Tab ID cannot be empty", Some("id")));
                    }
                    if data.url.is_empty() {
                        return Err(AppError::validation("Tab URL cannot be empty", Some("url")));
                    }
                    if data.window_id.is_empty() {
                        return Err(AppError::validation(
                            "Window ID cannot be empty",
                            Some("window_id"),
                        ));
                    }
                }
                CrdtOperation::CloseTab { id, .. } | CrdtOperation::SetActive { id, .. } => {
                    if id.is_empty() {
                        return Err(AppError::validation("Tab ID cannot be empty", Some("id")));
                    }
                }
                CrdtOperation::ChangeUrl { id, url, .. } => {
                    if id.is_empty() {
                        return Err(AppError::validation("Tab ID cannot be empty", Some("id")));
                    }
                    if url.is_empty() {
                        return Err(AppError::validation("URL cannot be empty", Some("url")));
                    }
                }
                CrdtOperation::MoveTab { id, window_id, .. } => {
                    if id.is_empty() {
                        return Err(AppError::validation("Tab ID cannot be empty", Some("id")));
                    }
                    if window_id.is_empty() {
                        return Err(AppError::validation(
                            "Window ID cannot be empty",
                            Some("window_id"),
                        ));
                    }
                }
                CrdtOperation::TrackWindow { id, .. }
                | CrdtOperation::UntrackWindow { id, .. }
                | CrdtOperation::SetWindowFocus { id, .. } => {
                    if id.is_empty() {
                        return Err(AppError::validation(
                            "Window ID cannot be empty",
                            Some("id"),
                        ));
                    }
                }
            }
        }

        Ok(())
    }
}

impl CrdtSyncService {
    /// Validate the sync request structure and authentication
    fn validate_sync_request(request: &SyncRequest, auth: &AuthContext) -> Result<(), AppError> {
        // Ensure device_id matches authenticated device
        if request.device_id != auth.device_id {
            return Err(AppError::auth_token_invalid(
                "Device ID in request does not match authenticated device",
            ));
        }

        // Validate device_id format
        if request.device_id.is_empty() {
            return Err(AppError::validation(
                "Device ID cannot be empty",
                Some("device_id"),
            ));
        }

        // Validate clock values
        if let Some(since_clock) = request.since_clock {
            if since_clock > request.clock {
                return Err(AppError::validation(
                    "since_clock cannot be greater than current clock",
                    Some("since_clock"),
                ));
            }
        }

        // Validate operation count (prevent abuse)
        if request.operations.len() > 1000 {
            return Err(AppError::validation(
                "Too many operations in single request (max 1000)",
                Some("operations"),
            ));
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::repository::Repositories;
    use crate::sync::TabData;

    fn create_test_auth() -> AuthContext {
        AuthContext {
            device_id: "test-device".to_string(),
            token: "test-token".to_string(),
            permissions: vec!["sync".to_string()],
            metadata: std::collections::HashMap::new(),
        }
    }

    fn create_test_operation() -> CrdtOperation {
        CrdtOperation::UpsertTab {
            id: "test-tab".to_string(),
            data: TabData {
                window_id: "test-window".to_string(),
                url: "https://example.com".to_string(),
                title: "Test".to_string(),
                active: true,
                index: 0,
                updated_at: 123_456_789,
            },
        }
    }

    #[tokio::test]
    async fn test_validate_operations_success() {
        let repos = Arc::new(Repositories::new_mock());
        let crdt_manager = Arc::new(CrdtManager::new(1));
        let service = CrdtSyncService::new(repos, crdt_manager);

        let operations = vec![create_test_operation()];
        let result = service.validate_operations(&operations).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_validate_operations_empty_tab_id() {
        let repos = Arc::new(Repositories::new_mock());
        let crdt_manager = Arc::new(CrdtManager::new(1));
        let service = CrdtSyncService::new(repos, crdt_manager);

        let operation = CrdtOperation::UpsertTab {
            id: String::new(), // Empty ID should fail
            data: TabData {
                window_id: "test-window".to_string(),
                url: "https://example.com".to_string(),
                title: "Test".to_string(),
                active: true,
                index: 0,
                updated_at: 123_456_789,
            },
        };

        let result = service.validate_operations(&[operation]).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_validate_sync_request_success() {
        let repos = Arc::new(Repositories::new_mock());
        let crdt_manager = Arc::new(CrdtManager::new(1));
        let _service = CrdtSyncService::new(repos, crdt_manager);

        let request = SyncRequest {
            clock: 5,
            device_id: "test-device".to_string(),
            since_clock: Some(3),
            operations: vec![],
        };

        let auth = create_test_auth();
        let result = CrdtSyncService::validate_sync_request(&request, &auth);
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_validate_sync_request_device_mismatch() {
        let repos = Arc::new(Repositories::new_mock());
        let crdt_manager = Arc::new(CrdtManager::new(1));
        let _service = CrdtSyncService::new(repos, crdt_manager);

        let request = SyncRequest {
            clock: 5,
            device_id: "different-device".to_string(), // Different from auth
            since_clock: Some(3),
            operations: vec![],
        };

        let auth = create_test_auth();
        let result = CrdtSyncService::validate_sync_request(&request, &auth);
        assert!(result.is_err());
    }
}
