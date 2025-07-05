use axum::{
    extract::Request,
    http::{header, StatusCode},
    middleware::Next,
    response::Response,
};

/// Middleware to validate Content-Type header for JSON endpoints
pub async fn validate_content_type(request: Request, next: Next) -> Result<Response, StatusCode> {
    // Only check POST/PUT/PATCH requests
    if matches!(
        request.method(),
        &axum::http::Method::POST | &axum::http::Method::PUT | &axum::http::Method::PATCH
    ) {
        if let Some(content_type) = request.headers().get(header::CONTENT_TYPE) {
            if let Ok(content_type_str) = content_type.to_str() {
                // Accept application/json with optional charset
                if !content_type_str.starts_with("application/json") {
                    return Err(StatusCode::UNSUPPORTED_MEDIA_TYPE);
                }
            } else {
                return Err(StatusCode::UNSUPPORTED_MEDIA_TYPE);
            }
        } else {
            // Content-Type header is missing
            return Err(StatusCode::UNSUPPORTED_MEDIA_TYPE);
        }
    }

    Ok(next.run(request).await)
}
