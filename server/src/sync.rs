use axum::{extract::State, Json};
use sqlx::{query, Row, SqlitePool};
use std::time::Instant;
use tanaka_server::error::AppResult;
use tanaka_server::models::{SyncRequest, SyncResponse, Tab};

const UPSERT_TAB_SQL: &str = r"
    INSERT INTO tabs (id, window_id, data, updated_at)
    VALUES (?1, ?2, ?3, ?4)
    ON CONFLICT(id) DO UPDATE SET
        window_id = excluded.window_id,
        data = excluded.data,
        updated_at = excluded.updated_at
";

const SELECT_ALL_TABS_SQL: &str = r"
    SELECT id, window_id, data, updated_at
    FROM tabs
    ORDER BY updated_at DESC
";

pub async fn sync_handler(
    State(pool): State<SqlitePool>,
    Json(request): Json<SyncRequest>,
) -> AppResult<Json<SyncResponse>> {
    let start = Instant::now();
    let incoming_tabs_count = request.tabs.len();

    tracing::debug!(tabs_count = incoming_tabs_count, "Starting sync operation");

    let mut tx = pool
        .begin()
        .await
        .map_err(|e| tanaka_server::error::AppError::database("Failed to begin transaction", e))?;

    for tab in request.tabs {
        query(UPSERT_TAB_SQL)
            .bind(&tab.id)
            .bind(&tab.window_id)
            .bind(&tab.data)
            .bind(tab.updated_at)
            .execute(&mut *tx)
            .await
            .map_err(|e| {
                tanaka_server::error::AppError::database(
                    format!("Failed to upsert tab {}", tab.id),
                    e,
                )
            })?;
    }

    tx.commit()
        .await
        .map_err(|e| tanaka_server::error::AppError::database("Failed to commit transaction", e))?;

    let rows = query(SELECT_ALL_TABS_SQL)
        .fetch_all(&pool)
        .await
        .map_err(|e| tanaka_server::error::AppError::database("Failed to fetch tabs", e))?;

    let tabs: Vec<Tab> = rows
        .into_iter()
        .map(|row| Tab {
            id: row.get("id"),
            window_id: row.get("window_id"),
            data: row.get("data"),
            updated_at: row.get("updated_at"),
        })
        .collect();

    let total_tabs_count = tabs.len();
    let duration_ms = start.elapsed().as_millis();

    tracing::info!(
        incoming_tabs = incoming_tabs_count,
        total_tabs = total_tabs_count,
        duration_ms = duration_ms,
        "Sync completed successfully"
    );

    Ok(Json(SyncResponse { tabs }))
}
