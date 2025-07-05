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

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{body::Body, http::Method, routing::Router};
    use tower::ServiceExt;

    async fn dummy_handler() -> StatusCode {
        StatusCode::OK
    }

    #[tokio::test]
    async fn test_get_request_passes_through() {
        let app = Router::new()
            .route("/", axum::routing::get(dummy_handler))
            .layer(axum::middleware::from_fn(validate_content_type));

        let request = Request::builder()
            .method(Method::GET)
            .uri("/")
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn test_delete_request_passes_through() {
        let app = Router::new()
            .route("/", axum::routing::delete(dummy_handler))
            .layer(axum::middleware::from_fn(validate_content_type));

        let request = Request::builder()
            .method(Method::DELETE)
            .uri("/")
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn test_post_with_valid_content_type() {
        let app = Router::new()
            .route("/", axum::routing::post(dummy_handler))
            .layer(axum::middleware::from_fn(validate_content_type));

        let request = Request::builder()
            .method(Method::POST)
            .uri("/")
            .header(header::CONTENT_TYPE, "application/json")
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn test_post_with_content_type_and_charset() {
        let app = Router::new()
            .route("/", axum::routing::post(dummy_handler))
            .layer(axum::middleware::from_fn(validate_content_type));

        let request = Request::builder()
            .method(Method::POST)
            .uri("/")
            .header(header::CONTENT_TYPE, "application/json; charset=utf-8")
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn test_post_with_invalid_content_type() {
        let app = Router::new()
            .route("/", axum::routing::post(dummy_handler))
            .layer(axum::middleware::from_fn(validate_content_type));

        let request = Request::builder()
            .method(Method::POST)
            .uri("/")
            .header(header::CONTENT_TYPE, "text/plain")
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::UNSUPPORTED_MEDIA_TYPE);
    }

    #[tokio::test]
    async fn test_post_with_invalid_utf8_content_type() {
        let app = Router::new()
            .route("/", axum::routing::post(dummy_handler))
            .layer(axum::middleware::from_fn(validate_content_type));

        let request = Request::builder()
            .method(Method::POST)
            .uri("/")
            .header(header::CONTENT_TYPE, &[0xFF, 0xFE, 0xFD][..]) // Invalid UTF-8
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::UNSUPPORTED_MEDIA_TYPE);
    }

    #[tokio::test]
    async fn test_put_with_missing_content_type() {
        let app = Router::new()
            .route("/", axum::routing::put(dummy_handler))
            .layer(axum::middleware::from_fn(validate_content_type));

        let request = Request::builder()
            .method(Method::PUT)
            .uri("/")
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::UNSUPPORTED_MEDIA_TYPE);
    }

    #[tokio::test]
    async fn test_patch_with_valid_content_type() {
        let app = Router::new()
            .route("/", axum::routing::patch(dummy_handler))
            .layer(axum::middleware::from_fn(validate_content_type));

        let request = Request::builder()
            .method(Method::PATCH)
            .uri("/")
            .header(header::CONTENT_TYPE, "application/json")
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }
}
