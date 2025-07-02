use async_trait::async_trait;
use sqlx::SqlitePool;
use std::sync::Arc;

use crate::error::AppError;
use crate::repository::OperationRepository;
use crate::sync::{CrdtOperation, StoredOperation};

pub struct SqliteOperationRepository {
    pool: Arc<SqlitePool>,
}

impl SqliteOperationRepository {
    #[must_use]
    pub fn new(pool: Arc<SqlitePool>) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl OperationRepository for SqliteOperationRepository {
    async fn store(
        &self,
        operation: &CrdtOperation,
        clock: u64,
        device_id: &str,
    ) -> Result<(), AppError> {
        // Convert operation to JSON for storage
        let operation_data = serde_json::to_string(operation)
            .map_err(|e| AppError::internal(format!("Failed to serialize operation: {e}")))?;

        // Generate operation ID with device_id for uniqueness
        let operation_id = format!("{}_{}_{}", clock, device_id, operation.target_id());

        // Store in operations log
        sqlx::query(
            r"
            INSERT INTO crdt_operations (
                id, clock, device_id, operation_type, target_id, operation_data, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ",
        )
        .bind(&operation_id)
        .bind(i64::try_from(clock).unwrap_or(i64::MAX))
        .bind(device_id)
        .bind(operation.operation_type())
        .bind(operation.target_id())
        .bind(&operation_data)
        .bind(chrono::Utc::now().timestamp())
        .execute(&*self.pool)
        .await
        .map_err(|e| AppError::database("Failed to store CRDT operation", e))?;

        Ok(())
    }

    async fn get_since(
        &self,
        device_id: &str,
        since_clock: u64,
    ) -> Result<Vec<StoredOperation>, AppError> {
        #[derive(sqlx::FromRow)]
        #[allow(dead_code)]
        struct OperationRow {
            id: String,
            clock: i64,
            device_id: String,
            operation_type: String,
            target_id: String,
            operation_data: String,
            created_at: i64,
        }

        let rows = sqlx::query_as::<_, OperationRow>(
            "SELECT id, clock, device_id, operation_type, target_id, operation_data, created_at
             FROM crdt_operations
             WHERE clock > ? AND device_id != ?
             ORDER BY clock ASC",
        )
        .bind(i64::try_from(since_clock).unwrap_or(i64::MAX))
        .bind(device_id)
        .fetch_all(&*self.pool)
        .await
        .map_err(|e| AppError::database("Failed to fetch operations since clock", e))?;

        let mut operations = Vec::new();
        for row in rows {
            let operation: CrdtOperation = serde_json::from_str(&row.operation_data)
                .map_err(|e| AppError::internal(format!("Failed to deserialize operation: {e}")))?;

            operations.push(StoredOperation {
                id: row.id,
                clock: u64::try_from(row.clock).unwrap_or(0),
                device_id: row.device_id,
                operation,
                created_at: row.created_at,
            });
        }

        Ok(operations)
    }

    async fn get_recent(
        &self,
        device_id: &str,
        limit: i64,
    ) -> Result<Vec<StoredOperation>, AppError> {
        #[derive(sqlx::FromRow)]
        #[allow(dead_code)]
        struct OperationRow {
            id: String,
            clock: i64,
            device_id: String,
            operation_type: String,
            target_id: String,
            operation_data: String,
            created_at: i64,
        }

        let rows = sqlx::query_as::<_, OperationRow>(
            "SELECT id, clock, device_id, operation_type, target_id, operation_data, created_at
             FROM crdt_operations
             WHERE device_id != ?
             ORDER BY clock DESC
             LIMIT ?",
        )
        .bind(device_id)
        .bind(limit)
        .fetch_all(&*self.pool)
        .await
        .map_err(|e| AppError::database("Failed to fetch recent operations", e))?;

        let mut operations = Vec::new();
        for row in rows {
            let operation: CrdtOperation = serde_json::from_str(&row.operation_data)
                .map_err(|e| AppError::internal(format!("Failed to deserialize operation: {e}")))?;

            operations.push(StoredOperation {
                id: row.id,
                clock: u64::try_from(row.clock).unwrap_or(0),
                device_id: row.device_id,
                operation,
                created_at: row.created_at,
            });
        }

        // Reverse to get chronological order (we fetched DESC)
        operations.reverse();

        Ok(operations)
    }
}
