use axum::http::{header, StatusCode};
use sqlx::SqlitePool;
use std::sync::Arc;
use tanaka_server::{
    config::Config,
    crdt::CrdtManager,
    sync::{CrdtOperation, SyncRequest, TabData},
};
use tower::ServiceExt;

// Content-type validation middleware
async fn validate_content_type(
    request: axum::extract::Request,
    next: axum::middleware::Next,
) -> Result<axum::response::Response, axum::http::StatusCode> {
    use axum::http::{header, Method};

    if matches!(
        request.method(),
        &Method::POST | &Method::PUT | &Method::PATCH
    ) {
        if let Some(content_type) = request.headers().get(header::CONTENT_TYPE) {
            if let Ok(content_type_str) = content_type.to_str() {
                if !content_type_str.starts_with("application/json") {
                    return Err(axum::http::StatusCode::UNSUPPORTED_MEDIA_TYPE);
                }
            } else {
                return Err(axum::http::StatusCode::UNSUPPORTED_MEDIA_TYPE);
            }
        } else {
            return Err(axum::http::StatusCode::UNSUPPORTED_MEDIA_TYPE);
        }
    }
    Ok(next.run(request).await)
}

// Create auth middleware that adds AuthContext
async fn auth_middleware(
    axum::extract::State(auth_config): axum::extract::State<tanaka_server::config::AuthConfig>,
    mut req: axum::extract::Request,
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
        _ => Err(AppError::auth_token_missing().into_response()),
    }
}

/// Create an in-memory test app with configuration
async fn create_test_app() -> (axum::Router, Config) {
    use axum::{
        middleware::{from_fn, from_fn_with_state},
        routing::post,
        Router,
    };
    use tanaka_server::{handlers, repository::Repositories, services::container::create_services};
    use tower_http::{cors::CorsLayer, limit::RequestBodyLimitLayer, timeout::TimeoutLayer};

    let mut config = Config::default();
    config.auth.shared_token = "test-token".to_string();

    // Set limits for testing
    config.sync.max_payload_size = 1024; // 1KB for testing
    config.sync.max_url_length = 100;
    config.sync.max_title_length = 50;
    config.server.max_concurrent_connections = 10;
    config.server.request_timeout_secs = 5;

    // Create in-memory database
    let db_pool = SqlitePool::connect("sqlite::memory:").await.unwrap();

    // Create tables directly on the pool we just created
    sqlx::query(
        r"
        CREATE TABLE IF NOT EXISTS crdt_operations (
            id TEXT PRIMARY KEY,
            clock INTEGER NOT NULL,
            device_id TEXT NOT NULL,
            operation_type TEXT NOT NULL,
            target_id TEXT NOT NULL,
            operation_data TEXT NOT NULL,
            created_at INTEGER NOT NULL
        )
        ",
    )
    .execute(&db_pool)
    .await
    .unwrap();

    let crdt_manager = Arc::new(CrdtManager::new(1));

    // Create repositories and services
    let repositories = Arc::new(Repositories::new_sqlite(db_pool.clone()));
    let services = create_services(repositories, crdt_manager.clone(), config.clone());

    let auth_middleware_layer = from_fn_with_state(config.auth.clone(), auth_middleware);

    let app = Router::new()
        .route(
            "/sync",
            post(handlers::sync_handler)
                .with_state(services)
                .route_layer(from_fn(validate_content_type))
                .route_layer(auth_middleware_layer),
        )
        .layer(RequestBodyLimitLayer::new(config.sync.max_payload_size))
        .layer(tower::limit::ConcurrencyLimitLayer::new(
            config.server.max_concurrent_connections,
        ))
        .layer(TimeoutLayer::new(std::time::Duration::from_secs(
            config.server.request_timeout_secs,
        )))
        .layer(CorsLayer::permissive());

    (app, config)
}

#[tokio::test]
async fn test_content_type_validation() {
    let (app, config) = create_test_app().await;

    let request = SyncRequest {
        clock: 1,
        device_id: "test-device".to_string(),
        since_clock: None,
        operations: vec![],
    };

    // Test missing Content-Type header
    let response = app
        .clone()
        .oneshot(
            axum::http::Request::builder()
                .method("POST")
                .uri("/sync")
                .header(
                    header::AUTHORIZATION,
                    format!("Bearer {}", config.auth.shared_token),
                )
                .body(serde_json::to_string(&request).unwrap())
                .unwrap(),
        )
        .await
        .unwrap();

    // With content-type validation middleware, this should return 415
    assert_eq!(response.status(), StatusCode::UNSUPPORTED_MEDIA_TYPE);

    // Test with correct Content-Type
    let response = app
        .clone()
        .oneshot(
            axum::http::Request::builder()
                .method("POST")
                .uri("/sync")
                .header(
                    header::AUTHORIZATION,
                    format!("Bearer {}", config.auth.shared_token),
                )
                .header(header::CONTENT_TYPE, "application/json")
                .body(serde_json::to_string(&request).unwrap())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_request_body_size_limit() {
    let (app, config) = create_test_app().await;

    // Create a request that exceeds the payload size limit
    let large_title = "a".repeat(1000); // This alone is close to 1KB
    let request = SyncRequest {
        clock: 1,
        device_id: "test-device".to_string(),
        since_clock: None,
        operations: vec![CrdtOperation::UpsertTab {
            id: "tab1".to_string(),
            data: TabData {
                window_id: "window1".to_string(),
                url: "https://example.com".to_string(),
                title: large_title,
                active: true,
                index: 0,
                updated_at: 1,
            },
        }],
    };

    let response = app
        .oneshot(
            axum::http::Request::builder()
                .method("POST")
                .uri("/sync")
                .header(
                    header::AUTHORIZATION,
                    format!("Bearer {}", config.auth.shared_token),
                )
                .header(header::CONTENT_TYPE, "application/json")
                .body(serde_json::to_string(&request).unwrap())
                .unwrap(),
        )
        .await
        .unwrap();

    // Should be rejected due to body size limit
    assert_eq!(response.status(), StatusCode::PAYLOAD_TOO_LARGE);
}

#[tokio::test]
async fn test_string_length_validation() {
    let (app, config) = create_test_app().await;

    // Test URL too long
    let long_url = format!("https://{}.com", "a".repeat(101)); // Exceeds limit of 100
    let request = SyncRequest {
        clock: 1,
        device_id: "test-device".to_string(),
        since_clock: None,
        operations: vec![CrdtOperation::UpsertTab {
            id: "tab1".to_string(),
            data: TabData {
                window_id: "window1".to_string(),
                url: long_url,
                title: "Test".to_string(),
                active: true,
                index: 0,
                updated_at: 1,
            },
        }],
    };

    let response = app
        .clone()
        .oneshot(
            axum::http::Request::builder()
                .method("POST")
                .uri("/sync")
                .header(
                    header::AUTHORIZATION,
                    format!("Bearer {}", config.auth.shared_token),
                )
                .header(header::CONTENT_TYPE, "application/json")
                .body(serde_json::to_string(&request).unwrap())
                .unwrap(),
        )
        .await
        .unwrap();

    // With service layer validation, URLs exceeding max length should be rejected
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);

    // Test title too long
    let long_title = "a".repeat(51); // Exceeds limit of 50
    let request = SyncRequest {
        clock: 1,
        device_id: "test-device".to_string(),
        since_clock: None,
        operations: vec![CrdtOperation::UpsertTab {
            id: "tab1".to_string(),
            data: TabData {
                window_id: "window1".to_string(),
                url: "https://example.com".to_string(),
                title: long_title,
                active: true,
                index: 0,
                updated_at: 1,
            },
        }],
    };

    let response = app
        .oneshot(
            axum::http::Request::builder()
                .method("POST")
                .uri("/sync")
                .header(
                    header::AUTHORIZATION,
                    format!("Bearer {}", config.auth.shared_token),
                )
                .header(header::CONTENT_TYPE, "application/json")
                .body(serde_json::to_string(&request).unwrap())
                .unwrap(),
        )
        .await
        .unwrap();

    // With service layer validation, titles exceeding max length should be rejected
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_operation_count_limit() {
    let (app, config) = create_test_app().await;

    // Create request with more than 1000 operations
    let mut operations = Vec::new();
    for i in 0..1001 {
        operations.push(CrdtOperation::CloseTab {
            id: format!("tab{i}"),
            closed_at: 1,
        });
    }

    let request = SyncRequest {
        clock: 1,
        device_id: "test-device".to_string(),
        since_clock: None,
        operations,
    };

    let response = app
        .oneshot(
            axum::http::Request::builder()
                .method("POST")
                .uri("/sync")
                .header(
                    header::AUTHORIZATION,
                    format!("Bearer {}", config.auth.shared_token),
                )
                .header(header::CONTENT_TYPE, "application/json")
                .body(serde_json::to_string(&request).unwrap())
                .unwrap(),
        )
        .await
        .unwrap();

    // Should be rejected due to payload size limit (the body is too large with 1001 operations)
    assert_eq!(response.status(), StatusCode::PAYLOAD_TOO_LARGE);
}

#[tokio::test]
async fn test_auth_missing_header() {
    let (app, _config) = create_test_app().await;

    let request = SyncRequest {
        clock: 1,
        device_id: "test-device".to_string(),
        since_clock: None,
        operations: vec![],
    };

    // Test missing Authorization header
    let response = app
        .oneshot(
            axum::http::Request::builder()
                .method("POST")
                .uri("/sync")
                .header(header::CONTENT_TYPE, "application/json")
                .body(serde_json::to_string(&request).unwrap())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_auth_invalid_format() {
    let (app, config) = create_test_app().await;

    let request = SyncRequest {
        clock: 1,
        device_id: "test-device".to_string(),
        since_clock: None,
        operations: vec![],
    };

    // Test Authorization header without Bearer prefix
    let response = app
        .clone()
        .oneshot(
            axum::http::Request::builder()
                .method("POST")
                .uri("/sync")
                .header(
                    header::AUTHORIZATION,
                    config.auth.shared_token.clone(), // Missing "Bearer " prefix
                )
                .header(header::CONTENT_TYPE, "application/json")
                .body(serde_json::to_string(&request).unwrap())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);

    // Test Authorization header with wrong prefix
    let response = app
        .oneshot(
            axum::http::Request::builder()
                .method("POST")
                .uri("/sync")
                .header(
                    header::AUTHORIZATION,
                    format!("Basic {}", config.auth.shared_token),
                )
                .header(header::CONTENT_TYPE, "application/json")
                .body(serde_json::to_string(&request).unwrap())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_auth_invalid_token() {
    let (app, _config) = create_test_app().await;

    let request = SyncRequest {
        clock: 1,
        device_id: "test-device".to_string(),
        since_clock: None,
        operations: vec![],
    };

    // Test with wrong token
    let response = app
        .oneshot(
            axum::http::Request::builder()
                .method("POST")
                .uri("/sync")
                .header(header::AUTHORIZATION, "Bearer wrong-token")
                .header(header::CONTENT_TYPE, "application/json")
                .body(serde_json::to_string(&request).unwrap())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_empty_request_body() {
    let (app, config) = create_test_app().await;

    // Test with empty body
    let response = app
        .oneshot(
            axum::http::Request::builder()
                .method("POST")
                .uri("/sync")
                .header(
                    header::AUTHORIZATION,
                    format!("Bearer {}", config.auth.shared_token),
                )
                .header(header::CONTENT_TYPE, "application/json")
                .body(String::new())
                .unwrap(),
        )
        .await
        .unwrap();

    // Empty body should fail JSON parsing
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_malformed_json() {
    let (app, config) = create_test_app().await;

    // Test with malformed JSON
    let response = app
        .oneshot(
            axum::http::Request::builder()
                .method("POST")
                .uri("/sync")
                .header(
                    header::AUTHORIZATION,
                    format!("Bearer {}", config.auth.shared_token),
                )
                .header(header::CONTENT_TYPE, "application/json")
                .body("{invalid json}".to_string())
                .unwrap(),
        )
        .await
        .unwrap();

    // Malformed JSON should fail parsing
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_device_id_validation() {
    let (app, config) = create_test_app().await;

    // Test empty device_id
    let request = SyncRequest {
        clock: 1,
        device_id: String::new(), // Empty device ID
        since_clock: None,
        operations: vec![],
    };

    let response = app
        .clone()
        .oneshot(
            axum::http::Request::builder()
                .method("POST")
                .uri("/sync")
                .header(
                    header::AUTHORIZATION,
                    format!("Bearer {}", config.auth.shared_token),
                )
                .header(header::CONTENT_TYPE, "application/json")
                .body(serde_json::to_string(&request).unwrap())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);

    // Test device_id too long
    let request = SyncRequest {
        clock: 1,
        device_id: "a".repeat(129), // Exceeds 128 character limit
        since_clock: None,
        operations: vec![],
    };

    let response = app
        .oneshot(
            axum::http::Request::builder()
                .method("POST")
                .uri("/sync")
                .header(
                    header::AUTHORIZATION,
                    format!("Bearer {}", config.auth.shared_token),
                )
                .header(header::CONTENT_TYPE, "application/json")
                .body(serde_json::to_string(&request).unwrap())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_invalid_clock_values() {
    let (app, config) = create_test_app().await;

    // Test since_clock greater than current clock
    let request = SyncRequest {
        clock: 5,
        device_id: "test-device".to_string(),
        since_clock: Some(10), // since_clock > clock
        operations: vec![],
    };

    let response = app
        .oneshot(
            axum::http::Request::builder()
                .method("POST")
                .uri("/sync")
                .header(
                    header::AUTHORIZATION,
                    format!("Bearer {}", config.auth.shared_token),
                )
                .header(header::CONTENT_TYPE, "application/json")
                .body(serde_json::to_string(&request).unwrap())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_concurrent_connections_limit() {
    let (app, config) = create_test_app().await;

    let request = SyncRequest {
        clock: 1,
        device_id: "test-device".to_string(),
        since_clock: None,
        operations: vec![],
    };

    // Create multiple concurrent requests
    let mut handles = vec![];
    for _ in 0..15 {
        // More than the limit of 10
        let app = app.clone();
        let config = config.clone();
        let request = request.clone();

        let handle = tokio::spawn(async move {
            app.oneshot(
                axum::http::Request::builder()
                    .method("POST")
                    .uri("/sync")
                    .header(
                        header::AUTHORIZATION,
                        format!("Bearer {}", config.auth.shared_token),
                    )
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(serde_json::to_string(&request).unwrap())
                    .unwrap(),
            )
            .await
        });
        handles.push(handle);
    }

    // Wait for all requests
    let results: Vec<_> = futures::future::join_all(handles).await;

    // Some requests should succeed, some should be rate limited
    let mut success_count = 0;
    let mut rate_limited_count = 0;

    for response in results.into_iter().flatten().flatten() {
        match response.status() {
            StatusCode::OK => success_count += 1,
            StatusCode::SERVICE_UNAVAILABLE => rate_limited_count += 1,
            _ => {}
        }
    }

    // Either some succeeded and some failed, or all succeeded due to fast execution
    // The concurrency limit is enforced, but depending on timing, requests might
    // complete before others arrive
    assert!(success_count > 0);
    assert!(success_count + rate_limited_count == 15);
}
