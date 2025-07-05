use crate::error::AppResult;
use crate::services::container::ServiceContainer;
use crate::services::AuthContext;
use crate::sync::{SyncRequest, SyncResponse};
use axum::{
    extract::{Extension, State},
    Json,
};
use std::sync::Arc;

/// HTTP handler for sync endpoint that uses the service layer
///
/// # Errors
///
/// Returns `AppError` if sync operation fails
pub async fn sync_handler(
    State(services): State<Arc<ServiceContainer>>,
    Extension(auth): Extension<AuthContext>,
    Json(request): Json<SyncRequest>,
) -> AppResult<Json<SyncResponse>> {
    let response = services.sync.sync(request, &auth).await?;
    Ok(Json(response))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::error::AppError;
    use crate::services::{SyncService, SyncState};
    use crate::sync::CrdtOperation;
    use async_trait::async_trait;
    use axum::http::StatusCode;
    use std::collections::HashMap;

    struct MockSyncService {
        should_fail: bool,
        error_validation: bool,
        error_database: bool,
    }

    #[async_trait]
    impl SyncService for MockSyncService {
        async fn sync(
            &self,
            _request: SyncRequest,
            _auth: &AuthContext,
        ) -> Result<SyncResponse, AppError> {
            if self.should_fail {
                if self.error_validation {
                    Err(AppError::validation("Invalid request", Some("test")))
                } else if self.error_database {
                    Err(AppError::database(
                        "Database connection failed",
                        sqlx::Error::PoolTimedOut,
                    ))
                } else {
                    Err(AppError::internal("Mock sync error"))
                }
            } else {
                Ok(SyncResponse {
                    clock: 1,
                    operations: vec![],
                })
            }
        }

        async fn get_state(&self, _device_id: &str) -> Result<SyncState, AppError> {
            Ok(SyncState {
                device_id: "test".to_string(),
                last_clock: 0,
                operation_count: 0,
                last_sync_at: 0,
            })
        }

        async fn validate_operations(&self, _operations: &[CrdtOperation]) -> Result<(), AppError> {
            Ok(())
        }
    }

    #[tokio::test]
    async fn test_sync_handler_success() {
        let sync_service = MockSyncService {
            should_fail: false,
            error_validation: false,
            error_database: false,
        };

        let container = ServiceContainer::new_custom(
            Arc::new(crate::services::auth::MockAuthService::new()),
            Arc::new(sync_service),
        );

        let auth = AuthContext {
            device_id: "test-device".to_string(),
            token: "test-token".to_string(),
            permissions: vec!["sync".to_string()],
            metadata: HashMap::new(),
        };

        let request = SyncRequest {
            clock: 1,
            device_id: "test-device".to_string(),
            since_clock: None,
            operations: vec![],
        };

        let result = sync_handler(State(Arc::new(container)), Extension(auth), Json(request)).await;

        assert!(result.is_ok());
        let Json(response) = result.unwrap();
        assert_eq!(response.clock, 1);
        assert_eq!(response.operations.len(), 0);
    }

    #[tokio::test]
    async fn test_sync_handler_validation_error() {
        let sync_service = MockSyncService {
            should_fail: true,
            error_validation: true,
            error_database: false,
        };

        let container = ServiceContainer::new_custom(
            Arc::new(crate::services::auth::MockAuthService::new()),
            Arc::new(sync_service),
        );

        let auth = AuthContext {
            device_id: "test-device".to_string(),
            token: "test-token".to_string(),
            permissions: vec!["sync".to_string()],
            metadata: HashMap::new(),
        };

        let request = SyncRequest {
            clock: 1,
            device_id: "test-device".to_string(),
            since_clock: None,
            operations: vec![],
        };

        let result = sync_handler(State(Arc::new(container)), Extension(auth), Json(request)).await;

        assert!(result.is_err());
        let err = result.unwrap_err();
        assert_eq!(err.status_code(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn test_sync_handler_database_error() {
        let sync_service = MockSyncService {
            should_fail: true,
            error_validation: false,
            error_database: true,
        };

        let container = ServiceContainer::new_custom(
            Arc::new(crate::services::auth::MockAuthService::new()),
            Arc::new(sync_service),
        );

        let auth = AuthContext {
            device_id: "test-device".to_string(),
            token: "test-token".to_string(),
            permissions: vec!["sync".to_string()],
            metadata: HashMap::new(),
        };

        let request = SyncRequest {
            clock: 1,
            device_id: "test-device".to_string(),
            since_clock: None,
            operations: vec![],
        };

        let result = sync_handler(State(Arc::new(container)), Extension(auth), Json(request)).await;

        assert!(result.is_err());
        let err = result.unwrap_err();
        assert_eq!(err.status_code(), StatusCode::INTERNAL_SERVER_ERROR);
    }

    #[tokio::test]
    async fn test_sync_handler_internal_error() {
        let sync_service = MockSyncService {
            should_fail: true,
            error_validation: false,
            error_database: false,
        };

        let container = ServiceContainer::new_custom(
            Arc::new(crate::services::auth::MockAuthService::new()),
            Arc::new(sync_service),
        );

        let auth = AuthContext {
            device_id: "test-device".to_string(),
            token: "test-token".to_string(),
            permissions: vec!["sync".to_string()],
            metadata: HashMap::new(),
        };

        let request = SyncRequest {
            clock: 1,
            device_id: "test-device".to_string(),
            since_clock: None,
            operations: vec![],
        };

        let result = sync_handler(State(Arc::new(container)), Extension(auth), Json(request)).await;

        assert!(result.is_err());
        let err = result.unwrap_err();
        assert_eq!(err.status_code(), StatusCode::INTERNAL_SERVER_ERROR);
    }
}
