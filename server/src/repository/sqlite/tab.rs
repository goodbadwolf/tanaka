use async_trait::async_trait;
use sqlx::{Row, SqlitePool};
use std::sync::Arc;

use crate::error::AppError;
use crate::models::Tab;
use crate::repository::TabRepository;

pub struct SqliteTabRepository {
    pool: Arc<SqlitePool>,
}

impl SqliteTabRepository {
    #[must_use]
    pub fn new(pool: Arc<SqlitePool>) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl TabRepository for SqliteTabRepository {
    async fn get(&self, id: &str) -> Result<Option<Tab>, AppError> {
        let result = sqlx::query(
            r#"
            SELECT
                id,
                window_id,
                url,
                title,
                active,
                "index",
                updated_at
            FROM tabs
            WHERE id = ?
            "#,
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
        sqlx::query(
            r#"
            INSERT INTO tabs (id, window_id, url, title, active, "index", updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                window_id = excluded.window_id,
                url = excluded.url,
                title = excluded.title,
                active = excluded.active,
                "index" = excluded."index",
                updated_at = excluded.updated_at
            "#,
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
        sqlx::query("DELETE FROM tabs WHERE id = ?")
            .bind(id)
            .execute(&*self.pool)
            .await
            .map_err(|e| AppError::database("Failed to delete tab", e))?;

        Ok(())
    }

    async fn get_all(&self) -> Result<Vec<Tab>, AppError> {
        let rows = sqlx::query(
            r#"
            SELECT
                id,
                window_id,
                url,
                title,
                active,
                "index",
                updated_at
            FROM tabs
            ORDER BY window_id, "index"
            "#,
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
