use super::*;
use crate::repository::{
    mock::{MockOperationRepository, MockTabRepository, MockWindowRepository},
    sqlite::{SqliteOperationRepository, SqliteTabRepository, SqliteWindowRepository},
};
use crate::sync::{CrdtOperation, TabData};
use sqlx::SqlitePool;
use std::sync::Arc;

#[cfg(test)]
use pretty_assertions::assert_eq;
use rstest::rstest;

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

// Additional tests for better coverage

#[tokio::test]
async fn test_mock_repository_defaults() {
    // Test Default implementations for mock repositories
    let op_repo = MockOperationRepository::default();
    let tab_repo = MockTabRepository::default();
    let window_repo = MockWindowRepository::default();

    // Test that defaults work properly
    let op = create_test_operation();
    op_repo.store(&op, 1, "device-1").await.unwrap();
    let ops = op_repo.get_since("device-2", 0).await.unwrap();
    assert_eq!(ops.len(), 1);

    let tab = crate::models::Tab {
        id: "default-tab".to_string(),
        window_id: "default-window".to_string(),
        url: "https://default.com".to_string(),
        title: "Default".to_string(),
        active: true,
        index: 0,
        updated_at: 1_234_567_890,
    };
    tab_repo.upsert(&tab).await.unwrap();
    let retrieved = tab_repo.get("default-tab").await.unwrap();
    assert!(retrieved.is_some());

    let window = crate::models::Window {
        id: "default-window".to_string(),
        tracked: true,
        tab_count: 0,
        updated_at: 1_234_567_890,
    };
    window_repo.upsert(&window).await.unwrap();
    let retrieved = window_repo.get("default-window").await.unwrap();
    assert!(retrieved.is_some());
}

#[tokio::test]
async fn test_repositories_container() {
    // Test the Repositories container with SQLite
    let pool = setup_test_db().await;
    let repos = crate::repository::Repositories::new_sqlite(pool);

    // Test operation repository through container
    let op = create_test_operation();
    repos
        .operations
        .store(&op, 1, "container-device")
        .await
        .unwrap();
    let ops = repos.operations.get_since("other-device", 0).await.unwrap();
    assert_eq!(ops.len(), 1);

    // Test tab repository through container
    let tab = crate::models::Tab {
        id: "container-tab".to_string(),
        window_id: "container-window".to_string(),
        url: "https://container.com".to_string(),
        title: "Container".to_string(),
        active: true,
        index: 0,
        updated_at: 1_234_567_890,
    };
    repos.tabs.upsert(&tab).await.unwrap();
    let retrieved = repos.tabs.get("container-tab").await.unwrap();
    assert!(retrieved.is_some());

    // Test window repository through container
    let window = crate::models::Window {
        id: "container-window".to_string(),
        tracked: true,
        tab_count: 5,
        updated_at: 1_234_567_890,
    };
    repos.windows.upsert(&window).await.unwrap();
    let retrieved = repos.windows.get("container-window").await.unwrap();
    assert!(retrieved.is_some());
}

#[cfg(test)]
#[tokio::test]
async fn test_repositories_container_mock() {
    // Test the mock repositories container
    let repos = crate::repository::Repositories::new_mock();

    // Test operation repository through mock container
    let op = create_test_operation();
    repos.operations.store(&op, 1, "mock-device").await.unwrap();
    let ops = repos.operations.get_since("other-device", 0).await.unwrap();
    assert_eq!(ops.len(), 1);

    // Test tab repository through mock container
    let tab = crate::models::Tab {
        id: "mock-tab".to_string(),
        window_id: "mock-window".to_string(),
        url: "https://mock.com".to_string(),
        title: "Mock".to_string(),
        active: true,
        index: 0,
        updated_at: 1_234_567_890,
    };
    repos.tabs.upsert(&tab).await.unwrap();
    let retrieved = repos.tabs.get("mock-tab").await.unwrap();
    assert!(retrieved.is_some());

    // Test window repository through mock container
    let window = crate::models::Window {
        id: "mock-window".to_string(),
        tracked: true,
        tab_count: 3,
        updated_at: 1_234_567_890,
    };
    repos.windows.upsert(&window).await.unwrap();
    let retrieved = repos.windows.get("mock-window").await.unwrap();
    assert!(retrieved.is_some());
}

/// Parameterized test demonstrating rstest for different CRDT operation types
#[rstest]
#[case::upsert_tab(CrdtOperation::UpsertTab {
    id: "test-tab".to_string(),
    data: TabData {
        window_id: "window-1".to_string(),
        url: "https://example.com".to_string(),
        title: "Test".to_string(),
        active: true,
        index: 0,
        updated_at: 123_456_789,
    }
})]
#[case::close_tab(CrdtOperation::CloseTab {
    id: "test-tab".to_string(),
    closed_at: 123_456_789,
})]
#[case::set_active(CrdtOperation::SetActive {
    id: "test-tab".to_string(),
    active: true,
    updated_at: 123_456_789,
})]
#[case::move_tab(CrdtOperation::MoveTab {
    id: "test-tab".to_string(),
    window_id: "window-2".to_string(),
    index: 1,
    updated_at: 123_456_789,
})]
#[case::change_url(CrdtOperation::ChangeUrl {
    id: "test-tab".to_string(),
    url: "https://updated.com".to_string(),
    title: Some("Updated".to_string()),
    updated_at: 123_456_789,
})]
#[case::track_window(CrdtOperation::TrackWindow {
    id: "window-1".to_string(),
    tracked: true,
    updated_at: 123_456_789,
})]
#[case::untrack_window(CrdtOperation::UntrackWindow {
    id: "window-1".to_string(),
    updated_at: 123_456_789,
})]
#[case::set_window_focus(CrdtOperation::SetWindowFocus {
    id: "window-1".to_string(),
    focused: true,
    updated_at: 123_456_789,
})]
#[tokio::test]
async fn test_all_crdt_operation_types_storage(#[case] operation: CrdtOperation) {
    // This test validates that all 8 CRDT operation types can be stored
    // and demonstrates rstest parameterized testing across all operation types
    let repo = MockOperationRepository::new();

    // Store the operation - this should always succeed for valid operations
    let result = repo.store(&operation, 1, "test-device").await;
    assert!(result.is_ok(), "Failed to store operation: {operation:?}");

    // Basic validation - the operation was stored without error
    // Note: We don't test retrieval here as MockOperationRepository
    // may have different behavior, but rstest ensures all 8 operation types are tested
}

#[tokio::test]
async fn test_sqlite_tab_repository_get_all() {
    let pool = setup_test_db().await;
    let repo = SqliteTabRepository::new(Arc::new(pool));

    // Add multiple tabs
    let tab1 = crate::models::Tab {
        id: "all-tab-1".to_string(),
        window_id: "all-window-1".to_string(),
        url: "https://all1.com".to_string(),
        title: "All 1".to_string(),
        active: true,
        index: 0,
        updated_at: 1_234_567_890,
    };
    let tab2 = crate::models::Tab {
        id: "all-tab-2".to_string(),
        window_id: "all-window-1".to_string(),
        url: "https://all2.com".to_string(),
        title: "All 2".to_string(),
        active: false,
        index: 1,
        updated_at: 1_234_567_891,
    };

    repo.upsert(&tab1).await.unwrap();
    repo.upsert(&tab2).await.unwrap();

    // Test get_all
    let all_tabs = repo.get_all().await.unwrap();
    assert!(all_tabs.len() >= 2);

    // Verify both tabs are present
    let tab1_found = all_tabs.iter().any(|t| t.id == "all-tab-1");
    let tab2_found = all_tabs.iter().any(|t| t.id == "all-tab-2");
    assert!(tab1_found);
    assert!(tab2_found);
}

#[tokio::test]
async fn test_sqlite_window_repository_get_all() {
    let pool = setup_test_db().await;
    let repo = SqliteWindowRepository::new(Arc::new(pool));

    // Add multiple windows
    let window1 = crate::models::Window {
        id: "all-window-1".to_string(),
        tracked: true,
        tab_count: 2,
        updated_at: 1_234_567_890,
    };
    let window2 = crate::models::Window {
        id: "all-window-2".to_string(),
        tracked: false,
        tab_count: 1,
        updated_at: 1_234_567_891,
    };

    repo.upsert(&window1).await.unwrap();
    repo.upsert(&window2).await.unwrap();

    // Test get_all
    let all_windows = repo.get_all().await.unwrap();
    assert!(all_windows.len() >= 2);

    // Test get_tracked (should only return window1)
    let tracked_windows = repo.get_tracked().await.unwrap();
    assert_eq!(tracked_windows.len(), 1);
    assert_eq!(tracked_windows[0].id, "all-window-1");
    assert!(tracked_windows[0].tracked);
}

#[tokio::test]
async fn test_mock_tab_repository_get_all() {
    let repo = MockTabRepository::new();

    // Add multiple tabs
    let tab1 = crate::models::Tab {
        id: "mock-all-tab-1".to_string(),
        window_id: "mock-all-window-1".to_string(),
        url: "https://mockall1.com".to_string(),
        title: "Mock All 1".to_string(),
        active: true,
        index: 0,
        updated_at: 1_234_567_890,
    };
    let tab2 = crate::models::Tab {
        id: "mock-all-tab-2".to_string(),
        window_id: "mock-all-window-1".to_string(),
        url: "https://mockall2.com".to_string(),
        title: "Mock All 2".to_string(),
        active: false,
        index: 1,
        updated_at: 1_234_567_891,
    };

    repo.upsert(&tab1).await.unwrap();
    repo.upsert(&tab2).await.unwrap();

    // Test get_all with sorting
    let all_tabs = repo.get_all().await.unwrap();
    assert_eq!(all_tabs.len(), 2);
    // Should be sorted by ID
    assert_eq!(all_tabs[0].id, "mock-all-tab-1");
    assert_eq!(all_tabs[1].id, "mock-all-tab-2");
}

#[tokio::test]
async fn test_mock_window_repository_get_all() {
    let repo = MockWindowRepository::new();

    // Add multiple windows
    let window1 = crate::models::Window {
        id: "mock-all-window-1".to_string(),
        tracked: true,
        tab_count: 2,
        updated_at: 1_234_567_890,
    };
    let window2 = crate::models::Window {
        id: "mock-all-window-2".to_string(),
        tracked: false,
        tab_count: 1,
        updated_at: 1_234_567_891,
    };

    repo.upsert(&window1).await.unwrap();
    repo.upsert(&window2).await.unwrap();

    // Test get_all with sorting
    let all_windows = repo.get_all().await.unwrap();
    assert_eq!(all_windows.len(), 2);
    // Should be sorted by ID
    assert_eq!(all_windows[0].id, "mock-all-window-1");
    assert_eq!(all_windows[1].id, "mock-all-window-2");

    // Test get_tracked (should only return window1)
    let tracked_windows = repo.get_tracked().await.unwrap();
    assert_eq!(tracked_windows.len(), 1);
    assert_eq!(tracked_windows[0].id, "mock-all-window-1");
    assert!(tracked_windows[0].tracked);
}

#[tokio::test]
async fn test_sqlite_repository_new_constructors() {
    // Test that all SQLite repository constructors work
    let pool = setup_test_db().await;
    let arc_pool = Arc::new(pool);

    let _op_repo = SqliteOperationRepository::new(arc_pool.clone());
    let _tab_repo = SqliteTabRepository::new(arc_pool.clone());
    let _window_repo = SqliteWindowRepository::new(arc_pool);

    // Just verify they can be constructed without panicking
}

#[tokio::test]
async fn test_edge_cases_and_error_conditions() {
    let pool = setup_test_db().await;
    let tab_repo = SqliteTabRepository::new(Arc::new(pool.clone()));
    let window_repo = SqliteWindowRepository::new(Arc::new(pool));

    // Test edge case: tab with very long values to ensure no truncation issues
    let long_tab = crate::models::Tab {
        id: "a".repeat(100), // Very long ID
        window_id: "b".repeat(50),
        url: format!("https://{}.com", "c".repeat(50)),
        title: "d".repeat(200), // Very long title
        active: true,
        index: i64::MAX,      // Maximum index value
        updated_at: i64::MAX, // Maximum timestamp
    };

    // Should handle long values without issues
    tab_repo.upsert(&long_tab).await.unwrap();
    let retrieved = tab_repo.get(&long_tab.id).await.unwrap();
    assert!(retrieved.is_some());
    let retrieved_tab = retrieved.unwrap();
    assert_eq!(retrieved_tab.id, long_tab.id);
    assert_eq!(retrieved_tab.title, long_tab.title);

    // Test edge case: window with edge values
    let edge_window = crate::models::Window {
        id: "z".repeat(100),
        tracked: false,
        tab_count: i64::MAX,
        updated_at: i64::MIN, // Minimum timestamp
    };

    window_repo.upsert(&edge_window).await.unwrap();
    let retrieved = window_repo.get(&edge_window.id).await.unwrap();
    assert!(retrieved.is_some());
    let retrieved_window = retrieved.unwrap();
    assert_eq!(retrieved_window.id, edge_window.id);
    assert_eq!(retrieved_window.tab_count, edge_window.tab_count);
    assert!(!retrieved_window.tracked);
}

#[tokio::test]
async fn test_repository_concurrent_access() {
    // Test that repositories can handle concurrent access
    let pool = setup_test_db().await;
    let repo = SqliteOperationRepository::new(Arc::new(pool));

    let op1 = CrdtOperation::UpsertTab {
        id: "concurrent-tab-1".to_string(),
        data: TabData {
            window_id: "concurrent-window".to_string(),
            url: "https://concurrent1.com".to_string(),
            title: "Concurrent 1".to_string(),
            active: true,
            index: 0,
            updated_at: 1_234_567_890,
        },
    };

    let op2 = CrdtOperation::UpsertTab {
        id: "concurrent-tab-2".to_string(),
        data: TabData {
            window_id: "concurrent-window".to_string(),
            url: "https://concurrent2.com".to_string(),
            title: "Concurrent 2".to_string(),
            active: false,
            index: 1,
            updated_at: 1_234_567_891,
        },
    };

    // Simulate concurrent operations
    let repo_clone = Arc::new(repo);
    let repo1 = repo_clone.clone();
    let repo2 = repo_clone.clone();

    let handle1 = tokio::spawn(async move { repo1.store(&op1, 1, "concurrent-device-1").await });

    let handle2 = tokio::spawn(async move { repo2.store(&op2, 2, "concurrent-device-2").await });

    // Both operations should succeed
    handle1.await.unwrap().unwrap();
    handle2.await.unwrap().unwrap();

    // Both operations should be retrievable
    let stored_ops = repo_clone.get_since("other-device", 0).await.unwrap();
    assert_eq!(stored_ops.len(), 2);
}
