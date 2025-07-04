use sqlx::{migrate::MigrateDatabase, Sqlite, SqlitePool};
use std::sync::Arc;
use tanaka_server::{
    crdt::CrdtManager,
    repository::Repositories,
    sync::{CrdtOperation, TabData},
};

#[tokio::test]
#[allow(clippy::too_many_lines)]
async fn test_server_persistence() {
    // Create a temporary database
    let db_url = "sqlite::memory:";
    if !Sqlite::database_exists(db_url).await.unwrap_or(false) {
        Sqlite::create_database(db_url).await.unwrap();
    }

    let pool = SqlitePool::connect(db_url).await.unwrap();

    // Initialize database schema
    sqlx::query(
        r"
        CREATE TABLE IF NOT EXISTS crdt_operations (
            id TEXT PRIMARY KEY,
            clock INTEGER NOT NULL,
            device_id TEXT NOT NULL,
            operation_type TEXT NOT NULL,
            target_id TEXT NOT NULL,
            operation_data TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            UNIQUE(clock)
        )
        ",
    )
    .execute(&pool)
    .await
    .unwrap();

    let repositories = Repositories::new_sqlite(pool.clone());

    // Scenario 1: Fresh start
    let max_clock = repositories.operations.get_max_clock().await.unwrap();
    assert_eq!(max_clock, 0, "Fresh database should have max clock of 0");

    // Create first CRDT manager and add some operations
    let node_id = 12345;
    let crdt_manager1 = Arc::new(CrdtManager::new(node_id));
    assert_eq!(
        crdt_manager1.current_clock(),
        1,
        "New manager should start at clock 1"
    );

    // Store some operations
    let clock1 = crdt_manager1.tick_clock(); // Should be 1
    let op1 = CrdtOperation::UpsertTab {
        id: "tab1".to_string(),
        data: TabData {
            window_id: "window1".to_string(),
            url: "https://example.com".to_string(),
            title: "Example".to_string(),
            active: true,
            index: 0,
            updated_at: clock1,
        },
    };

    repositories
        .operations
        .store(&op1, clock1, "device1")
        .await
        .unwrap();

    let clock2 = crdt_manager1.tick_clock(); // Should be 2
    let op2 = CrdtOperation::UpsertTab {
        id: "tab2".to_string(),
        data: TabData {
            window_id: "window1".to_string(),
            url: "https://rust-lang.org".to_string(),
            title: "Rust".to_string(),
            active: false,
            index: 1,
            updated_at: clock2,
        },
    };

    repositories
        .operations
        .store(&op2, clock2, "device1")
        .await
        .unwrap();

    let clock3 = crdt_manager1.tick_clock(); // Should be 3
    let op3 = CrdtOperation::TrackWindow {
        id: "window1".to_string(),
        tracked: true,
        updated_at: clock3,
    };

    repositories
        .operations
        .store(&op3, clock3, "device1")
        .await
        .unwrap();

    // Verify operations were stored
    let stored_max = repositories.operations.get_max_clock().await.unwrap();
    assert_eq!(
        stored_max, 3,
        "Should have max clock of 3 after storing operations"
    );

    // Scenario 2: Restart server and restore state
    let restored_max_clock = repositories.operations.get_max_clock().await.unwrap();
    assert_eq!(
        restored_max_clock, 3,
        "Database should still have max clock of 3"
    );

    // Create new CRDT manager with restored clock
    let crdt_manager2 = Arc::new(CrdtManager::with_initial_clock(
        node_id,
        restored_max_clock + 1,
    ));
    assert_eq!(
        crdt_manager2.current_clock(),
        4,
        "Restored manager should start at max_clock + 1"
    );

    // Restore operations to rebuild state
    let all_operations = repositories.operations.get_all().await.unwrap();
    assert_eq!(all_operations.len(), 3, "Should have 3 stored operations");

    // Debug: print operations
    for op in &all_operations {
        println!(
            "Restoring operation: {:?} with clock {}",
            op.operation, op.clock
        );
    }

    // Apply operations to restore state
    crdt_manager2
        .restore_from_operations(&all_operations)
        .unwrap();

    // Verify state was restored by checking the CRDT document
    let tabs = {
        let doc = crdt_manager2.get_or_create_document("default");
        let doc_guard = doc.lock().unwrap();
        let tabs = doc_guard.get_tabs().unwrap();
        println!("Restored tabs count: {}", tabs.len());
        for tab in &tabs {
            println!("Tab: {} - {}", tab.id, tab.title);
        }
        tabs
    };

    assert_eq!(tabs.len(), 2, "Should have 2 tabs restored");
    assert!(tabs.iter().any(|t| t.id == "tab1"), "Should have tab1");
    assert!(tabs.iter().any(|t| t.id == "tab2"), "Should have tab2");

    let windows = {
        let doc = crdt_manager2.get_or_create_document("default");
        let doc_guard = doc.lock().unwrap();
        doc_guard.get_windows().unwrap()
    };
    assert_eq!(windows.len(), 1, "Should have 1 window restored");
    assert!(windows[0].tracked, "Window should be tracked");

    // Scenario 3: Continue operations with restored manager
    let clock4 = crdt_manager2.tick_clock(); // Should be 4
    assert_eq!(clock4, 4, "Next clock should be 4");

    let op4 = CrdtOperation::CloseTab {
        id: "tab1".to_string(),
        closed_at: clock4,
    };

    repositories
        .operations
        .store(&op4, clock4, "device2")
        .await
        .unwrap();

    // Verify final state
    let final_max = repositories.operations.get_max_clock().await.unwrap();
    assert_eq!(
        final_max, 4,
        "Should have max clock of 4 after new operation"
    );
}
