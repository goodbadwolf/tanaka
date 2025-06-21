use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};

pub async fn init_db() -> Result<SqlitePool, sqlx::Error> {
    let _ = tokio::fs::File::create("tabs.db").await;

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect("sqlite:tabs.db")
        .await?;

    sqlx::query("PRAGMA journal_mode = WAL")
        .execute(&pool)
        .await?;

    sqlx::query("PRAGMA busy_timeout = 3000")
        .execute(&pool)
        .await?;

    sqlx::query(
        r"
        CREATE TABLE IF NOT EXISTS tabs (
            id TEXT PRIMARY KEY,
            window_id TEXT NOT NULL,
            data TEXT NOT NULL,
            updated_at INTEGER NOT NULL
        )
        ",
    )
    .execute(&pool)
    .await?;

    Ok(pool)
}
