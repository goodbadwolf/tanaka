use async_trait::async_trait;
use std::sync::Arc;

use crate::config::SyncConfig;
use crate::crdt::CrdtManager;
use crate::error::AppError;
use crate::repository::Repositories;
use crate::services::{AuthContext, SyncService, SyncState};
use crate::sync::{CrdtOperation, SyncRequest, SyncResponse};

/// Implementation of `SyncService` that handles CRDT synchronization
pub struct CrdtSyncService {
    repositories: Arc<Repositories>,
    crdt_manager: Arc<CrdtManager>,
    config: SyncConfig,
}

impl CrdtSyncService {
    /// Create a new `SyncService` with the given dependencies
    #[must_use]
    pub fn new(
        repositories: Arc<Repositories>,
        crdt_manager: Arc<CrdtManager>,
        config: SyncConfig,
    ) -> Self {
        Self {
            repositories,
            crdt_manager,
            config,
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
                    if id.len() > 256 {
                        return Err(AppError::validation(
                            "Tab ID too long (max 256 characters)",
                            Some("id"),
                        ));
                    }
                    if data.url.is_empty() {
                        return Err(AppError::validation("Tab URL cannot be empty", Some("url")));
                    }
                    if data.url.len() > self.config.max_url_length {
                        return Err(AppError::validation(
                            format!(
                                "URL too long (max {} characters)",
                                self.config.max_url_length
                            ),
                            Some("url"),
                        ));
                    }
                    if data.title.len() > self.config.max_title_length {
                        return Err(AppError::validation(
                            format!(
                                "Title too long (max {} characters)",
                                self.config.max_title_length
                            ),
                            Some("title"),
                        ));
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
                    if url.len() > self.config.max_url_length {
                        return Err(AppError::validation(
                            format!(
                                "URL too long (max {} characters)",
                                self.config.max_url_length
                            ),
                            Some("url"),
                        ));
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
    fn validate_sync_request(request: &SyncRequest, _auth: &AuthContext) -> Result<(), AppError> {
        // For shared token auth, we trust the client-provided device_id
        // This allows multiple devices to use the same token with different device IDs
        // The auth context validates the token, and we trust the device_id from the request

        // Validate device_id format
        if request.device_id.is_empty() {
            return Err(AppError::validation(
                "Device ID cannot be empty",
                Some("device_id"),
            ));
        }

        // Additional validation: device_id should be a reasonable length and format
        if request.device_id.len() > 128 {
            return Err(AppError::validation(
                "Device ID too long (max 128 characters)",
                Some("device_id"),
            ));
        }

        // Prevent auth context placeholder from being used as actual device ID
        if request.device_id == "auth-validated" {
            return Err(AppError::validation(
                "Invalid device ID format",
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
        let config = crate::config::SyncConfig::default();
        let service = CrdtSyncService::new(repos, crdt_manager, config);

        let operations = vec![create_test_operation()];
        let result = service.validate_operations(&operations).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_validate_operations_empty_tab_id() {
        let repos = Arc::new(Repositories::new_mock());
        let crdt_manager = Arc::new(CrdtManager::new(1));
        let config = crate::config::SyncConfig::default();
        let service = CrdtSyncService::new(repos, crdt_manager, config);

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
        let config = crate::config::SyncConfig::default();
        let _service = CrdtSyncService::new(repos, crdt_manager, config);

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
    async fn test_validate_sync_request_invalid_device_id() {
        let repos = Arc::new(Repositories::new_mock());
        let crdt_manager = Arc::new(CrdtManager::new(1));
        let config = crate::config::SyncConfig::default();
        let _service = CrdtSyncService::new(repos, crdt_manager, config);

        // Test empty device ID
        let request = SyncRequest {
            clock: 5,
            device_id: String::new(), // Empty device ID should fail
            since_clock: Some(3),
            operations: vec![],
        };

        let auth = create_test_auth();
        let result = CrdtSyncService::validate_sync_request(&request, &auth);
        assert!(result.is_err());

        // Test reserved device ID
        let request = SyncRequest {
            clock: 5,
            device_id: "auth-validated".to_string(), // Reserved ID should fail
            since_clock: Some(3),
            operations: vec![],
        };

        let result = CrdtSyncService::validate_sync_request(&request, &auth);
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_validate_operations_url_too_long() {
        let repos = Arc::new(Repositories::new_mock());
        let crdt_manager = Arc::new(CrdtManager::new(1));
        let config = crate::config::SyncConfig::default();
        let service = CrdtSyncService::new(repos, crdt_manager, config);

        let operation = CrdtOperation::UpsertTab {
            id: "test-tab".to_string(),
            data: TabData {
                window_id: "test-window".to_string(),
                url: "https://".to_string() + &"a".repeat(2050), // Exceeds default max of 2048
                title: "Test".to_string(),
                active: true,
                index: 0,
                updated_at: 123_456_789,
            },
        };

        let result = service.validate_operations(&[operation]).await;
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.to_string().contains("URL too long"));
    }

    #[tokio::test]
    async fn test_validate_operations_title_too_long() {
        let repos = Arc::new(Repositories::new_mock());
        let crdt_manager = Arc::new(CrdtManager::new(1));
        let config = crate::config::SyncConfig::default();
        let service = CrdtSyncService::new(repos, crdt_manager, config);

        let operation = CrdtOperation::UpsertTab {
            id: "test-tab".to_string(),
            data: TabData {
                window_id: "test-window".to_string(),
                url: "https://example.com".to_string(),
                title: "a".repeat(513), // Exceeds default max of 512
                active: true,
                index: 0,
                updated_at: 123_456_789,
            },
        };

        let result = service.validate_operations(&[operation]).await;
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.to_string().contains("Title too long"));
    }

    #[tokio::test]
    async fn test_validate_operations_id_too_long() {
        let repos = Arc::new(Repositories::new_mock());
        let crdt_manager = Arc::new(CrdtManager::new(1));
        let config = crate::config::SyncConfig::default();
        let service = CrdtSyncService::new(repos, crdt_manager, config);

        let operation = CrdtOperation::UpsertTab {
            id: "a".repeat(257), // Exceeds max of 256
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
        let err = result.unwrap_err();
        assert!(err.to_string().contains("Tab ID too long"));
    }

    #[tokio::test]
    async fn test_validate_operations_empty_window_id() {
        let repos = Arc::new(Repositories::new_mock());
        let crdt_manager = Arc::new(CrdtManager::new(1));
        let config = crate::config::SyncConfig::default();
        let service = CrdtSyncService::new(repos, crdt_manager, config);

        let operation = CrdtOperation::UpsertTab {
            id: "test-tab".to_string(),
            data: TabData {
                window_id: String::new(), // Empty window ID
                url: "https://example.com".to_string(),
                title: "Test".to_string(),
                active: true,
                index: 0,
                updated_at: 123_456_789,
            },
        };

        let result = service.validate_operations(&[operation]).await;
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.to_string().contains("Window ID cannot be empty"));
    }

    #[tokio::test]
    async fn test_validate_operations_move_tab_empty_window_id() {
        let repos = Arc::new(Repositories::new_mock());
        let crdt_manager = Arc::new(CrdtManager::new(1));
        let config = crate::config::SyncConfig::default();
        let service = CrdtSyncService::new(repos, crdt_manager, config);

        let operation = CrdtOperation::MoveTab {
            id: "test-tab".to_string(),
            window_id: String::new(), // Empty window ID
            index: 0,
            updated_at: 123_456_789,
        };

        let result = service.validate_operations(&[operation]).await;
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.to_string().contains("Window ID cannot be empty"));
    }

    #[tokio::test]
    async fn test_validate_operations_tab_id_at_limit() {
        let repos = Arc::new(Repositories::new_mock());
        let crdt_manager = Arc::new(CrdtManager::new(1));
        let config = crate::config::SyncConfig::default();
        let service = CrdtSyncService::new(repos, crdt_manager, config);

        let operation = CrdtOperation::UpsertTab {
            id: "a".repeat(256), // Exactly at the limit
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
        assert!(result.is_ok()); // Should pass at exactly 256 chars
    }

    #[tokio::test]
    async fn test_validate_operations_empty_track_window_id() {
        let repos = Arc::new(Repositories::new_mock());
        let crdt_manager = Arc::new(CrdtManager::new(1));
        let config = crate::config::SyncConfig::default();
        let service = CrdtSyncService::new(repos, crdt_manager, config);

        let operation = CrdtOperation::TrackWindow {
            id: String::new(), // Empty window ID
            tracked: true,
            updated_at: 123_456_789,
        };

        let result = service.validate_operations(&[operation]).await;
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.to_string().contains("Window ID cannot be empty"));
    }

    #[tokio::test]
    async fn test_validate_operations_empty_untrack_window_id() {
        let repos = Arc::new(Repositories::new_mock());
        let crdt_manager = Arc::new(CrdtManager::new(1));
        let config = crate::config::SyncConfig::default();
        let service = CrdtSyncService::new(repos, crdt_manager, config);

        let operation = CrdtOperation::UntrackWindow {
            id: String::new(), // Empty window ID
            updated_at: 123_456_789,
        };

        let result = service.validate_operations(&[operation]).await;
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.to_string().contains("Window ID cannot be empty"));
    }

    #[tokio::test]
    async fn test_validate_operations_empty_set_window_focus_id() {
        let repos = Arc::new(Repositories::new_mock());
        let crdt_manager = Arc::new(CrdtManager::new(1));
        let config = crate::config::SyncConfig::default();
        let service = CrdtSyncService::new(repos, crdt_manager, config);

        let operation = CrdtOperation::SetWindowFocus {
            id: String::new(), // Empty window ID
            focused: true,
            updated_at: 123_456_789,
        };

        let result = service.validate_operations(&[operation]).await;
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.to_string().contains("Window ID cannot be empty"));
    }

    #[tokio::test]
    async fn test_validate_operations_empty_close_tab_id() {
        let repos = Arc::new(Repositories::new_mock());
        let crdt_manager = Arc::new(CrdtManager::new(1));
        let config = crate::config::SyncConfig::default();
        let service = CrdtSyncService::new(repos, crdt_manager, config);

        let operation = CrdtOperation::CloseTab {
            id: String::new(), // Empty tab ID
            closed_at: 123_456_789,
        };

        let result = service.validate_operations(&[operation]).await;
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.to_string().contains("Tab ID cannot be empty"));
    }

    #[tokio::test]
    async fn test_validate_operations_empty_set_active_id() {
        let repos = Arc::new(Repositories::new_mock());
        let crdt_manager = Arc::new(CrdtManager::new(1));
        let config = crate::config::SyncConfig::default();
        let service = CrdtSyncService::new(repos, crdt_manager, config);

        let operation = CrdtOperation::SetActive {
            id: String::new(), // Empty tab ID
            active: true,
            updated_at: 123_456_789,
        };

        let result = service.validate_operations(&[operation]).await;
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.to_string().contains("Tab ID cannot be empty"));
    }

    #[tokio::test]
    async fn test_validate_operations_empty_change_url_id() {
        let repos = Arc::new(Repositories::new_mock());
        let crdt_manager = Arc::new(CrdtManager::new(1));
        let config = crate::config::SyncConfig::default();
        let service = CrdtSyncService::new(repos, crdt_manager, config);

        let operation = CrdtOperation::ChangeUrl {
            id: String::new(), // Empty tab ID
            url: "https://example.com".to_string(),
            title: Some("Test".to_string()),
            updated_at: 123_456_789,
        };

        let result = service.validate_operations(&[operation]).await;
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.to_string().contains("Tab ID cannot be empty"));
    }

    #[tokio::test]
    async fn test_validate_operations_empty_move_tab_id() {
        let repos = Arc::new(Repositories::new_mock());
        let crdt_manager = Arc::new(CrdtManager::new(1));
        let config = crate::config::SyncConfig::default();
        let service = CrdtSyncService::new(repos, crdt_manager, config);

        let operation = CrdtOperation::MoveTab {
            id: String::new(), // Empty tab ID
            window_id: "test-window".to_string(),
            index: 0,
            updated_at: 123_456_789,
        };

        let result = service.validate_operations(&[operation]).await;
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.to_string().contains("Tab ID cannot be empty"));
    }
}
