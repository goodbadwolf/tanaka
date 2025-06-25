# Server Development Roadmap (v1.0)

This document analyzes the current server state and outlines the architectural improvements needed to match the extension's quality standards for v1.0 release.

## Current Server State (v0.5.0)

The server is a **minimal MVP** with basic functionality but lacks architectural robustness:

### Current Structure

```
server/src/
├── main.rs      (47 lines) - Application bootstrap, route registration
├── models.rs    (25 lines) - Data transfer objects, TypeScript generation
├── db.rs        (34 lines) - Database initialization, connection pool
├── sync.rs      (55 lines) - Single sync endpoint handler
├── auth.rs      (23 lines) - Hardcoded bearer token middleware
└── lib.rs       (2 lines)  - Module exports
```

### Architecture Issues

1. **No Error Architecture**: String errors, no structured error handling
2. **No Repository Pattern**: Direct SQL in handlers
3. **No Service Layer**: Business logic mixed with HTTP handling
4. **No Configuration**: Hardcoded values (port, auth token, DB path)
5. **Zero Test Coverage**: No tests, fixtures, or test utilities
6. **No Observability**: No metrics, performance monitoring
7. **Poor Modularity**: Flat structure, tight coupling

## Missing Patterns vs Extension

| Pattern | Extension Implementation | Server Current | Server Needs |
|---------|-------------------------|----------------|--------------|
| **Error Handling** | `neverthrow` Result pattern with typed errors | `String` errors | Custom error types with `thiserror`, Result<T, E> |
| **Clean Architecture** | Repository/Service/Domain layers | Direct DB in handlers | Repository pattern, service layer |
| **Dependency Injection** | DI container with Symbol tokens | Hardcoded dependencies | Trait-based DI, `Arc<dyn Trait>` |
| **Configuration** | Environment-based settings | Hardcoded values | TOML config, environment variables |
| **Testing** | 86.8% coverage, comprehensive tests | Zero tests | Unit tests, integration tests, fixtures |
| **Performance** | Performance monitoring utilities | No monitoring | Metrics, tracing spans |
| **Validation** | Type guards, runtime validation | No validation | Input validation layer |
| **Modularity** | Feature-based organization | Flat structure | Domain modules (sync, auth, db) |

## Recommended Architecture (v1.0)

### Target Structure

```
server/src/
├── main.rs                     - Application bootstrap
├── config/
│   ├── mod.rs                  - Configuration management
│   └── settings.rs             - TOML config structures
├── domain/
│   ├── mod.rs                  - Domain models
│   ├── tab.rs                  - Tab domain model
│   └── sync.rs                 - Sync domain logic
├── repositories/
│   ├── mod.rs                  - Repository traits
│   ├── tab_repository.rs       - Tab data access
│   └── impl/
│       └── sqlite_tab_repo.rs  - SQLite implementation
├── services/
│   ├── mod.rs                  - Service traits
│   ├── sync_service.rs         - Sync business logic
│   └── auth_service.rs         - Authentication logic
├── handlers/
│   ├── mod.rs                  - HTTP handlers
│   ├── health.rs               - Health check endpoint
│   └── sync.rs                 - Sync endpoint
├── middleware/
│   ├── mod.rs                  - Middleware
│   ├── auth.rs                 - Authentication middleware
│   └── tracing.rs              - Request tracing
├── errors/
│   ├── mod.rs                  - Error types
│   └── app_error.rs            - Application errors
└── lib.rs                      - Library exports
```

## Implementation Patterns

### Error Handling with thiserror

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("Validation error: {field}: {message}")]
    Validation { field: String, message: String },
    #[error("Authentication failed")]
    Unauthorized,
    #[error("Resource not found: {0}")]
    NotFound(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AppError::Database(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error"),
            AppError::Validation { .. } => (StatusCode::BAD_REQUEST, &self.to_string()),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized"),
            AppError::NotFound(_) => (StatusCode::NOT_FOUND, &self.to_string()),
        };

        (status, Json(json!({ "error": error_message }))).into_response()
    }
}
```

### Repository Pattern with Traits

```rust
use async_trait::async_trait;

#[async_trait]
pub trait TabRepository: Send + Sync {
    async fn get_all(&self) -> Result<Vec<Tab>, AppError>;
    async fn get_by_window(&self, window_id: &str) -> Result<Vec<Tab>, AppError>;
    async fn upsert(&self, tab: &Tab) -> Result<(), AppError>;
    async fn delete(&self, id: &str) -> Result<(), AppError>;
}

pub struct SqliteTabRepository {
    pool: SqlitePool,
}

#[async_trait]
impl TabRepository for SqliteTabRepository {
    async fn get_all(&self) -> Result<Vec<Tab>, AppError> {
        let rows = sqlx::query_as::<_, Tab>(
            "SELECT id, window_id, data, updated_at FROM tabs ORDER BY updated_at DESC"
        )
        .fetch_all(&self.pool)
        .await?;
        Ok(rows)
    }

    async fn upsert(&self, tab: &Tab) -> Result<(), AppError> {
        sqlx::query!(
            r#"
            INSERT INTO tabs (id, window_id, data, updated_at)
            VALUES (?1, ?2, ?3, ?4)
            ON CONFLICT(id) DO UPDATE SET
                window_id = excluded.window_id,
                data = excluded.data,
                updated_at = excluded.updated_at
            "#,
            tab.id,
            tab.window_id,
            tab.data,
            tab.updated_at
        )
        .execute(&self.pool)
        .await?;
        Ok(())
    }
}
```

### Service Layer with Dependency Injection

```rust
pub struct SyncService {
    tab_repo: Arc<dyn TabRepository>,
    validator: Arc<dyn Validator>,
}

impl SyncService {
    pub fn new(
        tab_repo: Arc<dyn TabRepository>,
        validator: Arc<dyn Validator>,
    ) -> Self {
        Self { tab_repo, validator }
    }

    pub async fn sync_tabs(&self, request: SyncRequest) -> Result<SyncResponse, AppError> {
        // Validate request
        self.validator.validate_sync_request(&request)?;

        // Store incoming tabs
        for tab in &request.tabs {
            self.tab_repo.upsert(tab).await?;
        }

        // Fetch all tabs
        let tabs = self.tab_repo.get_all().await?;

        Ok(SyncResponse { tabs })
    }
}
```

### Configuration Management

```rust
use serde::Deserialize;

#[derive(Deserialize, Clone)]
pub struct Config {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub auth: AuthConfig,
}

#[derive(Deserialize, Clone)]
pub struct ServerConfig {
    pub bind_addr: String,
    pub port: u16,
}

#[derive(Deserialize, Clone)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
}

#[derive(Deserialize, Clone)]
pub struct AuthConfig {
    pub shared_token: String,
}

impl Config {
    pub fn from_file(path: &str) -> Result<Self, AppError> {
        let content = std::fs::read_to_string(path)
            .map_err(|e| AppError::Configuration(format!("Failed to read config: {}", e)))?;
        
        let config: Config = toml::from_str(&content)
            .map_err(|e| AppError::Configuration(format!("Failed to parse config: {}", e)))?;
        
        Ok(config)
    }
}
```

### Test Infrastructure

```rust
// tests/common/mod.rs
pub async fn setup_test_db() -> SqlitePool {
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect(":memory:")
        .await
        .expect("Failed to create test database");

    setup_schema(&pool).await;
    pool
}

pub fn create_test_tab(id: &str) -> Tab {
    Tab {
        id: id.to_string(),
        window_id: "test-window".to_string(),
        data: r#"{"url": "https://example.com", "title": "Test"}"#.to_string(),
        updated_at: chrono::Utc::now().timestamp(),
    }
}

// tests/repositories/tab_repository_test.rs
#[tokio::test]
async fn test_upsert_tab() {
    let pool = setup_test_db().await;
    let repo = SqliteTabRepository::new(pool);
    let tab = create_test_tab("test-1");

    let result = repo.upsert(&tab).await;
    assert!(result.is_ok());

    let tabs = repo.get_all().await.unwrap();
    assert_eq!(tabs.len(), 1);
    assert_eq!(tabs[0].id, "test-1");
}
```

## Implementation Priority

### Phase 1: Foundation (High Priority)

1. **Error Architecture**
   - Add `thiserror` dependency
   - Create `AppError` enum
   - Implement `IntoResponse` for errors
   - Replace all string errors

2. **Repository Pattern**
   - Create `TabRepository` trait
   - Implement `SqliteTabRepository`
   - Abstract database access from handlers

3. **Basic Testing**
   - Add test dependencies (`tokio-test`, `sqlx` test features)
   - Create test utilities and fixtures
   - Write repository tests

4. **Configuration**
   - Add `serde`, `toml` dependencies
   - Create config structures
   - Replace hardcoded values

### Phase 2: Services (Medium Priority)

1. **Service Layer**
   - Create service traits
   - Implement business logic in services
   - Update handlers to use services

2. **Input Validation**
   - Add validation traits
   - Implement request validation
   - Add domain constraints

3. **Dependency Injection**
   - Create DI container
   - Register dependencies with traits
   - Update main.rs for DI setup

### Phase 3: Observability (Low Priority)

1. **Performance Metrics**
   - Add metrics collection
   - Implement tracing spans
   - Monitor slow operations

2. **Advanced Features**
   - Feature flags
   - Rate limiting
   - Request/response logging

## Dependencies to Add

```toml
[dependencies]
# Error handling
thiserror = "2.0"

# Configuration
serde = { version = "1.0", features = ["derive"] }
toml = "0.8"

# Async traits
async-trait = "0.1"

# Testing (dev dependencies)
[dev-dependencies]
tokio-test = "0.4"
tempfile = "3.0"
```

## Success Metrics

- **Test Coverage**: Target 80%+ like extension
- **Error Handling**: All functions return `Result<T, AppError>`
- **Code Organization**: Clear separation of concerns
- **Configuration**: No hardcoded values
- **Performance**: < 10ms response times for sync endpoint

This architecture will bring the server to the same quality standards as the extension, enabling maintainable, testable, and robust code.

## Related Documents

- **Implementation Steps**: See [@docs/SERVER-ROADMAP-v1.0-STEPS.md](SERVER-ROADMAP-v1.0-STEPS.md) for detailed branch and commit organization
- **Extension Roadmap**: See [@docs/ROADMAP-v0.5-v1.0.md](ROADMAP-v0.5-v1.0.md) for comparison with extension development
