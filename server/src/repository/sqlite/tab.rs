use async_trait::async_trait;
use sqlx::{Row, SqlitePool};
use std::sync::Arc;

use super::cache::StatementCache;
use crate::error::AppError;
use crate::models::Tab;
use crate::repository::TabRepository;

pub struct SqliteTabRepository {
    pool: Arc<SqlitePool>,
    cache: Arc<StatementCache>,
}

impl SqliteTabRepository {
    #[must_use]
    pub fn new(pool: Arc<SqlitePool>) -> Self {
        let cache = Arc::new(StatementCache::new(pool.clone()));
        Self { pool, cache }
    }

    /// Creates a repository with a shared statement cache for optimal performance.
    #[must_use]
    pub fn with_cache(pool: Arc<SqlitePool>, cache: Arc<StatementCache>) -> Self {
        Self { pool, cache }
    }
}

#[async_trait]
impl TabRepository for SqliteTabRepository {
    async fn get(&self, id: &str) -> Result<Option<Tab>, AppError> {
        // Prepare statement in cache
        self.cache.get_or_prepare(
            "tabs:select_by_id",
            r#"SELECT id, window_id, url, title, active, "index", updated_at FROM tabs WHERE id = ?"#,
        ).await
        .map_err(|e| AppError::database("Failed to prepare tab select statement", e))?;

        let result = sqlx::query(
            r#"SELECT id, window_id, url, title, active, "index", updated_at FROM tabs WHERE id = ?"#,
        )
        .bind(id)
        .fetch_optional(&*self.pool)
        .await
        .map_err(|e| AppError::database("Failed to get tab", e))?;

        if let Some(row) = result {
            Ok(Some(Tab {
                id: row.get("id"),
                window_id: row.get("window_id"),
                url: row.get("url"),
                title: row.get("title"),
                active: row.get::<i64, _>("active") != 0,
                index: row.get("index"),
                updated_at: row.get("updated_at"),
            }))
        } else {
            Ok(None)
        }
    }

    async fn upsert(&self, tab: &Tab) -> Result<(), AppError> {
        // Prepare statement in cache (using INSERT OR REPLACE for SQLite compatibility)
        self.cache.get_or_prepare(
            "tabs:insert_or_replace",
            r#"INSERT OR REPLACE INTO tabs (id, window_id, url, title, active, "index", updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"#,
        ).await
        .map_err(|e| AppError::database("Failed to prepare tab upsert statement", e))?;

        sqlx::query(
            r#"INSERT OR REPLACE INTO tabs (id, window_id, url, title, active, "index", updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"#,
        )
        .bind(&tab.id)
        .bind(&tab.window_id)
        .bind(&tab.url)
        .bind(&tab.title)
        .bind(i64::from(tab.active))
        .bind(tab.index)
        .bind(tab.updated_at)
        .execute(&*self.pool)
        .await
        .map_err(|e| AppError::database("Failed to upsert tab", e))?;

        Ok(())
    }

    async fn delete(&self, id: &str) -> Result<(), AppError> {
        // Prepare statement in cache
        self.cache
            .get_or_prepare("tabs:delete_by_id", "DELETE FROM tabs WHERE id = ?")
            .await
            .map_err(|e| AppError::database("Failed to prepare tab delete statement", e))?;

        sqlx::query("DELETE FROM tabs WHERE id = ?")
            .bind(id)
            .execute(&*self.pool)
            .await
            .map_err(|e| AppError::database("Failed to delete tab", e))?;

        Ok(())
    }

    async fn get_all(&self) -> Result<Vec<Tab>, AppError> {
        // Prepare statement in cache
        self.cache.get_or_prepare(
            "tabs:select_all",
            r#"SELECT id, window_id, url, title, active, "index", updated_at FROM tabs ORDER BY window_id, "index""#,
        ).await
        .map_err(|e| AppError::database("Failed to prepare tab select all statement", e))?;

        let rows = sqlx::query(
            r#"SELECT id, window_id, url, title, active, "index", updated_at FROM tabs ORDER BY window_id, "index""#,
        )
        .fetch_all(&*self.pool)
        .await
        .map_err(|e| AppError::database("Failed to get all tabs", e))?;

        let mut tabs = Vec::new();
        for row in rows {
            tabs.push(Tab {
                id: row.get("id"),
                window_id: row.get("window_id"),
                url: row.get("url"),
                title: row.get("title"),
                active: row.get::<i64, _>("active") != 0,
                index: row.get("index"),
                updated_at: row.get("updated_at"),
            });
        }

        Ok(tabs)
    }
}
