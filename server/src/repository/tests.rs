use super::*;
use crate::repository::{
    mock::{MockOperationRepository, MockTabRepository, MockWindowRepository},
    sqlite::{SqliteOperationRepository, SqliteTabRepository, SqliteWindowRepository},
};
use crate::sync::{CrdtOperation, TabData};
use sqlx::SqlitePool;
use std::sync::Arc;

// Helper function to create a test operation
fn create_test_operation() -> CrdtOperation {
    CrdtOperation::UpsertTab {
        id: "test-tab-1".to_string(),
        data: TabData {
            window_id: "window-1".to_string(),
            url: "https://example.com".to_string(),
            title: "Test Page".to_string(),
            active: true,
            index: 0,
            updated_at: 1_234_567_890,
        },
    }
}

// Helper function to create another test operation
fn create_test_operation_2() -> CrdtOperation {
    CrdtOperation::CloseTab {
        id: "test-tab-2".to_string(),
        closed_at: 1_234_567_891,
    }
}

// Mock repository tests
#[tokio::test]
async fn test_mock_operation_repository() {
    let repo = MockOperationRepository::new();
    let op = create_test_operation();

    // Test store operation
    repo.store(&op, 1, "device-1").await.unwrap();

    // Test get_since
    let recent_ops = repo.get_since("device-2", 0).await.unwrap();
    assert_eq!(recent_ops.len(), 1);
    assert_eq!(recent_ops[0].operation.target_id(), "test-tab-1");
    assert_eq!(recent_ops[0].clock, 1);
    assert_eq!(recent_ops[0].device_id, "device-1");

    // Test device filtering
    let filtered_ops = repo.get_since("device-1", 0).await.unwrap();
    assert_eq!(filtered_ops.len(), 0); // Should exclude same device
}

#[tokio::test]
async fn test_mock_operation_repository_get_recent() {
    let repo = MockOperationRepository::new();

    // Store multiple operations
    let op1 = create_test_operation();
    let op2 = create_test_operation_2();

    repo.store(&op1, 1, "device-1").await.unwrap();
    repo.store(&op2, 2, "device-1").await.unwrap();

    // Test get_recent with limit
    let recent_ops = repo.get_recent("device-2", 1).await.unwrap();
    assert_eq!(recent_ops.len(), 1);
    assert_eq!(recent_ops[0].clock, 2); // Should get the most recent

    // Test get_recent with higher limit
    let recent_ops = repo.get_recent("device-2", 10).await.unwrap();
    assert_eq!(recent_ops.len(), 2);
}

#[tokio::test]
async fn test_mock_tab_repository() {
    let repo = MockTabRepository::new();
    let tab = crate::models::Tab {
        id: "tab-1".to_string(),
        window_id: "window-1".to_string(),
        url: "https://example.com".to_string(),
        title: "Test".to_string(),
        active: true,
        index: 0,
        updated_at: 1_234_567_890,
    };

    // Test upsert and get
    repo.upsert(&tab).await.unwrap();
    let retrieved = repo.get("tab-1").await.unwrap();
    assert!(retrieved.is_some());
    assert_eq!(retrieved.unwrap().url, "https://example.com");

    // Test get non-existent
    let missing = repo.get("non-existent").await.unwrap();
    assert!(missing.is_none());

    // Test delete
    repo.delete("tab-1").await.unwrap();
    let deleted = repo.get("tab-1").await.unwrap();
    assert!(deleted.is_none());
}

#[tokio::test]
async fn test_mock_window_repository() {
    let repo = MockWindowRepository::new();
    let window = crate::models::Window {
        id: "window-1".to_string(),
        tracked: true,
        tab_count: 0,
        updated_at: 1_234_567_890,
    };

    // Test upsert and get
    repo.upsert(&window).await.unwrap();
    let retrieved = repo.get("window-1").await.unwrap();
    assert!(retrieved.is_some());
    assert!(retrieved.unwrap().tracked);

    // Test get tracked windows
    let tracked = repo.get_tracked().await.unwrap();
    assert_eq!(tracked.len(), 1);
    assert_eq!(tracked[0].id, "window-1");

    // Test delete
    repo.delete("window-1").await.unwrap();
    let deleted = repo.get("window-1").await.unwrap();
    assert!(deleted.is_none());
}

// SQLite repository integration tests
async fn setup_test_db() -> SqlitePool {
    let pool = SqlitePool::connect(":memory:").await.unwrap();

    // Create required tables manually for tests
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS crdt_operations (
            id TEXT PRIMARY KEY,
            clock INTEGER NOT NULL,
            device_id TEXT NOT NULL,
            operation_type TEXT NOT NULL,
            target_id TEXT NOT NULL,
            operation_data TEXT,
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS crdt_state (
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            current_data TEXT NOT NULL,
            last_clock INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            PRIMARY KEY (entity_type, entity_id)
        );

        CREATE TABLE IF NOT EXISTS tabs (
            id TEXT PRIMARY KEY,
            window_id TEXT NOT NULL,
            url TEXT NOT NULL,
            title TEXT NOT NULL,
            active INTEGER NOT NULL,
            "index" INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );
        "#,
    )
    .execute(&pool)
    .await
    .unwrap();

    pool
}

#[tokio::test]
async fn test_sqlite_operation_repository() {
    let pool = setup_test_db().await;
    let repo = SqliteOperationRepository::new(Arc::new(pool));
    let op = create_test_operation();

    // Test store operation
    repo.store(&op, 1, "device-1").await.unwrap();

    // Test get_since
    let recent_ops = repo.get_since("device-2", 0).await.unwrap();
    assert_eq!(recent_ops.len(), 1);
    assert_eq!(recent_ops[0].operation.target_id(), "test-tab-1");
    assert_eq!(recent_ops[0].clock, 1);
    assert_eq!(recent_ops[0].device_id, "device-1");

    // Test device filtering
    let filtered_ops = repo.get_since("device-1", 0).await.unwrap();
    assert_eq!(filtered_ops.len(), 0); // Should exclude same device

    // Test clock filtering
    let future_ops = repo.get_since("device-2", 2).await.unwrap();
    assert_eq!(future_ops.len(), 0); // Should exclude operations before clock
}

#[tokio::test]
async fn test_sqlite_operation_repository_get_recent() {
    let pool = setup_test_db().await;
    let repo = SqliteOperationRepository::new(Arc::new(pool));

    // Store multiple operations
    let op1 = create_test_operation();
    let op2 = create_test_operation_2();

    repo.store(&op1, 1, "device-1").await.unwrap();
    repo.store(&op2, 2, "device-1").await.unwrap();

    // Test get_recent with limit
    let recent_ops = repo.get_recent("device-2", 1).await.unwrap();
    assert_eq!(recent_ops.len(), 1);
    assert_eq!(recent_ops[0].clock, 2); // Should get the most recent

    // Test get_recent with higher limit
    let recent_ops = repo.get_recent("device-2", 10).await.unwrap();
    assert_eq!(recent_ops.len(), 2);
    // Should be in chronological order (oldest first)
    assert_eq!(recent_ops[0].clock, 1);
    assert_eq!(recent_ops[1].clock, 2);
}

#[tokio::test]
async fn test_sqlite_tab_repository() {
    let pool = setup_test_db().await;
    let repo = SqliteTabRepository::new(Arc::new(pool));
    let tab = crate::models::Tab {
        id: "tab-1".to_string(),
        window_id: "window-1".to_string(),
        url: "https://example.com".to_string(),
        title: "Test".to_string(),
        active: true,
        index: 0,
        updated_at: 1_234_567_890,
    };

    // Test upsert and get
    repo.upsert(&tab).await.unwrap();
    let retrieved = repo.get("tab-1").await.unwrap();
    assert!(retrieved.is_some());
    let retrieved_tab = retrieved.unwrap();
    assert_eq!(retrieved_tab.url, "https://example.com");
    assert_eq!(retrieved_tab.title, "Test");
    assert!(retrieved_tab.active);
    assert_eq!(retrieved_tab.index, 0);

    // Test update
    let mut updated_tab = tab.clone();
    updated_tab.title = "Updated Test".to_string();
    updated_tab.active = false;
    repo.upsert(&updated_tab).await.unwrap();

    let retrieved_updated = repo.get("tab-1").await.unwrap().unwrap();
    assert_eq!(retrieved_updated.title, "Updated Test");
    assert!(!retrieved_updated.active);

    // Test get non-existent
    let missing = repo.get("non-existent").await.unwrap();
    assert!(missing.is_none());

    // Test delete
    repo.delete("tab-1").await.unwrap();
    let deleted = repo.get("tab-1").await.unwrap();
    assert!(deleted.is_none());
}

#[tokio::test]
async fn test_sqlite_window_repository() {
    let pool = setup_test_db().await;
    let repo = SqliteWindowRepository::new(Arc::new(pool));
    let window = crate::models::Window {
        id: "window-1".to_string(),
        tracked: true,
        tab_count: 0,
        updated_at: 1_234_567_890,
    };

    // Test upsert and get
    repo.upsert(&window).await.unwrap();
    let retrieved = repo.get("window-1").await.unwrap();
    assert!(retrieved.is_some());
    let retrieved_window = retrieved.unwrap();
    assert!(retrieved_window.tracked);
    assert_eq!(retrieved_window.updated_at, 1_234_567_890);

    // Test update
    let mut updated_window = window.clone();
    updated_window.tracked = false;
    updated_window.updated_at = 1_234_567_891;
    repo.upsert(&updated_window).await.unwrap();

    let retrieved_updated = repo.get("window-1").await.unwrap().unwrap();
    assert!(!retrieved_updated.tracked);
    assert_eq!(retrieved_updated.updated_at, 1_234_567_891);

    // Test get tracked windows
    let tracked_before = repo.get_tracked().await.unwrap();
    assert_eq!(tracked_before.len(), 0); // Should be empty after setting tracked=false

    // Add another tracked window
    let window2 = crate::models::Window {
        id: "window-2".to_string(),
        tracked: true,
        tab_count: 0,
        updated_at: 1_234_567_892,
    };
    repo.upsert(&window2).await.unwrap();

    let tracked_after = repo.get_tracked().await.unwrap();
    assert_eq!(tracked_after.len(), 1);
    assert_eq!(tracked_after[0].id, "window-2");

    // Test get non-existent
    let missing = repo.get("non-existent").await.unwrap();
    assert!(missing.is_none());

    // Test delete
    repo.delete("window-1").await.unwrap();
    let deleted = repo.get("window-1").await.unwrap();
    assert!(deleted.is_none());
}

// Error handling tests
#[tokio::test]
async fn test_repository_error_handling() {
    // Test with a closed pool to simulate database errors
    let pool = setup_test_db().await;
    pool.close().await;

    let repo = SqliteOperationRepository::new(Arc::new(pool));
    let op = create_test_operation();

    // This should fail with a database error
    let result = repo.store(&op, 1, "device-1").await;
    assert!(result.is_err());

    let result = repo.get_since("device-1", 0).await;
    assert!(result.is_err());

    let result = repo.get_recent("device-1", 10).await;
    assert!(result.is_err());
}

#[tokio::test]
async fn test_operation_serialization() {
    let pool = setup_test_db().await;
    let repo = SqliteOperationRepository::new(Arc::new(pool));

    // Test different operation types
    let operations = vec![
        CrdtOperation::UpsertTab {
            id: "tab-1".to_string(),
            data: TabData {
                window_id: "window-1".to_string(),
                url: "https://example.com".to_string(),
                title: "Test".to_string(),
                active: true,
                index: 0,
                updated_at: 1_234_567_890,
            },
        },
        CrdtOperation::CloseTab {
            id: "tab-2".to_string(),
            closed_at: 1_234_567_891,
        },
        CrdtOperation::SetActive {
            id: "tab-3".to_string(),
            active: false,
            updated_at: 1_234_567_892,
        },
        CrdtOperation::ChangeUrl {
            id: "tab-4".to_string(),
            url: "https://new-url.com".to_string(),
            title: Some("New Title".to_string()),
            updated_at: 1_234_567_893,
        },
    ];

    // Store all operations
    for (i, op) in operations.iter().enumerate() {
        repo.store(op, i as u64 + 1, "device-1").await.unwrap();
    }

    // Retrieve and verify
    let stored_ops = repo.get_since("device-2", 0).await.unwrap();
    assert_eq!(stored_ops.len(), 4);

    // Check that operations are properly deserialized
    assert_eq!(stored_ops[0].operation.operation_type(), "upsert_tab");
    assert_eq!(stored_ops[1].operation.operation_type(), "close_tab");
    assert_eq!(stored_ops[2].operation.operation_type(), "set_active");
    assert_eq!(stored_ops[3].operation.operation_type(), "change_url");
}
