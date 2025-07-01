use axum::{extract::State, Json};
use sqlx::{query, Row, SqlitePool};
use tanaka_server::error::AppResult;
use tanaka_server::models::{SyncRequest, SyncResponse, Tab};

pub async fn sync_handler(
    State(pool): State<SqlitePool>,
    Json(request): Json<SyncRequest>,
) -> AppResult<Json<SyncResponse>> {
    // Store incoming tabs
    for tab in request.tabs {
        query(
            r"
            INSERT INTO tabs (id, window_id, data, updated_at)
            VALUES (?1, ?2, ?3, ?4)
            ON CONFLICT(id) DO UPDATE SET
                window_id = excluded.window_id,
                data = excluded.data,
                updated_at = excluded.updated_at
            ",
        )
        .bind(&tab.id)
        .bind(&tab.window_id)
        .bind(&tab.data)
        .bind(tab.updated_at)
        .execute(&pool)
        .await
        .map_err(|e| {
            tanaka_server::error::AppError::database(format!("Failed to upsert tab {}", tab.id), e)
        })?;
    }

    // Fetch all tabs
    let rows = query(
        r"
        SELECT id, window_id, data, updated_at
        FROM tabs
        ORDER BY updated_at DESC
        ",
    )
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

    Ok(Json(SyncResponse { tabs }))
}
