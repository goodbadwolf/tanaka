use crate::error::AppResult;
use crate::services::container::ServiceContainer;
use crate::services::AuthContext;
use crate::sync::{SyncRequest, SyncResponse};
use axum::{
    extract::{Extension, State},
    Json,
};
use std::sync::Arc;

/// HTTP handler for sync endpoint that uses the service layer
///
/// # Errors
///
/// Returns `AppError` if sync operation fails
pub async fn sync_handler(
    State(services): State<Arc<ServiceContainer>>,
    Extension(auth): Extension<AuthContext>,
    Json(request): Json<SyncRequest>,
) -> AppResult<Json<SyncResponse>> {
    let response = services.sync.sync(request, &auth).await?;
    Ok(Json(response))
}
