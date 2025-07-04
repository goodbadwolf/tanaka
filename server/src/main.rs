use axum::http::{HeaderValue, Method};
use axum::{
    middleware,
    routing::{get, post},
    Json, Router,
};
use clap::Parser;
use serde::Serialize;
use std::sync::Arc;
use tanaka_server::config::{Args, Config};
use tanaka_server::crdt::CrdtManager;
use tanaka_server::error::AppResult;
use tanaka_server::repository::Repositories;
use tanaka_server::startup::{parse_bind_address, ServerBootstrap};
use tanaka_server::sync;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, Layer};

mod auth;
mod db;

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    version: String,
}

#[tokio::main]
async fn main() -> AppResult<()> {
    let args = Args::parse();
    let config = Config::load(&args)?;
    init_logging(&config);

    tracing::info!("Starting Tanaka server v{}", env!("CARGO_PKG_VERSION"));
    tracing::debug!("Configuration loaded: {:?}", config);

    let db_pool = db::init_db_with_config(&config.database).await?;
    tracing::info!("Database initialized");

    let repositories = Repositories::new_sqlite(db_pool.clone());
    tracing::info!("Repositories initialized");

    let bootstrap = ServerBootstrap::new(&config.server.bind_addr);

    let crdt_manager = bootstrap
        .initialize_crdt_manager(&*repositories.operations)
        .await?;

    tracing::info!(
        "CRDT manager initialized with node ID: {} and clock: {}",
        bootstrap.node_id(),
        crdt_manager.current_clock()
    );

    let app = create_app(&db_pool, &crdt_manager, &config);
    let addr = parse_bind_address(&config.server.bind_addr)?;

    tracing::info!("Starting server on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

fn init_logging(config: &Config) {
    let filter = tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
        format!(
            "tanaka_server={},tower_http={}",
            config.logging.level, config.logging.level
        )
        .into()
    });

    let fmt_layer = match config.logging.format.as_str() {
        "json" => tracing_subscriber::fmt::layer().json().boxed(),
        "compact" => tracing_subscriber::fmt::layer().compact().boxed(),
        _ => tracing_subscriber::fmt::layer().pretty().boxed(),
    };

    tracing_subscriber::registry()
        .with(filter)
        .with(fmt_layer)
        .init();
}

fn create_app(
    db_pool: &sqlx::SqlitePool,
    crdt_manager: &Arc<CrdtManager>,
    config: &Config,
) -> Router {
    let auth_middleware_layer =
        middleware::from_fn_with_state(config.auth.clone(), auth::auth_middleware);

    let mut app = Router::new().route("/health", get(health)).route(
        "/sync",
        post(sync::sync_handler)
            .with_state((crdt_manager.clone(), db_pool.clone()))
            .route_layer(auth_middleware_layer),
    );

    app = app.layer(create_cors_layer(&config.server.cors));

    if config.logging.request_logging {
        app = app.layer(TraceLayer::new_for_http());
    }

    app
}

fn create_cors_layer(cors_config: &tanaka_server::config::CorsConfig) -> CorsLayer {
    let mut cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([
            axum::http::header::AUTHORIZATION,
            axum::http::header::CONTENT_TYPE,
            axum::http::header::ACCEPT,
        ])
        .max_age(std::time::Duration::from_secs(cors_config.max_age_secs));

    if cors_config.allowed_origins.is_empty() {
        tracing::warn!("No CORS origins configured - denying all cross-origin requests");
        return cors; // Return restrictive CORS that allows no origins
    }

    for origin in &cors_config.allowed_origins {
        if origin == "*" {
            tracing::warn!("Wildcard CORS origin detected - this may be a security risk");
            cors = cors.allow_origin(tower_http::cors::Any);
            break;
        } else if origin == "moz-extension://*" {
            // Special handling for Firefox extension origins
            use tower_http::cors::AllowOrigin;
            cors = cors.allow_origin(AllowOrigin::predicate(
                |origin: &HeaderValue, _: &axum::http::request::Parts| {
                    origin
                        .to_str()
                        .map(|s| s.starts_with("moz-extension://"))
                        .unwrap_or(false)
                },
            ));
        } else if let Ok(header_value) = origin.parse::<HeaderValue>() {
            cors = cors.allow_origin(header_value);
        } else {
            tracing::error!("Invalid CORS origin: {}", origin);
        }
    }

    cors
}

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use tanaka_server::sync::{CrdtOperation, TabData};
    use tower::ServiceExt;

    #[test]
    fn test_init_logging() {
        // Test that init_logging doesn't panic with various configs
        let mut config = Config::default();

        config.logging.format = "json".to_string();
        // Note: Can't actually init multiple times, so just verify it compiles

        config.logging.format = "compact".to_string();
        config.logging.format = "pretty".to_string();
    }

    #[tokio::test]
    async fn test_app_creation() {
        use axum::http::StatusCode;
        use sqlx::sqlite::SqlitePoolOptions;

        // Create in-memory database
        let db_pool = SqlitePoolOptions::new()
            .connect("sqlite::memory:")
            .await
            .unwrap();

        // Initialize schema
        tanaka_server::setup_database(&tanaka_server::config::DatabaseConfig {
            url: "sqlite::memory:".to_string(),
            max_connections: 5,
            connection_timeout_secs: 30,
        })
        .await
        .unwrap();

        let crdt_manager = Arc::new(CrdtManager::new(1));
        let config = Config::default();

        let app = create_app(&db_pool, &crdt_manager, &config);

        // Test that health endpoint works

        let response = app
            .oneshot(
                axum::http::Request::builder()
                    .uri("/health")
                    .body(axum::body::Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn test_full_startup_sequence() {
        use tanaka_server::repository::Repositories;

        // This test verifies the entire startup sequence works
        let mut config = Config::default();

        // Use in-memory database for testing
        config.database.url = "sqlite::memory:".to_string();

        // Create in-memory database
        let db_pool = sqlx::SqlitePool::connect(&config.database.url)
            .await
            .unwrap();

        // Initialize schema
        tanaka_server::setup_database(&config.database)
            .await
            .unwrap();

        let repositories = Repositories::new_mock(); // Use mock for testing

        // Store some test data
        let op = CrdtOperation::UpsertTab {
            id: "test".to_string(),
            data: TabData {
                window_id: "window1".to_string(),
                url: "https://test.com".to_string(),
                title: "Test".to_string(),
                active: true,
                index: 0,
                updated_at: 1,
            },
        };
        repositories
            .operations
            .store(&op, 1, "device1")
            .await
            .unwrap();

        // Test bootstrap
        let bootstrap = ServerBootstrap::new(&config.server.bind_addr);
        let crdt_manager = bootstrap
            .initialize_crdt_manager(&*repositories.operations)
            .await
            .unwrap();

        // Verify state was restored
        assert_eq!(crdt_manager.current_clock(), 2); // max_clock + 1
        assert_eq!(crdt_manager.node_id(), bootstrap.node_id());

        // Verify we can create the app
        let _app = create_app(&db_pool, &crdt_manager, &config);
        // App creation itself is the test - if it doesn't panic, it works
    }

    #[test]
    fn test_cors_layer_creation() {
        use tanaka_server::config::CorsConfig;

        // Test default configuration
        let cors_config = CorsConfig {
            allowed_origins: vec!["moz-extension://*".to_string()],
            max_age_secs: 3600,
        };
        let _cors_layer = create_cors_layer(&cors_config);

        // Test with specific origins
        let cors_config = CorsConfig {
            allowed_origins: vec![
                "https://example.com".to_string(),
                "https://app.example.com".to_string(),
            ],
            max_age_secs: 1800,
        };
        let _cors_layer = create_cors_layer(&cors_config);

        // Test with wildcard (should log warning)
        let cors_config = CorsConfig {
            allowed_origins: vec!["*".to_string()],
            max_age_secs: 3600,
        };
        let _cors_layer = create_cors_layer(&cors_config);

        // Test with empty origins (should be restrictive)
        let cors_config = CorsConfig {
            allowed_origins: vec![],
            max_age_secs: 3600,
        };
        let _cors_layer = create_cors_layer(&cors_config);
    }

    #[tokio::test]
    async fn test_cors_integration() {
        use axum::http::StatusCode;
        use sqlx::sqlite::SqlitePoolOptions;

        let db_pool = SqlitePoolOptions::new()
            .connect("sqlite::memory:")
            .await
            .unwrap();

        tanaka_server::setup_database(&tanaka_server::config::DatabaseConfig {
            url: "sqlite::memory:".to_string(),
            max_connections: 5,
            connection_timeout_secs: 30,
        })
        .await
        .unwrap();

        let crdt_manager = Arc::new(CrdtManager::new(1));
        let mut config = Config::default();
        config.auth.shared_token = "test-token".to_string();

        // Test with secure CORS configuration
        config.server.cors.allowed_origins = vec!["moz-extension://*".to_string()];

        let app = create_app(&db_pool, &crdt_manager, &config);

        // Test health endpoint works with CORS
        let response = app
            .oneshot(
                axum::http::Request::builder()
                    .uri("/health")
                    .body(axum::body::Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
    }
}
