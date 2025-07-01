use axum::{
    body::Body,
    http::{Request, StatusCode},
    Router,
};
use http_body_util::BodyExt;
use sqlx::SqlitePool;
use std::sync::Arc;
use tanaka_server::{
    config::{AuthConfig, DatabaseConfig},
    crdt::CrdtManager,
    setup_database,
    sync::{CrdtOperation, SyncRequest, SyncResponse, TabData},
};
use tower::ServiceExt;

/// Create a test database in memory
async fn create_test_db() -> SqlitePool {
    let config = DatabaseConfig {
        url: "sqlite::memory:".to_string(),
        max_connections: 5,
        connection_timeout_secs: 30,
    };

    setup_database(&config)
        .await
        .expect("Failed to setup test database")
}

/// Create a test app with auth middleware
fn create_test_app(db_pool: SqlitePool) -> Router {
    let crdt_manager = Arc::new(CrdtManager::new(1)); // Node ID 1 for tests
    let auth_config = AuthConfig {
        shared_token: "test-token".to_string(),
        token_header: "authorization".to_string(),
        rate_limiting: false,
        max_requests_per_minute: 60,
    };

    tanaka_server::create_app(db_pool, crdt_manager, auth_config)
}

/// Helper to make authenticated requests
async fn make_sync_request(
    app: Router,
    token: &str,
    request_body: SyncRequest,
) -> (StatusCode, String) {
    let request = Request::builder()
        .method("POST")
        .uri("/sync")
        .header("Authorization", format!("Bearer {token}"))
        .header("Content-Type", "application/json")
        .body(Body::from(serde_json::to_string(&request_body).unwrap()))
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    let status = response.status();
    let body_bytes = response.into_body().collect().await.unwrap().to_bytes();
    let body_string = String::from_utf8(body_bytes.to_vec()).unwrap();

    (status, body_string)
}

#[tokio::test]
async fn test_sync_with_empty_operations() {
    // Setup
    let db_pool = create_test_db().await;
    let app = create_test_app(db_pool);

    // Create request with no operations
    let request = SyncRequest {
        clock: 0,
        device_id: "test-device-1".to_string(),
        since_clock: None,
        operations: vec![],
    };

    // Make request
    let (status, body) = make_sync_request(app, "test-token", request).await;

    // Verify response
    assert_eq!(status, StatusCode::OK);
    let response: SyncResponse = serde_json::from_str(&body).unwrap();
    assert_eq!(response.operations.len(), 0);
}

#[tokio::test]
async fn test_sync_unauthorized() {
    // Setup
    let db_pool = create_test_db().await;
    let app = create_test_app(db_pool);

    // Create request
    let request = SyncRequest {
        clock: 0,
        device_id: "test-device-1".to_string(),
        since_clock: None,
        operations: vec![],
    };

    // Make request with wrong token
    let (status, _body) = make_sync_request(app, "wrong-token", request).await;

    // Verify response
    assert_eq!(status, StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_sync_with_upsert_tab_operation() {
    // Setup
    let db_pool = create_test_db().await;
    let app = create_test_app(db_pool);

    // Create request with upsert tab operation
    let operation = CrdtOperation::UpsertTab {
        id: "tab-1".to_string(),
        data: TabData {
            window_id: "window-1".to_string(),
            url: "https://example.com".to_string(),
            title: "Example".to_string(),
            active: true,
            index: 0,
            updated_at: 123_456_789,
        },
    };

    let request = SyncRequest {
        clock: 1,
        device_id: "test-device-1".to_string(),
        since_clock: None,
        operations: vec![operation],
    };

    // Make request
    let (status, body) = make_sync_request(app, "test-token", request).await;

    // Verify response
    assert_eq!(status, StatusCode::OK);
    let response: SyncResponse = serde_json::from_str(&body).unwrap();

    // Server should update clock
    assert!(response.clock >= 1);

    // Since this is the first sync, no operations should be returned
    assert_eq!(response.operations.len(), 0);
}

#[tokio::test]
async fn test_sync_between_devices() {
    // Setup
    let db_pool = create_test_db().await;
    let app = create_test_app(db_pool);

    // Device 1 sends an operation
    let operation1 = CrdtOperation::UpsertTab {
        id: "tab-1".to_string(),
        data: TabData {
            window_id: "window-1".to_string(),
            url: "https://example.com".to_string(),
            title: "Example".to_string(),
            active: true,
            index: 0,
            updated_at: 123_456_789,
        },
    };

    let request1 = SyncRequest {
        clock: 1,
        device_id: "device-1".to_string(),
        since_clock: None,
        operations: vec![operation1],
    };

    let (status1, body1) = make_sync_request(app.clone(), "test-token", request1).await;
    assert_eq!(status1, StatusCode::OK);
    let _response1: SyncResponse = serde_json::from_str(&body1).unwrap();

    // Device 2 syncs and should receive device 1's operation
    let request2 = SyncRequest {
        clock: 0,
        device_id: "device-2".to_string(),
        since_clock: None,
        operations: vec![],
    };

    let (status2, body2) = make_sync_request(app.clone(), "test-token", request2).await;
    assert_eq!(status2, StatusCode::OK);
    let response2: SyncResponse = serde_json::from_str(&body2).unwrap();

    // Device 2 should receive the operation from device 1
    assert_eq!(response2.operations.len(), 1);

    match &response2.operations[0] {
        CrdtOperation::UpsertTab { id, data } => {
            assert_eq!(id, "tab-1");
            assert_eq!(data.url, "https://example.com");
        }
        _ => panic!("Expected UpsertTab operation"),
    }
}

#[tokio::test]
async fn test_sync_with_multiple_operation_types() {
    let db_pool = create_test_db().await;
    let app = create_test_app(db_pool);

    // Create various operations - use different tabs to avoid ID conflicts
    let operations = vec![
        CrdtOperation::UpsertTab {
            id: "tab-1".to_string(),
            data: TabData {
                window_id: "window-1".to_string(),
                url: "https://example.com".to_string(),
                title: "Example".to_string(),
                active: true,
                index: 0,
                updated_at: 123_456_789,
            },
        },
        CrdtOperation::UpsertTab {
            id: "tab-2".to_string(),
            data: TabData {
                window_id: "window-1".to_string(),
                url: "https://example2.com".to_string(),
                title: "Example 2".to_string(),
                active: false,
                index: 1,
                updated_at: 123_456_790,
            },
        },
        CrdtOperation::TrackWindow {
            id: "window-1".to_string(),
            tracked: true,
            updated_at: 123_456_791,
        },
        CrdtOperation::ChangeUrl {
            id: "tab-1".to_string(),
            url: "https://updated.com".to_string(),
            title: Some("Updated".to_string()),
            updated_at: 123_456_792,
        },
    ];

    let request = SyncRequest {
        clock: 1,
        device_id: "device-1".to_string(),
        since_clock: None,
        operations,
    };

    let (status, body) = make_sync_request(app, "test-token", request).await;

    // Debug print the response if not OK
    if status != StatusCode::OK {
        println!("Error response: {body}");
    }

    assert_eq!(status, StatusCode::OK);
    let response: SyncResponse = serde_json::from_str(&body).unwrap();

    // Server should accept all operations
    assert!(response.clock >= 4); // At least 4 operations were processed
}

#[tokio::test]
async fn test_sync_with_invalid_operation() {
    let db_pool = create_test_db().await;
    let app = create_test_app(db_pool);

    // Create operation with invalid data (empty tab ID)
    let operation = CrdtOperation::UpsertTab {
        id: String::new(), // Invalid: empty ID
        data: TabData {
            window_id: "window-1".to_string(),
            url: "https://example.com".to_string(),
            title: "Example".to_string(),
            active: true,
            index: 0,
            updated_at: 123_456_789,
        },
    };

    let request = SyncRequest {
        clock: 1,
        device_id: "device-1".to_string(),
        since_clock: None,
        operations: vec![operation],
    };

    let (status, body) = make_sync_request(app, "test-token", request).await;

    // Should return validation error
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert!(body.contains("validation") || body.contains("empty"));
}

#[tokio::test]
async fn test_incremental_sync() {
    let db_pool = create_test_db().await;
    let app = create_test_app(db_pool);

    // First sync from device 1
    let operation1 = CrdtOperation::UpsertTab {
        id: "tab-1".to_string(),
        data: TabData {
            window_id: "window-1".to_string(),
            url: "https://example.com".to_string(),
            title: "Example".to_string(),
            active: true,
            index: 0,
            updated_at: 123_456_789,
        },
    };

    let request1 = SyncRequest {
        clock: 1,
        device_id: "device-1".to_string(),
        since_clock: None,
        operations: vec![operation1],
    };

    let (status1, body1) = make_sync_request(app.clone(), "test-token", request1).await;
    assert_eq!(status1, StatusCode::OK);
    let response1: SyncResponse = serde_json::from_str(&body1).unwrap();
    let first_sync_clock = response1.clock;

    // Second sync from device 1 with another operation
    let operation2 = CrdtOperation::UpsertTab {
        id: "tab-2".to_string(),
        data: TabData {
            window_id: "window-1".to_string(),
            url: "https://example2.com".to_string(),
            title: "Example 2".to_string(),
            active: false,
            index: 1,
            updated_at: 123_456_790,
        },
    };

    let request2 = SyncRequest {
        clock: first_sync_clock,
        device_id: "device-1".to_string(),
        since_clock: Some(first_sync_clock),
        operations: vec![operation2],
    };

    let (status2, body2) = make_sync_request(app.clone(), "test-token", request2).await;
    assert_eq!(status2, StatusCode::OK);
    let _response2: SyncResponse = serde_json::from_str(&body2).unwrap();

    // Device 2 syncs with since_clock from first sync
    let request3 = SyncRequest {
        clock: 0,
        device_id: "device-2".to_string(),
        since_clock: Some(first_sync_clock),
        operations: vec![],
    };

    let (status3, body3) = make_sync_request(app.clone(), "test-token", request3).await;
    assert_eq!(status3, StatusCode::OK);
    let response3: SyncResponse = serde_json::from_str(&body3).unwrap();

    // Device 2 should only receive the second operation
    assert_eq!(response3.operations.len(), 1);
    match &response3.operations[0] {
        CrdtOperation::UpsertTab { id, data } => {
            assert_eq!(id, "tab-2");
            assert_eq!(data.url, "https://example2.com");
        }
        _ => panic!("Expected UpsertTab operation for tab-2"),
    }
}
