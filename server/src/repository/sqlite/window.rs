use async_trait::async_trait;
use sqlx::{Row, SqlitePool};
use std::sync::Arc;

use super::cache::StatementCache;
use crate::error::AppError;
use crate::models::Window;
use crate::repository::WindowRepository;

pub struct SqliteWindowRepository {
    pool: Arc<SqlitePool>,
    cache: Arc<StatementCache>,
}

impl SqliteWindowRepository {
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
impl WindowRepository for SqliteWindowRepository {
    async fn get(&self, id: &str) -> Result<Option<Window>, AppError> {
        // For now, windows are tracked in the CRDT state, not in a separate table
        // Prepare statement in cache
        self.cache.get_or_prepare(
            "windows:select_by_id",
            "SELECT entity_id, current_data, last_clock FROM crdt_state WHERE entity_type = 'window' AND entity_id = ?",
        ).await
        .map_err(|e| AppError::database("Failed to prepare window select statement", e))?;

        let result = sqlx::query(
            "SELECT entity_id, current_data, last_clock FROM crdt_state WHERE entity_type = 'window' AND entity_id = ?",
        )
        .bind(id)
        .fetch_optional(&*self.pool)
        .await
        .map_err(|e| AppError::database("Failed to get window", e))?;

        if let Some(row) = result {
            let data_str: String = row.get("current_data");
            // Parse the JSON from current_data
            if let Ok(window_data) = serde_json::from_str::<Window>(&data_str) {
                Ok(Some(window_data))
            } else {
                // Fallback for invalid JSON
                Ok(Some(Window {
                    id: row.get("entity_id"),
                    tracked: true, // Placeholder
                    tab_count: 0,  // Placeholder
                    updated_at: row.get("last_clock"),
                }))
            }
        } else {
            Ok(None)
        }
    }

    async fn upsert(&self, window: &Window) -> Result<(), AppError> {
        // For now, this would interact with the CRDT state
        // In a real implementation, we might want a dedicated windows table

        let window_data = serde_json::to_string(window)
            .map_err(|e| AppError::internal(format!("Failed to serialize window: {e}")))?;

        sqlx::query(
            r"
            INSERT INTO crdt_state (entity_type, entity_id, current_data, last_clock, updated_at)
            VALUES ('window', ?, ?, ?, ?)
            ON CONFLICT(entity_type, entity_id) DO UPDATE SET
                current_data = excluded.current_data,
                last_clock = excluded.last_clock,
                updated_at = excluded.updated_at
            ",
        )
        .bind(&window.id)
        .bind(&window_data)
        .bind(window.updated_at)
        .bind(window.updated_at)
        .execute(&*self.pool)
        .await
        .map_err(|e| AppError::database("Failed to upsert window", e))?;

        Ok(())
    }

    async fn delete(&self, id: &str) -> Result<(), AppError> {
        sqlx::query("DELETE FROM crdt_state WHERE entity_type = 'window' AND entity_id = ?")
            .bind(id)
            .execute(&*self.pool)
            .await
            .map_err(|e| AppError::database("Failed to delete window", e))?;

        Ok(())
    }

    async fn get_all(&self) -> Result<Vec<Window>, AppError> {
        // Placeholder implementation - in reality would parse JSON from crdt_state
        let rows = sqlx::query(
            r"
            SELECT
                entity_id,
                current_data,
                last_clock
            FROM crdt_state
            WHERE entity_type = 'window'
            ORDER BY entity_id
            ",
        )
        .fetch_all(&*self.pool)
        .await
        .map_err(|e| AppError::database("Failed to get all windows", e))?;

        let mut windows = Vec::new();
        for row in rows {
            // In a real implementation, we would parse the JSON from current_data
            windows.push(Window {
                id: row.get("entity_id"),
                tracked: true, // Placeholder
                tab_count: 0,  // Placeholder
                updated_at: row.get("last_clock"),
            });
        }

        Ok(windows)
    }

    async fn get_tracked(&self) -> Result<Vec<Window>, AppError> {
        // Placeholder implementation - in reality would parse JSON from crdt_state
        // and filter for tracked windows
        let rows = sqlx::query(
            r"
            SELECT
                entity_id,
                current_data,
                last_clock
            FROM crdt_state
            WHERE entity_type = 'window'
            ORDER BY entity_id
            ",
        )
        .fetch_all(&*self.pool)
        .await
        .map_err(|e| AppError::database("Failed to get tracked windows", e))?;

        let mut windows = Vec::new();
        for row in rows {
            let data_str: String = row.get("current_data");
            // Try to parse the JSON to check if tracked
            if let Ok(window_data) = serde_json::from_str::<Window>(&data_str) {
                if window_data.tracked {
                    windows.push(window_data);
                }
            } else {
                // Fallback for placeholder data
                windows.push(Window {
                    id: row.get("entity_id"),
                    tracked: true, // Placeholder
                    tab_count: 0,  // Placeholder
                    updated_at: row.get("last_clock"),
                });
            }
        }

        Ok(windows)
    }
}
