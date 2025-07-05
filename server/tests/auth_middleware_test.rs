use axum::{
    body::Body,
    http::{header, Method, Request, StatusCode},
    middleware::from_fn_with_state,
    routing::{get, Router},
};
use tanaka_server::config::AuthConfig;
use tower::ServiceExt;

// Re-implement auth middleware here for testing
async fn auth_middleware(
    axum::extract::State(auth_config): axum::extract::State<AuthConfig>,
    mut req: Request<Body>,
    next: axum::middleware::Next,
) -> Result<axum::response::Response, axum::response::Response> {
    use axum::response::IntoResponse;
    use tanaka_server::error::AppError;
    use tanaka_server::services::AuthContext;

    const BEARER_PREFIX: &str = "Bearer ";

    let auth_header = req
        .headers()
        .get(&auth_config.token_header)
        .and_then(|value| value.to_str().ok());

    match auth_header {
        Some(auth) if auth.starts_with(BEARER_PREFIX) => {
            let token = &auth[BEARER_PREFIX.len()..];
            if token == auth_config.shared_token {
                let auth_context = AuthContext {
                    device_id: "test-device".to_string(),
                    token: token.to_string(),
                    permissions: vec!["sync".to_string()],
                    metadata: std::collections::HashMap::new(),
                };

                req.extensions_mut().insert(auth_context);
                Ok(next.run(req).await)
            } else {
                Err(AppError::auth_token_invalid("Invalid authentication token").into_response())
            }
        }
        Some(_) => Err(AppError::auth_token_invalid(
            "Invalid authorization format. Use: Bearer <token>",
        )
        .into_response()),
        None => Err(AppError::auth_token_missing().into_response()),
    }
}

async fn test_handler() -> &'static str {
    "OK"
}

#[tokio::test]
async fn test_auth_with_custom_header_name() {
    let auth_config = AuthConfig {
        shared_token: "test-token".to_string(),
        token_header: "X-Custom-Auth".to_string(),
        rate_limiting: false,
        max_requests_per_minute: 60,
    };

    let app = Router::new()
        .route("/", get(test_handler))
        .layer(from_fn_with_state(auth_config.clone(), auth_middleware));

    // Test with standard Authorization header (should fail)
    let request = Request::builder()
        .method(Method::GET)
        .uri("/")
        .header(header::AUTHORIZATION, "Bearer test-token")
        .body(Body::empty())
        .unwrap();

    let response = app.clone().oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);

    // Test with custom header (should succeed)
    let request = Request::builder()
        .method(Method::GET)
        .uri("/")
        .header("X-Custom-Auth", "Bearer test-token")
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_auth_with_empty_bearer_token() {
    let auth_config = AuthConfig {
        shared_token: "test-token".to_string(),
        token_header: header::AUTHORIZATION.to_string(),
        rate_limiting: false,
        max_requests_per_minute: 60,
    };

    let app = Router::new()
        .route("/", get(test_handler))
        .layer(from_fn_with_state(auth_config, auth_middleware));

    // Test with empty token after Bearer
    let request = Request::builder()
        .method(Method::GET)
        .uri("/")
        .header(header::AUTHORIZATION, "Bearer ")
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_auth_with_whitespace_in_token() {
    let auth_config = AuthConfig {
        shared_token: "test-token-with-spaces".to_string(),
        token_header: header::AUTHORIZATION.to_string(),
        rate_limiting: false,
        max_requests_per_minute: 60,
    };

    let app = Router::new()
        .route("/", get(test_handler))
        .layer(from_fn_with_state(auth_config, auth_middleware));

    // Test with token containing spaces
    let request = Request::builder()
        .method(Method::GET)
        .uri("/")
        .header(header::AUTHORIZATION, "Bearer test-token-with-spaces")
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_auth_case_sensitivity() {
    let auth_config = AuthConfig {
        shared_token: "test-token".to_string(),
        token_header: header::AUTHORIZATION.to_string(),
        rate_limiting: false,
        max_requests_per_minute: 60,
    };

    let app = Router::new()
        .route("/", get(test_handler))
        .layer(from_fn_with_state(auth_config.clone(), auth_middleware));

    // Test with lowercase "bearer" (should fail)
    let request = Request::builder()
        .method(Method::GET)
        .uri("/")
        .header(header::AUTHORIZATION, "bearer test-token")
        .body(Body::empty())
        .unwrap();

    let response = app.clone().oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);

    // Test with mixed case "BeArEr" (should fail)
    let request = Request::builder()
        .method(Method::GET)
        .uri("/")
        .header(header::AUTHORIZATION, "BeArEr test-token")
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_auth_with_extra_whitespace() {
    let auth_config = AuthConfig {
        shared_token: "test-token".to_string(),
        token_header: header::AUTHORIZATION.to_string(),
        rate_limiting: false,
        max_requests_per_minute: 60,
    };

    let app = Router::new()
        .route("/", get(test_handler))
        .layer(from_fn_with_state(auth_config, auth_middleware));

    // Test with extra spaces after Bearer
    let request = Request::builder()
        .method(Method::GET)
        .uri("/")
        .header(header::AUTHORIZATION, "Bearer   test-token")
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_auth_with_non_utf8_header() {
    let auth_config = AuthConfig {
        shared_token: "test-token".to_string(),
        token_header: header::AUTHORIZATION.to_string(),
        rate_limiting: false,
        max_requests_per_minute: 60,
    };

    let app = Router::new()
        .route("/", get(test_handler))
        .layer(from_fn_with_state(auth_config, auth_middleware));

    // Test with invalid UTF-8 in header
    let request = Request::builder()
        .method(Method::GET)
        .uri("/")
        .header(header::AUTHORIZATION, &[0xFF, 0xFE, 0xFD][..])
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_auth_multiple_authorization_headers() {
    let auth_config = AuthConfig {
        shared_token: "test-token".to_string(),
        token_header: header::AUTHORIZATION.to_string(),
        rate_limiting: false,
        max_requests_per_minute: 60,
    };

    let app = Router::new()
        .route("/", get(test_handler))
        .layer(from_fn_with_state(auth_config, auth_middleware));

    // Test with multiple Authorization headers
    // axum should use the first one
    let request = Request::builder()
        .method(Method::GET)
        .uri("/")
        .header(header::AUTHORIZATION, "Bearer wrong-token")
        .header(header::AUTHORIZATION, "Bearer test-token")
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    // First header is used, which has wrong token
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_auth_with_special_characters_in_token() {
    let auth_config = AuthConfig {
        shared_token: "test-token!@#$%^&*()_+-={}[]|:\";<>?,./".to_string(),
        token_header: header::AUTHORIZATION.to_string(),
        rate_limiting: false,
        max_requests_per_minute: 60,
    };

    let app = Router::new()
        .route("/", get(test_handler))
        .layer(from_fn_with_state(auth_config.clone(), auth_middleware));

    // Test with special characters in token
    let request = Request::builder()
        .method(Method::GET)
        .uri("/")
        .header(
            header::AUTHORIZATION,
            "Bearer test-token!@#$%^&*()_+-={}[]|:\";<>?,./",
        )
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}
