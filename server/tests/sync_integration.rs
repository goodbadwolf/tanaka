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

#[tokio::test]
async fn test_sync_repository_integration() {
    // This test specifically covers the repository integration paths in sync.rs
    let db_pool = create_test_db().await;
    let app = create_test_app(db_pool);

    // Test 1: Sync with operations to cover repository.store() path (lines 253-254, 272)
    let operation = CrdtOperation::UpsertTab {
        id: "repo-test-tab".to_string(),
        data: TabData {
            window_id: "repo-test-window".to_string(),
            url: "https://repo-test.com".to_string(),
            title: "Repository Test".to_string(),
            active: true,
            index: 0,
            updated_at: 123_456_789,
        },
    };

    let request1 = SyncRequest {
        clock: 1,
        device_id: "repo-device-1".to_string(),
        since_clock: None,
        operations: vec![operation],
    };

    let (status1, body1) = make_sync_request(app.clone(), "test-token", request1).await;
    assert_eq!(status1, StatusCode::OK);
    let response1: SyncResponse = serde_json::from_str(&body1).unwrap();

    // Test 2: Sync with since_clock to cover get_since() path (lines 281, 284-287)
    let request2 = SyncRequest {
        clock: response1.clock,
        device_id: "repo-device-2".to_string(),
        since_clock: Some(0), // Get all operations since clock 0
        operations: vec![],
    };

    let (status2, body2) = make_sync_request(app.clone(), "test-token", request2).await;
    assert_eq!(status2, StatusCode::OK);
    let response2: SyncResponse = serde_json::from_str(&body2).unwrap();

    // Should receive the operation from device-1
    assert_eq!(response2.operations.len(), 1);
    match &response2.operations[0] {
        CrdtOperation::UpsertTab { id, data } => {
            assert_eq!(id, "repo-test-tab");
            assert_eq!(data.url, "https://repo-test.com");
        }
        _ => panic!("Expected UpsertTab operation"),
    }

    // Test 3: Sync without since_clock to cover get_all() path (lines 291-298) - FIXED
    let request3 = SyncRequest {
        clock: response1.clock,
        device_id: "repo-device-3".to_string(),
        since_clock: None, // No since_clock, should use get_all() for initial sync
        operations: vec![],
    };

    let (status3, body3) = make_sync_request(app.clone(), "test-token", request3).await;
    assert_eq!(status3, StatusCode::OK);
    let response3: SyncResponse = serde_json::from_str(&body3).unwrap();

    // Should receive ALL operations (not limited to 100)
    assert_eq!(response3.operations.len(), 1);
    match &response3.operations[0] {
        CrdtOperation::UpsertTab { id, data } => {
            assert_eq!(id, "repo-test-tab");
            assert_eq!(data.url, "https://repo-test.com");
        }
        _ => panic!("Expected UpsertTab operation"),
    }
}

#[tokio::test]
async fn test_sync_device_filtering() {
    // Test that devices don't receive their own operations back (device filtering)
    let db_pool = create_test_db().await;
    let app = create_test_app(db_pool);

    // Device 1 sends an operation
    let operation = CrdtOperation::CloseTab {
        id: "filter-test-tab".to_string(),
        closed_at: 123_456_789,
    };

    let request1 = SyncRequest {
        clock: 1,
        device_id: "filter-device-1".to_string(),
        since_clock: None,
        operations: vec![operation],
    };

    let (status1, body1) = make_sync_request(app.clone(), "test-token", request1).await;
    assert_eq!(status1, StatusCode::OK);
    let _response1: SyncResponse = serde_json::from_str(&body1).unwrap();

    // Same device syncs again - should not receive its own operation
    let request2 = SyncRequest {
        clock: 1,
        device_id: "filter-device-1".to_string(), // Same device ID
        since_clock: Some(0),
        operations: vec![],
    };

    let (status2, body2) = make_sync_request(app.clone(), "test-token", request2).await;
    assert_eq!(status2, StatusCode::OK);
    let response2: SyncResponse = serde_json::from_str(&body2).unwrap();

    // Should not receive its own operation back
    assert_eq!(response2.operations.len(), 0);

    // Different device should receive the operation
    let request3 = SyncRequest {
        clock: 0,
        device_id: "filter-device-2".to_string(), // Different device ID
        since_clock: Some(0),
        operations: vec![],
    };

    let (status3, body3) = make_sync_request(app.clone(), "test-token", request3).await;
    assert_eq!(status3, StatusCode::OK);
    let response3: SyncResponse = serde_json::from_str(&body3).unwrap();

    // Should receive the operation from device-1
    assert_eq!(response3.operations.len(), 1);
    match &response3.operations[0] {
        CrdtOperation::CloseTab { id, closed_at: _ } => {
            assert_eq!(id, "filter-test-tab");
        }
        _ => panic!("Expected CloseTab operation"),
    }
}

#[tokio::test]
async fn test_sync_multiple_operations_storage() {
    // Test storing multiple operations in a single sync request
    let db_pool = create_test_db().await;
    let app = create_test_app(db_pool);

    // Create multiple operations to test the storage loop
    let operations = vec![
        CrdtOperation::UpsertTab {
            id: "multi-tab-1".to_string(),
            data: TabData {
                window_id: "multi-window-1".to_string(),
                url: "https://multi1.com".to_string(),
                title: "Multi 1".to_string(),
                active: true,
                index: 0,
                updated_at: 123_456_789,
            },
        },
        CrdtOperation::UpsertTab {
            id: "multi-tab-2".to_string(),
            data: TabData {
                window_id: "multi-window-1".to_string(),
                url: "https://multi2.com".to_string(),
                title: "Multi 2".to_string(),
                active: false,
                index: 1,
                updated_at: 123_456_790,
            },
        },
        CrdtOperation::SetActive {
            id: "multi-tab-1".to_string(),
            active: false,
            updated_at: 123_456_791,
        },
    ];

    let request = SyncRequest {
        clock: 1,
        device_id: "multi-device-1".to_string(),
        since_clock: None,
        operations,
    };

    let (status, body) = make_sync_request(app.clone(), "test-token", request).await;
    assert_eq!(status, StatusCode::OK);
    let response: SyncResponse = serde_json::from_str(&body).unwrap();

    // All operations should be processed
    assert!(response.clock >= 3);

    // Another device should receive all operations
    let request2 = SyncRequest {
        clock: 0,
        device_id: "multi-device-2".to_string(),
        since_clock: Some(0),
        operations: vec![],
    };

    let (status2, body2) = make_sync_request(app.clone(), "test-token", request2).await;
    assert_eq!(status2, StatusCode::OK);
    let response2: SyncResponse = serde_json::from_str(&body2).unwrap();

    // Should receive all 3 operations
    assert_eq!(response2.operations.len(), 3);
}

#[tokio::test]
async fn test_device_authentication_multi_device_sync() {
    // Test the fix for device authentication - multiple devices should be able to sync
    // using the same shared token but different device IDs
    let db_pool = create_test_db().await;
    let app = create_test_app(db_pool);

    // Device 1 sends a tab operation
    let device1_operation = CrdtOperation::UpsertTab {
        id: "device1-tab".to_string(),
        data: TabData {
            window_id: "device1-window".to_string(),
            url: "https://device1.com".to_string(),
            title: "Device 1 Tab".to_string(),
            active: true,
            index: 0,
            updated_at: 123_456_789,
        },
    };

    let device1_request = SyncRequest {
        clock: 1,
        device_id: "unique-device-1".to_string(), // Device 1 uses its own ID
        since_clock: None,
        operations: vec![device1_operation],
    };

    let (status1, body1) = make_sync_request(app.clone(), "test-token", device1_request).await;
    assert_eq!(status1, StatusCode::OK, "Device 1 sync failed: {body1}");
    let _response1: SyncResponse = serde_json::from_str(&body1).unwrap();

    // Device 2 sends a different tab operation using same token but different device ID
    let device2_operation = CrdtOperation::UpsertTab {
        id: "device2-tab".to_string(),
        data: TabData {
            window_id: "device2-window".to_string(),
            url: "https://device2.com".to_string(),
            title: "Device 2 Tab".to_string(),
            active: true,
            index: 0,
            updated_at: 123_456_790,
        },
    };

    let device2_request = SyncRequest {
        clock: 1,
        device_id: "unique-device-2".to_string(), // Device 2 uses its own ID
        since_clock: None,
        operations: vec![device2_operation],
    };

    let (status2, body2) = make_sync_request(app.clone(), "test-token", device2_request).await;
    assert_eq!(status2, StatusCode::OK, "Device 2 sync failed: {body2}");
    let _response2: SyncResponse = serde_json::from_str(&body2).unwrap();

    // Device 1 syncs again and should receive Device 2's operation
    let device1_sync = SyncRequest {
        clock: 1,
        device_id: "unique-device-1".to_string(),
        since_clock: Some(0), // Get all operations since beginning
        operations: vec![],
    };

    let (status3, body3) = make_sync_request(app.clone(), "test-token", device1_sync).await;
    assert_eq!(
        status3,
        StatusCode::OK,
        "Device 1 second sync failed: {body3}"
    );
    let response3: SyncResponse = serde_json::from_str(&body3).unwrap();

    // Device 1 should receive Device 2's operation (but not its own)
    assert_eq!(
        response3.operations.len(),
        1,
        "Device 1 should receive exactly 1 operation from Device 2"
    );

    match &response3.operations[0] {
        CrdtOperation::UpsertTab { id, data } => {
            assert_eq!(id, "device2-tab");
            assert_eq!(data.url, "https://device2.com");
            assert_eq!(data.title, "Device 2 Tab");
        }
        _ => panic!("Expected UpsertTab operation from Device 2"),
    }

    // Device 2 syncs and should receive Device 1's operation
    let device2_sync = SyncRequest {
        clock: 1,
        device_id: "unique-device-2".to_string(),
        since_clock: Some(0),
        operations: vec![],
    };

    let (status4, body4) = make_sync_request(app.clone(), "test-token", device2_sync).await;
    assert_eq!(
        status4,
        StatusCode::OK,
        "Device 2 second sync failed: {body4}"
    );
    let response4: SyncResponse = serde_json::from_str(&body4).unwrap();

    // Device 2 should receive Device 1's operation (but not its own)
    assert_eq!(
        response4.operations.len(),
        1,
        "Device 2 should receive exactly 1 operation from Device 1"
    );

    match &response4.operations[0] {
        CrdtOperation::UpsertTab { id, data } => {
            assert_eq!(id, "device1-tab");
            assert_eq!(data.url, "https://device1.com");
            assert_eq!(data.title, "Device 1 Tab");
        }
        _ => panic!("Expected UpsertTab operation from Device 1"),
    }
}

#[tokio::test]
async fn test_initial_sync_beyond_100_tabs() {
    // Test the fix for initial sync truncation - devices should receive ALL operations, not just 100
    let db_pool = create_test_db().await;
    let app = create_test_app(db_pool);

    // Device 1 creates more than 100 tab operations to test the truncation fix
    let mut operations = Vec::new();
    for i in 0..150 {
        operations.push(CrdtOperation::UpsertTab {
            id: format!("tab-{i}"),
            data: TabData {
                window_id: "window-1".to_string(),
                url: format!("https://example{i}.com"),
                title: format!("Tab {i}"),
                active: i == 0, // Only first tab is active
                index: i,
                updated_at: 123_456_789 + u64::try_from(i).unwrap(),
            },
        });
    }

    // Send operations in batches to avoid hitting request size limits
    let batch_size = 25;
    for (batch_idx, chunk) in operations.chunks(batch_size).enumerate() {
        let request = SyncRequest {
            clock: (batch_idx + 1) as u64,
            device_id: "device-1".to_string(),
            since_clock: if batch_idx == 0 {
                None
            } else {
                Some(batch_idx as u64)
            },
            operations: chunk.to_vec(),
        };

        let (status, body) = make_sync_request(app.clone(), "test-token", request).await;
        assert_eq!(status, StatusCode::OK, "Batch {batch_idx} failed: {body}");
    }

    // Device 2 performs initial sync (no since_clock) - should receive ALL 150 operations
    let initial_sync_request = SyncRequest {
        clock: 0,
        device_id: "device-2".to_string(),
        since_clock: None, // This is the key - initial sync without since_clock
        operations: vec![],
    };

    let (status, body) = make_sync_request(app.clone(), "test-token", initial_sync_request).await;
    assert_eq!(status, StatusCode::OK);
    let response: SyncResponse = serde_json::from_str(&body).unwrap();

    // CRITICAL: Device 2 should receive ALL 150 operations, not just 100
    assert_eq!(
        response.operations.len(),
        150,
        "Initial sync should return all {} operations, not just 100. Got: {}",
        150,
        response.operations.len()
    );

    // Verify operations are in chronological order
    let mut previous_tab_num = -1;
    for operation in &response.operations {
        if let CrdtOperation::UpsertTab { id, data } = operation {
            let tab_num: i32 = id.strip_prefix("tab-").unwrap().parse().unwrap();
            assert!(
                tab_num > previous_tab_num,
                "Operations should be in chronological order"
            );
            assert_eq!(data.url, format!("https://example{tab_num}.com"));
            previous_tab_num = tab_num;
        } else {
            panic!("Expected UpsertTab operation, got: {operation:?}");
        }
    }

    // Verify device filtering still works - device-1 shouldn't get its own operations back
    let device1_sync_request = SyncRequest {
        clock: 0,
        device_id: "device-1".to_string(), // Same device that created operations
        since_clock: None,
        operations: vec![],
    };

    let (status, body) = make_sync_request(app.clone(), "test-token", device1_sync_request).await;
    assert_eq!(status, StatusCode::OK);
    let device1_response: SyncResponse = serde_json::from_str(&body).unwrap();

    // Device 1 should not receive its own operations back
    assert_eq!(
        device1_response.operations.len(),
        0,
        "Device should not receive its own operations back"
    );
}
