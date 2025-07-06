use sqlx::Row;
use tanaka_server::config::DatabaseConfig;
use tanaka_server::setup_database;
use tempfile::tempdir;

#[tokio::test]
async fn test_setup_database_runs_migrations() {
    let temp_dir = tempdir().unwrap();
    let db_path = temp_dir.path().join("test.db");
    let config = DatabaseConfig {
        url: format!("sqlite://{}", db_path.display()),
        max_connections: 5,
        connection_timeout_secs: 10,
    };

    // Create database and run migrations
    let pool = setup_database(&config).await.unwrap();

    // Verify migrations table exists
    let result = sqlx::query("SELECT COUNT(*) as count FROM _sqlx_migrations")
        .fetch_one(&pool)
        .await
        .unwrap();

    let count: i32 = result.get("count");
    assert!(count >= 1); // At least one migration should be applied

    // Verify tables were created
    let tables = sqlx::query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .fetch_all(&pool)
        .await
        .unwrap();

    let table_names: Vec<String> = tables.iter().map(|row| row.get("name")).collect();

    assert!(table_names.contains(&"crdt_operations".to_string()));
    assert!(table_names.contains(&"crdt_state".to_string()));
}

#[tokio::test]
async fn test_setup_database_creates_if_not_exists() {
    let temp_dir = tempdir().unwrap();
    let db_path = temp_dir.path().join("new_test.db");

    // Ensure database doesn't exist
    assert!(!db_path.exists());

    let config = DatabaseConfig {
        url: format!("sqlite://{}", db_path.display()),
        max_connections: 5,
        connection_timeout_secs: 10,
    };

    // Should create database and run migrations
    let pool = setup_database(&config).await.unwrap();

    // Verify database was created
    assert!(db_path.exists());

    // Verify migrations ran
    let result = sqlx::query("SELECT COUNT(*) as count FROM _sqlx_migrations")
        .fetch_one(&pool)
        .await
        .unwrap();

    let count: i32 = result.get("count");
    assert!(count >= 1);
}

#[tokio::test]
async fn test_migrations_are_reversible() {
    // This test verifies that our migrations have proper up/down files
    use std::fs;
    use std::path::Path;

    let migrations_dir = Path::new("migrations");
    assert!(migrations_dir.exists(), "migrations directory should exist");

    let entries = fs::read_dir(migrations_dir).unwrap();
    let migration_files: Vec<String> = entries
        .filter_map(|entry| {
            entry
                .ok()
                .and_then(|e| e.file_name().to_str().map(std::string::ToString::to_string))
        })
        .collect();

    // Check that we have both .up.sql and .down.sql files
    let up_files: Vec<&String> = migration_files
        .iter()
        .filter(|f| f.ends_with(".up.sql"))
        .collect();

    let down_files: Vec<&String> = migration_files
        .iter()
        .filter(|f| f.ends_with(".down.sql"))
        .collect();

    assert!(
        !up_files.is_empty(),
        "Should have at least one .up.sql migration"
    );
    assert!(
        !down_files.is_empty(),
        "Should have at least one .down.sql migration"
    );
    assert_eq!(
        up_files.len(),
        down_files.len(),
        "Each migration should have both up and down files"
    );

    // Verify that each up file has a corresponding down file
    for up_file in up_files {
        let base_name = up_file.trim_end_matches(".up.sql");
        let expected_down = format!("{base_name}.down.sql");
        assert!(
            migration_files.contains(&expected_down),
            "Migration {up_file} should have corresponding down file"
        );
    }
}
