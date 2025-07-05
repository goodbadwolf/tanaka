use std::sync::Arc;

use crate::config::AuthConfig;
use crate::crdt::CrdtManager;
use crate::repository::Repositories;
use crate::services::{
    auth::{MockAuthService, SharedTokenAuthService},
    container::ServiceContainer,
    AuthContext, AuthService,
};
use crate::sync::{CrdtOperation, SyncRequest, TabData};

/// Helper function to create test auth context
fn create_test_auth() -> AuthContext {
    AuthContext {
        device_id: "test-device".to_string(),
        token: "test-token".to_string(),
        permissions: vec!["sync".to_string()],
        metadata: std::collections::HashMap::new(),
    }
}

/// Helper function to create test sync request with device ID
fn create_test_sync_request_for_device(device_id: String) -> SyncRequest {
    SyncRequest {
        clock: 5,
        device_id,
        since_clock: Some(3),
        operations: vec![CrdtOperation::UpsertTab {
            id: "test-tab".to_string(),
            data: TabData {
                window_id: "test-window".to_string(),
                url: "https://example.com".to_string(),
                title: "Test".to_string(),
                active: true,
                index: 0,
                updated_at: 123_456_789,
            },
        }],
    }
}

/// Helper function to create test sync request
fn create_test_sync_request() -> SyncRequest {
    create_test_sync_request_for_device("test-device".to_string())
}

#[tokio::test]
async fn test_service_integration_auth_and_sync() {
    // Create service container
    let container = ServiceContainer::new_mock();

    // Test authentication flow
    let auth_result = container.auth.validate_token("test-token").await;
    assert!(auth_result.is_ok());
    let auth_context = auth_result.unwrap();

    // Test sync flow with authenticated context (using matching device ID)
    let sync_request = create_test_sync_request_for_device(auth_context.device_id.clone());
    let sync_result = container.sync.sync(sync_request, &auth_context).await;
    if let Err(ref e) = sync_result {
        panic!("Sync failed with error: {e:?}");
    }
    assert!(sync_result.is_ok());

    let sync_response = sync_result.unwrap();
    assert!(sync_response.clock > 0);
}

#[tokio::test]
async fn test_service_integration_rate_limiting() {
    let auth_config = AuthConfig {
        shared_token: "test-token".to_string(),
        token_header: "authorization".to_string(),
        rate_limiting: true,
        max_requests_per_minute: 2,
    };

    let repositories = Arc::new(Repositories::new_mock());
    let crdt_manager = Arc::new(CrdtManager::new(1));
    let sync_config = crate::config::SyncConfig::default();
    let container =
        ServiceContainer::new_production(auth_config, sync_config, repositories, crdt_manager);

    // Validate token first
    let auth_result = container.auth.validate_token("test-token").await;
    assert!(auth_result.is_ok());
    let auth_context = auth_result.unwrap();

    // First two requests should pass
    assert!(container
        .auth
        .check_rate_limit(&auth_context.device_id)
        .await
        .unwrap());
    container
        .auth
        .record_request(&auth_context.device_id)
        .await
        .unwrap();

    assert!(container
        .auth
        .check_rate_limit(&auth_context.device_id)
        .await
        .unwrap());
    container
        .auth
        .record_request(&auth_context.device_id)
        .await
        .unwrap();

    // Third request should be rate limited
    assert!(!container
        .auth
        .check_rate_limit(&auth_context.device_id)
        .await
        .unwrap());
}

#[tokio::test]
async fn test_service_validation_errors() {
    let container = ServiceContainer::new_mock();
    let auth_context = create_test_auth();

    // Test sync request with empty device ID (should fail)
    let mut invalid_request = create_test_sync_request();
    invalid_request.device_id = String::new(); // Empty device ID is invalid

    let result = container.sync.sync(invalid_request, &auth_context).await;
    assert!(result.is_err());

    // Test sync request with reserved device ID (should fail)
    let mut reserved_request = create_test_sync_request();
    reserved_request.device_id = "auth-validated".to_string(); // Reserved ID is invalid

    let result2 = container.sync.sync(reserved_request, &auth_context).await;
    assert!(result2.is_err());

    // Test sync request with different (but valid) device ID (should succeed now)
    let mut different_request = create_test_sync_request();
    different_request.device_id = "different-device".to_string();

    let result3 = container.sync.sync(different_request, &auth_context).await;
    assert!(
        result3.is_ok(),
        "Different device IDs should be allowed with shared token auth"
    );
}

#[tokio::test]
async fn test_service_operation_validation() {
    let container = ServiceContainer::new_mock();
    let auth_context = create_test_auth();

    // Test sync request with invalid operation (empty tab ID)
    let invalid_operation = CrdtOperation::UpsertTab {
        id: String::new(), // Invalid: empty ID
        data: TabData {
            window_id: "test-window".to_string(),
            url: "https://example.com".to_string(),
            title: "Test".to_string(),
            active: true,
            index: 0,
            updated_at: 123_456_789,
        },
    };

    let mut invalid_request = create_test_sync_request();
    invalid_request.operations = vec![invalid_operation];

    let result = container.sync.sync(invalid_request, &auth_context).await;
    assert!(result.is_err());
}

#[tokio::test]
async fn test_service_state_management() {
    let container = ServiceContainer::new_mock();
    let auth_context = create_test_auth();

    // Perform a sync to create some state (using matching device ID)
    let sync_request = create_test_sync_request_for_device(auth_context.device_id.clone());
    let sync_result = container.sync.sync(sync_request, &auth_context).await;
    assert!(sync_result.is_ok());

    // Get state for the device
    let state_result = container.sync.get_state(&auth_context.device_id).await;
    assert!(state_result.is_ok());

    let state = state_result.unwrap();
    assert_eq!(state.device_id, auth_context.device_id);
}

#[tokio::test]
async fn test_auth_service_bearer_token_handling() {
    let auth_config = AuthConfig {
        shared_token: "secret-token".to_string(),
        token_header: "authorization".to_string(),
        rate_limiting: false,
        max_requests_per_minute: 60,
    };

    let auth_service = SharedTokenAuthService::new(auth_config);

    // Test with Bearer prefix
    let result1 = auth_service.validate_token("Bearer secret-token").await;
    assert!(result1.is_ok());

    // Test without Bearer prefix
    let result2 = auth_service.validate_token("secret-token").await;
    assert!(result2.is_ok());

    // Both should produce the same device ID
    let context1 = result1.unwrap();
    let context2 = result2.unwrap();
    assert_eq!(context1.device_id, context2.device_id);
}

#[tokio::test]
async fn test_mock_auth_service_configurability() {
    // Test successful auth
    let auth_service = MockAuthService::new();
    let result = auth_service.validate_token("any-token").await;
    assert!(result.is_ok());

    // Test auth failure
    let failing_auth_service = MockAuthService::new().with_auth_failure();
    let result = failing_auth_service.validate_token("any-token").await;
    assert!(result.is_err());

    // Test rate limiting
    let rate_limited_auth_service = MockAuthService::new().with_rate_limiting();
    let result = rate_limited_auth_service.check_rate_limit("device").await;
    assert!(result.is_ok());
    assert!(!result.unwrap()); // Should be rate limited
}

#[tokio::test]
async fn test_sync_service_incremental_vs_initial_sync() {
    let container = ServiceContainer::new_mock();
    let auth_context = create_test_auth();

    // Initial sync (no since_clock)
    let mut initial_request = create_test_sync_request();
    initial_request.since_clock = None;

    let initial_result = container.sync.sync(initial_request, &auth_context).await;
    assert!(initial_result.is_ok());

    // Incremental sync (with since_clock)
    let incremental_request = create_test_sync_request(); // has since_clock = Some(3)
    let incremental_result = container
        .sync
        .sync(incremental_request, &auth_context)
        .await;
    assert!(incremental_result.is_ok());

    // Both should succeed but use different code paths
    let initial_response = initial_result.unwrap();
    let incremental_response = incremental_result.unwrap();

    assert!(initial_response.clock > 0);
    assert!(incremental_response.clock > 0);
}

#[tokio::test]
async fn test_service_error_handling_edge_cases() {
    let container = ServiceContainer::new_mock();
    let auth_context = create_test_auth();

    // Test with too many operations
    let mut overloaded_request = create_test_sync_request();
    overloaded_request.operations = (0..1001) // 1001 operations (over limit of 1000)
        .map(|i| CrdtOperation::UpsertTab {
            id: format!("tab-{i}"),
            data: TabData {
                window_id: "test-window".to_string(),
                url: format!("https://example{i}.com"),
                title: format!("Test {i}"),
                active: i % 2 == 0,
                index: i,
                updated_at: 123_456_789 + u64::try_from(i).unwrap_or(0),
            },
        })
        .collect();

    let result = container.sync.sync(overloaded_request, &auth_context).await;
    assert!(result.is_err());

    // Test with invalid clock values
    let mut invalid_clock_request = create_test_sync_request();
    invalid_clock_request.clock = 1;
    invalid_clock_request.since_clock = Some(5); // since_clock > clock

    let result = container
        .sync
        .sync(invalid_clock_request, &auth_context)
        .await;
    assert!(result.is_err());
}
