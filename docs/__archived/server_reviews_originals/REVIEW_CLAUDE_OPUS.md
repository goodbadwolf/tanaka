# Tanaka Server Redesign and Re-architecture Report

## Executive Summary

The Tanaka server codebase exhibits several critical architectural and implementation issues that significantly impact maintainability, security, and performance. This report provides a comprehensive redesign focusing on addressing these weaknesses.

## 1. Architecture & Design Issues

### 1.1 Over-engineered Service Layer

**Problem**: The service trait abstraction is premature and adds unnecessary complexity without providing value.

```rust
// Current: Unused trait definitions
pub trait TabService: Send + Sync { ... }
pub trait WindowService: Send + Sync { ... }
pub trait HealthService: Send + Sync { ... }
```

**Solution**: Remove unused abstractions and implement functionality directly where needed.

```rust
// Proposed: Direct implementation in handlers
pub async fn sync_handler(
    State(deps): State<Arc<AppDependencies>>,
    Json(request): Json<SyncRequest>,
) -> Result<Json<SyncResponse>, AppError> {
    // Direct business logic here
}
```

### 1.2 Incomplete CRDT Implementation

**Problem**: The yrs CRDT implementation is fundamentally broken - `get_tabs()` and `get_windows()` return empty vectors.

**Solution**: Replace with a simpler, working CRDT implementation:

```rust
// Use a proven CRDT library or implement a simple state-based CRDT
use automerge::{Automerge, ObjType};

pub struct CrdtDocument {
    doc: Automerge,
}

impl CrdtDocument {
    pub fn new() -> Self {
        let mut doc = Automerge::new();
        doc.put(ROOT, "tabs", ObjType::Map).unwrap();
        doc.put(ROOT, "windows", ObjType::Map).unwrap();
        Self { doc }
    }
}
```

### 1.3 Confused Separation of Concerns

**Problem**: CRDT logic is scattered across `sync.rs`, `services/sync.rs`, and `crdt.rs`.

**Solution**: Consolidate into a single module:

```rust
// src/sync/mod.rs
mod crdt;
mod operations;
mod handler;

pub use handler::sync_handler;
pub use operations::{CrdtOperation, SyncRequest, SyncResponse};
```

## 2. Security Vulnerabilities

### 2.1 Inadequate Authentication

**Problem**: Shared token authentication is too simplistic and insecure.

**Solution**: Implement proper JWT-based authentication:

```rust
use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey};

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,  // Device ID
    exp: usize,   // Expiration
    iat: usize,   // Issued at
}

pub struct JwtAuthService {
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
}

impl JwtAuthService {
    pub fn create_token(&self, device_id: &str) -> Result<String, AppError> {
        let claims = Claims {
            sub: device_id.to_string(),
            exp: (Utc::now() + Duration::hours(24)).timestamp() as usize,
            iat: Utc::now().timestamp() as usize,
        };

        encode(&Header::default(), &claims, &self.encoding_key)
            .map_err(|e| AppError::Auth(e.to_string()))
    }
}
```

### 2.2 Permissive CORS

**Problem**: `CorsLayer::permissive()` allows any origin.

**Solution**: Configure CORS properly:

```rust
use tower_http::cors::{CorsLayer, AllowOrigin};

let cors = CorsLayer::new()
    .allow_origin(AllowOrigin::list([
        "https://addon.mozilla.org".parse().unwrap(),
        "moz-extension://*".parse().unwrap(),
    ]))
    .allow_methods([Method::GET, Method::POST])
    .allow_headers([header::AUTHORIZATION, header::CONTENT_TYPE]);
```

### 2.3 No Rate Limiting Implementation

**Problem**: Basic in-memory counter is insufficient for production.

**Solution**: Use proper rate limiting with Redis:

```rust
use redis::AsyncCommands;
use std::time::Duration;

pub struct RedisRateLimiter {
    client: redis::Client,
    max_requests: u32,
    window: Duration,
}

impl RedisRateLimiter {
    pub async fn check_rate_limit(&self, key: &str) -> Result<bool, AppError> {
        let mut conn = self.client.get_async_connection().await?;

        let count: u32 = conn.incr(key, 1).await?;
        if count == 1 {
            conn.expire(key, self.window.as_secs() as i64).await?;
        }

        Ok(count <= self.max_requests)
    }
}
```

## 3. Database & Storage Issues

### 3.1 No Proper Migration System

**Problem**: Using `CREATE TABLE IF NOT EXISTS` instead of proper migrations.

**Solution**: Implement SQLx migrations:

```sql
-- migrations/20240101000000_initial_schema.sql
CREATE TABLE tabs (
    id TEXT PRIMARY KEY,
    window_id TEXT NOT NULL,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    index INTEGER NOT NULL DEFAULT 0,
    updated_at BIGINT NOT NULL
);

CREATE INDEX idx_tabs_window_id ON tabs(window_id);
CREATE INDEX idx_tabs_updated_at ON tabs(updated_at);
```

```rust
// In main.rs
sqlx::migrate!("./migrations")
    .run(&pool)
    .await
    .expect("Failed to run migrations");
```

### 3.2 Premature Optimization with Statement Cache

**Problem**: Complex statement caching adds no value for SQLite.

**Solution**: Remove statement cache and rely on SQLx's built-in caching:

```rust
// Simply use SQLx directly
let tab = sqlx::query_as!(
    Tab,
    "SELECT * FROM tabs WHERE id = ?",
    id
)
.fetch_optional(&pool)
.await?;
```

### 3.3 Misaligned CRDT State Schema

**Problem**: The `crdt_state` table doesn't properly model CRDT operations.

**Solution**: Redesign schema for event sourcing:

```sql
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aggregate_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_data JSON NOT NULL,
    device_id TEXT NOT NULL,
    lamport_clock BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_aggregate_id (aggregate_id),
    INDEX idx_lamport_clock (lamport_clock),
    UNIQUE(device_id, lamport_clock)
);
```

## 4. Performance Issues

### 4.1 Synchronous Mutex in Async Code

**Problem**: Using `std::sync::Mutex` in async context causes blocking.

**Solution**: Use async-aware primitives:

```rust
use tokio::sync::RwLock;

pub struct CrdtManager {
    documents: Arc<RwLock<HashMap<String, Document>>>,
}

impl CrdtManager {
    pub async fn get_document(&self, id: &str) -> Option<Document> {
        let docs = self.documents.read().await;
        docs.get(id).cloned()
    }
}
```

### 4.2 Unnecessary DashMap Usage

**Problem**: DashMap adds complexity without clear benefit.

**Solution**: Use standard async primitives:

```rust
// Replace DashMap with RwLock<HashMap>
pub struct OperationCache {
    operations: Arc<RwLock<HashMap<String, StoredOperation>>>,
}
```

### 4.3 Too Many Database Indexes

**Problem**: Excessive indexes without query analysis.

**Solution**: Only create indexes for actual query patterns:

```sql
-- Only create indexes that are actually used
CREATE INDEX idx_operations_sync ON operations(device_id, clock)
    WHERE device_id IS NOT NULL;
```

## 5. API Design Issues

### 5.1 Monolithic Sync Endpoint

**Problem**: The `/sync` endpoint does too much.

**Solution**: Split into focused endpoints:

```rust
// Separate concerns
.route("/sync/push", post(push_operations))
.route("/sync/pull", get(pull_operations))
.route("/sync/state", get(get_sync_state))
```

### 5.2 No API Versioning

**Problem**: No versioning strategy for breaking changes.

**Solution**: Implement URL-based versioning:

```rust
Router::new()
    .nest("/api/v1", v1_routes())
    .nest("/api/v2", v2_routes())
```

## 6. Code Quality Issues

### 6.1 Excessive Boilerplate

**Problem**: Too many trait definitions and wrapper types.

**Solution**: Simplify to essential types:

```rust
// Remove unnecessary abstractions
pub struct AppState {
    db: SqlitePool,
    auth: Arc<dyn AuthService>,
}

// Direct handler implementation
pub async fn sync_handler(
    State(state): State<Arc<AppState>>,
    auth: AuthContext,
    Json(request): Json<SyncRequest>,
) -> Result<Json<SyncResponse>, AppError> {
    // Implementation
}
```

### 6.2 Overly Complex Error System

**Problem**: Too many error variants with overlapping meanings.

**Solution**: Simplify error types:

```rust
#[derive(Debug, Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Authentication failed")]
    Auth,

    #[error("Validation error: {field}: {message}")]
    Validation { field: String, message: String },

    #[error("Internal error: {0}")]
    Internal(String),
}

impl AppError {
    pub fn status_code(&self) -> StatusCode {
        match self {
            AppError::Auth => StatusCode::UNAUTHORIZED,
            AppError::Validation { .. } => StatusCode::BAD_REQUEST,
            AppError::Database(_) | AppError::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}
```

## 7. Configuration Issues

### 7.1 Too Many Configuration Options

**Problem**: Overly complex configuration for a simple sync server.

**Solution**: Simplify to essentials:

```rust
#[derive(Debug, Deserialize)]
pub struct Config {
    pub database_url: String,
    pub bind_address: SocketAddr,
    pub jwt_secret: String,
    #[serde(default)]
    pub cors_origins: Vec<String>,
}

impl Config {
    pub fn from_env() -> Result<Self, envy::Error> {
        envy::from_env()
    }
}
```

## 8. Testing Issues

### 8.1 Testing Implementation Details

**Problem**: Tests focus on internal implementation rather than behavior.

**Solution**: Test public API behavior:

```rust
#[tokio::test]
async fn test_sync_flow() {
    let app = test_app().await;

    // Test actual sync behavior
    let response = app
        .post("/api/v1/sync/push")
        .json(&json!({
            "operations": [{
                "type": "upsert_tab",
                "id": "tab1",
                "data": { /* ... */ }
            }]
        }))
        .send()
        .await;

    assert_eq!(response.status(), 200);

    // Verify the operation was stored
    let pull_response = app
        .get("/api/v1/sync/pull?since=0")
        .send()
        .await;

    let body: SyncResponse = pull_response.json().await;
    assert_eq!(body.operations.len(), 1);
}
```

## 9. Proposed Architecture

### 9.1 Simplified Module Structure

```
server/
├── src/
│   ├── main.rs
│   ├── config.rs        # Simple configuration
│   ├── auth.rs          # JWT authentication
│   ├── db.rs            # Database setup
│   ├── error.rs         # Simplified errors
│   ├── models.rs        # Core domain models
│   └── api/
│       ├── mod.rs       # API routes
│       ├── sync.rs      # Sync endpoints
│       └── middleware.rs # Auth & rate limiting
├── migrations/          # SQLx migrations
└── Cargo.toml
```

### 9.2 Technology Recommendations

1. **Authentication**: Use JWT with refresh tokens
2. **Rate Limiting**: Redis-based rate limiting
3. **CRDT**: Use Automerge or implement simple LWW-Register
4. **Database**: SQLite with proper migrations
5. **Caching**: Remove custom caching, use SQLx features
6. **Monitoring**: Add Prometheus metrics

### 9.3 Development Priorities

1. **Phase 1**: Fix security vulnerabilities (auth, CORS, rate limiting)
2. **Phase 2**: Simplify architecture (remove unused code, consolidate modules)
3. **Phase 3**: Implement proper CRDT synchronization
4. **Phase 4**: Add monitoring and observability
5. **Phase 5**: Performance optimization based on actual metrics

## 10. Migration Strategy

1. **Create feature flags** for gradual migration
2. **Implement new auth system** alongside old one
3. **Migrate endpoints** one by one
4. **Add comprehensive tests** for each migrated component
5. **Remove old code** after verification

## Conclusion

The current implementation suffers from premature optimization and over-engineering. The proposed redesign focuses on simplicity, security, and maintainability. By removing unnecessary abstractions and implementing proven patterns, the system will be more reliable and easier to maintain.
