use crate::crdt::CrdtManager;
use crate::error::{AppError, AppResult};
use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use std::sync::Arc;
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[cfg_attr(
    feature = "generate-api-models",
    ts(export, export_to = "../../extension/src/api/sync/")
)]
pub struct SyncRequest {
    pub clock: u64,
    pub device_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub since_clock: Option<u64>,
    pub operations: Vec<CrdtOperation>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[cfg_attr(
    feature = "generate-api-models",
    ts(export, export_to = "../../extension/src/api/sync/")
)]
pub struct SyncResponse {
    pub clock: u64,
    pub operations: Vec<CrdtOperation>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[cfg_attr(
    feature = "generate-api-models",
    ts(export, export_to = "../../extension/src/api/sync/")
)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum CrdtOperation {
    UpsertTab {
        id: String,
        data: TabData,
    },
    CloseTab {
        id: String,
        closed_at: u64,
    },
    SetActive {
        id: String,
        active: bool,
        updated_at: u64,
    },
    MoveTab {
        id: String,
        window_id: String,
        index: i32,
        updated_at: u64,
    },
    ChangeUrl {
        id: String,
        url: String,
        title: Option<String>,
        updated_at: u64,
    },
    TrackWindow {
        id: String,
        tracked: bool,
        updated_at: u64,
    },
    UntrackWindow {
        id: String,
        updated_at: u64,
    },
    SetWindowFocus {
        id: String,
        focused: bool,
        updated_at: u64,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[cfg_attr(
    feature = "generate-api-models",
    ts(export, export_to = "../../extension/src/api/sync/")
)]
pub struct TabData {
    pub window_id: String,
    pub url: String,
    pub title: String,
    pub active: bool,
    pub index: i32,
    pub updated_at: u64,
}

impl CrdtOperation {
    #[must_use]
    pub fn target_id(&self) -> &str {
        match self {
            CrdtOperation::UpsertTab { id, .. }
            | CrdtOperation::CloseTab { id, .. }
            | CrdtOperation::SetActive { id, .. }
            | CrdtOperation::MoveTab { id, .. }
            | CrdtOperation::ChangeUrl { id, .. }
            | CrdtOperation::TrackWindow { id, .. }
            | CrdtOperation::UntrackWindow { id, .. }
            | CrdtOperation::SetWindowFocus { id, .. } => id,
        }
    }

    #[must_use]
    pub fn operation_type(&self) -> &'static str {
        match self {
            CrdtOperation::UpsertTab { .. } => "upsert_tab",
            CrdtOperation::CloseTab { .. } => "close_tab",
            CrdtOperation::SetActive { .. } => "set_active",
            CrdtOperation::MoveTab { .. } => "move_tab",
            CrdtOperation::ChangeUrl { .. } => "change_url",
            CrdtOperation::TrackWindow { .. } => "track_window",
            CrdtOperation::UntrackWindow { .. } => "untrack_window",
            CrdtOperation::SetWindowFocus { .. } => "set_window_focus",
        }
    }

    #[must_use]
    pub fn updated_at(&self) -> u64 {
        match self {
            CrdtOperation::UpsertTab { data, .. } => data.updated_at,
            CrdtOperation::CloseTab { closed_at, .. } => *closed_at,
            CrdtOperation::SetActive { updated_at, .. }
            | CrdtOperation::MoveTab { updated_at, .. }
            | CrdtOperation::ChangeUrl { updated_at, .. }
            | CrdtOperation::TrackWindow { updated_at, .. }
            | CrdtOperation::UntrackWindow { updated_at, .. }
            | CrdtOperation::SetWindowFocus { updated_at, .. } => *updated_at,
        }
    }

    /// Validates the operation for correctness.
    ///
    /// # Errors
    ///
    /// Returns `AppError::Validation` if the operation contains invalid data.
    pub fn validate(&self) -> AppResult<()> {
        match self {
            CrdtOperation::UpsertTab { id, data } => {
                if id.is_empty() {
                    return Err(AppError::validation("Tab ID cannot be empty", Some("id")));
                }
                if data.url.is_empty() {
                    return Err(AppError::validation(
                        "Tab URL cannot be empty",
                        Some("data.url"),
                    ));
                }
                if data.window_id.is_empty() {
                    return Err(AppError::validation(
                        "Window ID cannot be empty",
                        Some("data.window_id"),
                    ));
                }
                if data.index < 0 {
                    return Err(AppError::validation(
                        "Tab index cannot be negative",
                        Some("data.index"),
                    ));
                }
            }
            CrdtOperation::CloseTab { id, .. }
            | CrdtOperation::SetActive { id, .. }
            | CrdtOperation::MoveTab { id, .. }
            | CrdtOperation::ChangeUrl { id, .. } => {
                if id.is_empty() {
                    return Err(AppError::validation("Tab ID cannot be empty", Some("id")));
                }
            }
            CrdtOperation::TrackWindow { id, .. }
            | CrdtOperation::UntrackWindow { id, .. }
            | CrdtOperation::SetWindowFocus { id, .. } => {
                if id.is_empty() {
                    return Err(AppError::validation(
                        "Window ID cannot be empty",
                        Some("id"),
                    ));
                }
            }
        }

        if let CrdtOperation::ChangeUrl { url, .. } = self {
            if url.is_empty() {
                return Err(AppError::validation("URL cannot be empty", Some("url")));
            }
        }

        if let CrdtOperation::MoveTab {
            window_id, index, ..
        } = self
        {
            if window_id.is_empty() {
                return Err(AppError::validation(
                    "Window ID cannot be empty",
                    Some("window_id"),
                ));
            }
            if *index < 0 {
                return Err(AppError::validation(
                    "Tab index cannot be negative",
                    Some("index"),
                ));
            }
        }

        Ok(())
    }
}

/// Handles CRDT synchronization requests.
///
/// # Errors
///
/// Returns `AppError::Validation` if any operation in the request is invalid.
/// Returns `AppError::Database` if database operations fail.
/// Returns `AppError::Sync` if CRDT operations fail.
pub async fn sync_handler(
    State((crdt_manager, db_pool)): State<(Arc<CrdtManager>, SqlitePool)>,
    Json(request): Json<SyncRequest>,
) -> AppResult<Json<SyncResponse>> {
    let start = std::time::Instant::now();
    let incoming_ops_count = request.operations.len();

    tracing::debug!(
        device_id = %request.device_id,
        clock = request.clock,
        since_clock = request.since_clock,
        operations_count = incoming_ops_count,
        "Starting sync operation"
    );

    // Validate all incoming operations
    for operation in &request.operations {
        operation.validate()?;
    }

    // Update server clock with client's clock
    let _server_clock = crdt_manager.update_clock(request.clock);

    // Process incoming operations
    let mut processed_operations = Vec::new();
    for operation in request.operations {
        let operation_clock = crdt_manager.current_clock();

        tracing::debug!(
            operation_type = operation.operation_type(),
            target_id = operation.target_id(),
            clock = operation_clock,
            "Processing CRDT operation"
        );

        // Store operation with server-assigned clock and device_id
        let stored_operation = store_operation(
            &crdt_manager,
            &db_pool,
            operation,
            operation_clock,
            &request.device_id,
        )
        .await?;
        processed_operations.push(stored_operation);
    }

    // Get operations that happened since client's last sync
    // Exclude operations from the same device to avoid echoing back
    let response_operations = if let Some(since_clock) = request.since_clock {
        get_operations_since(&db_pool, since_clock, Some(&request.device_id)).await?
    } else {
        // If no since_clock provided, return all recent operations
        get_recent_operations(&db_pool, 100, Some(&request.device_id)).await?
    };

    let current_clock = crdt_manager.current_clock();
    let duration_ms = start.elapsed().as_millis();

    tracing::info!(
        device_id = %request.device_id,
        incoming_operations = incoming_ops_count,
        response_operations = response_operations.len(),
        clock = current_clock,
        duration_ms = duration_ms,
        "Sync completed successfully"
    );

    Ok(Json(SyncResponse {
        clock: current_clock,
        operations: response_operations,
    }))
}

/// Stores a CRDT operation in the database and applies it to the state.
///
/// # Errors
///
/// Returns `AppError::Internal` if serialization fails.
/// Returns `AppError::Database` if database operations fail.
/// Returns `AppError::Sync` if CRDT state application fails.
async fn store_operation(
    crdt_manager: &CrdtManager,
    db_pool: &SqlitePool,
    operation: CrdtOperation,
    clock: u64,
    device_id: &str,
) -> AppResult<CrdtOperation> {
    // Convert operation to JSON for storage
    let operation_data = serde_json::to_string(&operation)
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
    .execute(db_pool)
    .await
    .map_err(|e| AppError::database("Failed to store CRDT operation", e))?;

    tracing::debug!(
        operation_type = operation.operation_type(),
        target_id = operation.target_id(),
        clock = clock,
        "Stored CRDT operation to database"
    );

    // Apply operation to CRDT state
    apply_operation_to_state(crdt_manager, &operation, clock)?;

    Ok(operation)
}

/// Applies a CRDT operation to the document state.
///
/// # Errors
///
/// Returns `AppError::Sync` if the CRDT operation fails.
///
/// # Panics
///
/// Panics if the mutex is poisoned.
#[allow(clippy::too_many_lines)] // Function handles all operation types
fn apply_operation_to_state(
    crdt_manager: &CrdtManager,
    operation: &CrdtOperation,
    clock: u64,
) -> AppResult<()> {
    // Use a default document ID for now - could be made configurable
    let doc_id = "default";
    let doc_ref = crdt_manager.get_or_create_document(doc_id);
    let mut doc = doc_ref.lock().unwrap();

    match operation {
        CrdtOperation::UpsertTab { id, data } => {
            let crdt_tab = crate::crdt::CrdtTab {
                id: id.clone(),
                window_id: data.window_id.clone(),
                url: data.url.clone(),
                title: data.title.clone(),
                active: data.active,
                index: data.index,
                updated_at: clock,
            };

            doc.upsert_tab(&crdt_tab)?;
            tracing::debug!(tab_id = %id, "Applied upsert_tab operation");
        }
        CrdtOperation::CloseTab { id, .. } => {
            doc.remove_tab(id)?;
            tracing::debug!(tab_id = %id, "Applied close_tab operation");
        }
        CrdtOperation::SetActive { id, active, .. } => {
            // First get the current tab, update it, then upsert
            let tabs = doc.get_tabs()?;
            if let Some(mut tab) = tabs.into_iter().find(|t| t.id == *id) {
                tab.active = *active;
                tab.updated_at = clock;
                doc.upsert_tab(&tab)?;
                tracing::debug!(tab_id = %id, active = active, "Applied set_active operation");
            } else {
                tracing::warn!(tab_id = %id, "Tab not found for set_active operation");
            }
        }
        CrdtOperation::MoveTab {
            id,
            window_id,
            index,
            ..
        } => {
            // Get current tab, update window and index
            let tabs = doc.get_tabs()?;
            if let Some(mut tab) = tabs.into_iter().find(|t| t.id == *id) {
                tab.window_id.clone_from(window_id);
                tab.index = *index;
                tab.updated_at = clock;
                doc.upsert_tab(&tab)?;
                tracing::debug!(
                    tab_id = %id,
                    window_id = %window_id,
                    index = index,
                    "Applied move_tab operation"
                );
            } else {
                tracing::warn!(tab_id = %id, "Tab not found for move_tab operation");
            }
        }
        CrdtOperation::ChangeUrl { id, url, title, .. } => {
            // Update tab URL and title
            let tabs = doc.get_tabs()?;
            if let Some(mut tab) = tabs.into_iter().find(|t| t.id == *id) {
                tab.url.clone_from(url);
                if let Some(new_title) = title {
                    tab.title.clone_from(new_title);
                }
                tab.updated_at = clock;
                doc.upsert_tab(&tab)?;
                tracing::debug!(
                    tab_id = %id,
                    url = %url,
                    title = ?title,
                    "Applied change_url operation"
                );
            } else {
                tracing::warn!(tab_id = %id, "Tab not found for change_url operation");
            }
        }
        CrdtOperation::TrackWindow { id, tracked, .. } => {
            let window = crate::crdt::CrdtWindow {
                id: id.clone(),
                tracked: *tracked,
                tab_count: 0, // Will be updated based on tab operations
                updated_at: clock,
            };
            doc.upsert_window(&window)?;
            tracing::debug!(
                window_id = %id,
                tracked = tracked,
                "Applied track_window operation"
            );
        }
        CrdtOperation::UntrackWindow { id, .. } => {
            // Mark window as untracked rather than removing
            let windows = doc.get_windows()?;
            if let Some(mut window) = windows.into_iter().find(|w| w.id == *id) {
                window.tracked = false;
                window.updated_at = clock;
                doc.upsert_window(&window)?;
                tracing::debug!(window_id = %id, "Applied untrack_window operation");
            } else {
                // Create new untracked window entry
                let window = crate::crdt::CrdtWindow {
                    id: id.clone(),
                    tracked: false,
                    tab_count: 0,
                    updated_at: clock,
                };
                doc.upsert_window(&window)?;
                tracing::debug!(window_id = %id, "Created untracked window entry");
            }
        }
        CrdtOperation::SetWindowFocus { id, focused, .. } => {
            // For now, we'll track focus state in window metadata
            // This could be extended to track which window has focus globally
            let windows = doc.get_windows()?;
            if let Some(mut window) = windows.into_iter().find(|w| w.id == *id) {
                // Focus state could be added to CrdtWindow struct if needed
                window.updated_at = clock;
                doc.upsert_window(&window)?;
                tracing::debug!(
                    window_id = %id,
                    focused = focused,
                    "Applied set_window_focus operation"
                );
            } else {
                tracing::warn!(window_id = %id, "Window not found for set_window_focus operation");
            }
        }
    }

    Ok(())
}

/// Gets operations that occurred after a given clock value.
///
/// # Errors
///
/// Returns `AppError::Database` if database query fails.
/// Returns `AppError::Internal` if operation deserialization fails.
async fn get_operations_since(
    db_pool: &SqlitePool,
    since_clock: u64,
    exclude_device_id: Option<&str>,
) -> AppResult<Vec<CrdtOperation>> {
    #[derive(sqlx::FromRow)]
    struct OperationRow {
        operation_data: String,
    }

    tracing::debug!(since_clock = since_clock, exclude_device_id = ?exclude_device_id, "Getting operations since clock");

    let rows = if let Some(device_id) = exclude_device_id {
        sqlx::query_as::<_, OperationRow>(
            "SELECT operation_data FROM crdt_operations WHERE clock > ? AND device_id != ? ORDER BY clock ASC"
        )
        .bind(i64::try_from(since_clock).unwrap_or(i64::MAX))
        .bind(device_id)
        .fetch_all(db_pool)
        .await
    } else {
        sqlx::query_as::<_, OperationRow>(
            "SELECT operation_data FROM crdt_operations WHERE clock > ? ORDER BY clock ASC"
        )
        .bind(i64::try_from(since_clock).unwrap_or(i64::MAX))
        .fetch_all(db_pool)
        .await
    }
    .map_err(|e| AppError::database("Failed to fetch operations since clock", e))?;

    let mut operations = Vec::new();
    for row in rows {
        let operation: CrdtOperation = serde_json::from_str(&row.operation_data)
            .map_err(|e| AppError::internal(format!("Failed to deserialize operation: {e}")))?;
        operations.push(operation);
    }

    tracing::debug!(
        since_clock = since_clock,
        operations_count = operations.len(),
        "Retrieved operations since clock"
    );

    Ok(operations)
}

/// Gets the most recent operations up to a specified limit.
///
/// # Errors
///
/// Returns `AppError::Database` if database query fails.
/// Returns `AppError::Internal` if operation deserialization fails.
async fn get_recent_operations(
    db_pool: &SqlitePool,
    limit: usize,
    exclude_device_id: Option<&str>,
) -> AppResult<Vec<CrdtOperation>> {
    #[derive(sqlx::FromRow)]
    struct OperationRow {
        operation_data: String,
    }

    tracing::debug!(limit = limit, exclude_device_id = ?exclude_device_id, "Getting recent operations");

    let rows = if let Some(device_id) = exclude_device_id {
        sqlx::query_as::<_, OperationRow>(
            "SELECT operation_data FROM crdt_operations WHERE device_id != ? ORDER BY clock DESC LIMIT ?"
        )
        .bind(device_id)
        .bind(i64::try_from(limit).unwrap_or(i64::MAX))
        .fetch_all(db_pool)
        .await
    } else {
        sqlx::query_as::<_, OperationRow>(
            "SELECT operation_data FROM crdt_operations ORDER BY clock DESC LIMIT ?"
        )
        .bind(i64::try_from(limit).unwrap_or(i64::MAX))
        .fetch_all(db_pool)
        .await
    }
    .map_err(|e| AppError::database("Failed to fetch recent operations", e))?;

    let mut operations = Vec::new();
    for row in rows {
        let operation: CrdtOperation = serde_json::from_str(&row.operation_data)
            .map_err(|e| AppError::internal(format!("Failed to deserialize operation: {e}")))?;
        operations.push(operation);
    }

    // Reverse to get chronological order (oldest first)
    operations.reverse();

    tracing::debug!(
        limit = limit,
        operations_count = operations.len(),
        "Retrieved recent operations"
    );

    Ok(operations)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_operation_validation() {
        let valid_upsert = CrdtOperation::UpsertTab {
            id: "tab1".to_string(),
            data: TabData {
                window_id: "window1".to_string(),
                url: "https://example.com".to_string(),
                title: "Example".to_string(),
                active: true,
                index: 0,
                updated_at: 1_234_567_890,
            },
        };
        assert!(valid_upsert.validate().is_ok());

        let invalid_upsert = CrdtOperation::UpsertTab {
            id: String::new(), // Empty ID
            data: TabData {
                window_id: "window1".to_string(),
                url: "https://example.com".to_string(),
                title: "Example".to_string(),
                active: true,
                index: 0,
                updated_at: 1_234_567_890,
            },
        };
        assert!(invalid_upsert.validate().is_err());
    }

    #[test]
    fn test_operation_properties() {
        let operation = CrdtOperation::UpsertTab {
            id: "tab1".to_string(),
            data: TabData {
                window_id: "window1".to_string(),
                url: "https://example.com".to_string(),
                title: "Example".to_string(),
                active: true,
                index: 0,
                updated_at: 1_234_567_890,
            },
        };

        assert_eq!(operation.target_id(), "tab1");
        assert_eq!(operation.operation_type(), "upsert_tab");
        assert_eq!(operation.updated_at(), 1_234_567_890);
    }

    #[test]
    fn test_serialization() {
        let operation = CrdtOperation::CloseTab {
            id: "tab1".to_string(),
            closed_at: 1_234_567_890,
        };

        let json = serde_json::to_string(&operation).unwrap();
        let deserialized: CrdtOperation = serde_json::from_str(&json).unwrap();

        assert_eq!(operation.target_id(), deserialized.target_id());
        assert_eq!(operation.operation_type(), deserialized.operation_type());
    }
}
