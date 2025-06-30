# Server Development Roadmap (v1.0)

This document analyzes the current server state and outlines the architectural improvements needed to match the extension's quality standards for the **v1.0** release.

---

## Current Server State (v0.5.0)

The server is a **minimal MVP** with basic functionality but lacks architectural robustness:

### Current Structure

```text
server/src/
├── main.rs      (47 lines) – Application bootstrap, route registration
├── models.rs    (25 lines) – Data transfer objects, TypeScript generation
├── db.rs        (34 lines) – Database initialization, connection pool
├── sync.rs      (55 lines) – Single sync endpoint handler
├── auth.rs      (23 lines) – Hard‑coded bearer token middleware
└── lib.rs        (2 lines) – Module exports
```

### Architecture Issues

1. **No Error Architecture** – string errors, no structured handling
2. **No Repository Pattern** – direct SQL in handlers
3. **No Service Layer** – business logic mixed with HTTP handling
4. **No Configuration** – hard‑coded values (port, auth token, DB path)
5. **Zero Test Coverage** – no tests, fixtures, or test utilities
6. **No Observability** – no metrics, performance monitoring
7. **Poor Modularity** – flat structure, tight coupling

---

## Missing Patterns vs Extension

| Pattern                  | Extension Implementation         | Server Current        | Server Needs                                        |
| ------------------------ | -------------------------------- | --------------------- | --------------------------------------------------- |
| **Error Handling**       | `neverthrow` + typed errors      | `String` errors       | `thiserror`‑based `AppError`, `Result<T, AppError>` |
| **Clean Architecture**   | Repository/Service/Domain layers | Direct DB in handlers | Repository pattern + service layer                  |
| **Dependency Injection** | Symbol‑token DI container        | Hard‑wired deps       | Trait‑based DI (`shaku`), `Arc<dyn Trait>`          |
| **Configuration**        | Env‑based settings               | Hard‑coded values     | TOML config + env overrides                         |
| **Testing**              | 86.8% coverage (extension)       | 0% (server)           | Unit + integration tests, fixtures                  |
| **Observability**        | Tracing + metrics utilities      | None                  | `metrics`, `prometheus`, `tracing-opentelemetry`    |
| **Validation**           | Type guards & runtime checks     | None                  | Request & domain validation layer                   |
| **Modularity**           | Feature‑based folders            | Flat structure        | Domain‑oriented modules                             |

---

## Recommended Architecture (v1.0)

### Target Structure: Option 1 (Simpler)

```text
server/src/
├── main.rs                      – Application bootstrap
├── config/                      – Configuration handling
│   └── settings.rs              – TOML config structures
├── domain/                      – Domain models & logic
├── repositories/                – Data‑access traits + impls
├── services/                    – Business logic & orchestration
├── handlers/                    – HTTP endpoints
├── middleware/                  – Auth, tracing, validation
├── observability/               – Metrics & tracing helpers
├── errors/                      – Error types & conversions
└── lib.rs                       – Public exports
```

### Target Structure: Option 2 (More Detailed)

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

---

## Implementation Patterns

### Error Handling with `thiserror`

```rust
#[derive(thiserror::Error, Debug)]
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
```

### Repository Pattern with Traits

```rust
#[async_trait::async_trait]
pub trait TabRepository: Send + Sync {
    async fn upsert(&self, tab: &Tab) -> Result<(), AppError>;
    /* … */
}
```

### Service Layer & DI (using **shaku**)

> **Note**: Check [shaku's latest version](https://crates.io/crates/shaku) for current best practices.

- Register repositories, services, and validators in a `shaku::Module`.
- Resolve once in `main.rs`, pass via Axum `Extension`.
- Provide mock implementations for tests.

### Observability & Metrics

- Emit counters and histograms with `metrics` crate.
- Expose Prometheus scraper at `/metrics`.
- Wrap handlers in `tracing` spans; export via `tracing-opentelemetry` when `OTEL_ENDPOINT` is set.

### Performance Benchmarks

- Add Criterion benches in `benches/` targeting P95 sync ≤ 10 ms.
- Enable SQLite WAL + PRAGMA tuning.

---

## Implementation Priority

### Phase 0 – Core Foundation

1. **Error Architecture** – add `thiserror`, create `AppError`, implement `IntoResponse`
   - Define error types for all failure modes
   - Map errors to appropriate HTTP status codes
   - Create structured error responses

2. **Configuration Management** – `serde`, `toml`, config structs, remove hard-coded values
   - Create configuration structures for server, database, auth, and TLS
   - Support TOML files with environment variable overrides
   - Remove all hardcoded values from codebase

3. **Module Structure** – establish clean architecture from the start
   - Create directory structure: domain/, repositories/, services/, handlers/, middleware/
   - Define module boundaries and exports
   - Prevent circular dependencies

4. **Dependency Injection** – integrate **shaku** container early
   - Set up DI container with trait-based providers
   - Enable mock implementations for testing
   - Wire core components through DI

### Phase 1 – Data Layer

1. **Repository Pattern** – define repository traits and SQLite implementation
   - Create `TabRepository` trait with async methods
   - Implement `SqliteTabRepository` with proper error handling
   - Move SQL queries from handlers to repository

2. **CRDT Integration** – add `yrs` dependency for CRDT support
   - Create CRDT document models with `yrs::Doc`
   - Handle binary Yjs updates from extension
   - Implement document merging logic

3. **Database Schema** – migrate schema for CRDT storage
   ```sql
   CREATE TABLE tabs (
       id TEXT PRIMARY KEY,
       window_id TEXT NOT NULL,
       doc_state BLOB NOT NULL,      -- Binary CRDT state
       clock INTEGER NOT NULL,        -- Lamport clock
       device_id TEXT NOT NULL,       -- Client identification
       updated_at INTEGER NOT NULL
   );

   CREATE TABLE sync_state (
       client_id TEXT PRIMARY KEY,
       last_clock INTEGER NOT NULL,
       last_sync INTEGER NOT NULL
   );
   ```

4. **SQLite Repository** – implement data access with CRDT awareness
   - Store and retrieve binary CRDT states
   - Handle clock-based queries efficiently
   - Add proper indexes for performance

5. **Test Infrastructure** – set up testing foundation early
   - Add `tokio-test`, `tempfile` for test databases
   - Create test utilities and fixtures
   - Write repository tests with coverage

### Phase 2 – Business Logic

1. **Service Traits** – define service interfaces
   - Create `SyncService` and `AuthService` traits
   - Define clear service boundaries
   - Document service contracts

2. **Domain Models** – create business domain types with validation
   - Separate domain models from DTOs
   - Add business rule validation
   - Implement type guards and constraints

3. **Service Implementation** – implement business logic
   - Implement sync logic with validation
   - Add authentication service
   - Handle business rules and invariants

4. **Integration Tests** – test service layer thoroughly
   - Test service interactions
   - Verify business rule enforcement
   - Mock repository layer

### Phase 3 – CRDT Synchronization

1. **Lamport Clock** – implement distributed clock for ordering
   - Create thread-safe clock with `AtomicU64`
   - Ensure monotonic incrementing
   - Add clock synchronization logic

2. **Binary Update Handling** – process Yjs updates in sync endpoint
   - Parse incoming binary updates
   - Merge with server document state
   - Generate delta updates for response

3. **Delta Synchronization** – implement efficient sync protocol
   - Track client sync state (last clock, last sync)
   - Send only changes since last sync
   - Handle "since" parameter for incremental updates

4. **Conflict Resolution Tests** – verify CRDT merge semantics
   - Test concurrent updates from multiple clients
   - Verify convergence properties
   - Test edge cases and race conditions

### Phase 4 – Performance & Security

1. **Caching Layer** – add DashMap for in-memory performance
   - Cache frequently accessed CRDT documents
   - Implement cache warming and invalidation
   - Monitor cache hit rates

2. **TLS Support** – add `rustls` for HTTPS
   - Configure TLS with certificate support
   - Support both self-signed and Let's Encrypt
   - Implement secure token validation

3. **Performance Optimization** – tune for 200+ tabs
   - Enable SQLite WAL mode and pragmas
   - Optimize connection pool settings
   - Add prepared statement caching

4. **Benchmark Suite** – measure and validate performance
   - Create Criterion benchmarks
   - Target P95 sync latency ≤ 10ms
   - Test with high concurrency

### Phase 5 – Observability & Polish

1. **Metrics & Tracing** – add comprehensive monitoring
   - Implement request metrics with `metrics` crate
   - Add distributed tracing with OpenTelemetry
   - Export metrics to Prometheus

2. **Health Endpoints** – implement health checks
   - Create `/healthz` for liveness
   - Add `/ready` for readiness with dependency checks
   - Return structured health status

3. **API Documentation** – add OpenAPI/Swagger docs
   - Document all endpoints with examples
   - Generate client SDKs
   - Add error response documentation

4. **Final Integration** – polish and validate
   - Run end-to-end tests
   - Verify all success metrics
   - Update documentation

--

## Dependencies to Add

```toml
[dependencies]
# Phase 0 - Core Foundation
thiserror = "2.0"         # Error handling with rich error types
serde = { version = "1.0", features = ["derive"] }
toml = "0.8"             # Configuration file parsing
dotenvy = "0.15"         # Environment variable support
shaku = "0.5"            # Dependency injection container

# Phase 1 - Data Layer  
yrs = "0.21"             # Yjs CRDT implementation for Rust
async-trait = "0.1"      # Async trait support for repositories

# Phase 2 - Business Logic
validator = "0.18"       # Input validation

# Phase 3 - CRDT Synchronization
# (uses yrs from Phase 1)

# Phase 4 - Performance & Security
dashmap = "6"            # High-performance concurrent hashmap for caching
rustls = "0.23"          # TLS implementation
rustls-pemfile = "2"     # PEM file parsing for certificates

# Phase 5 - Observability
metrics = "0.23"         # Metrics collection
prometheus = "0.13"      # Prometheus exporter
tracing = "0.1"          # Structured logging
tracing-opentelemetry = "0.26"  # OpenTelemetry integration

[dev-dependencies]
tokio-test = "0.4"
criterion = "0.5"
```

---

## Success Metrics

- **Test Coverage** – ≥ 80 % lines, ≥ 70 % branches.
- **Build Time** – ≤ 30 s in CI.

This architecture will elevate the server to match the extension's robustness while remaining performant and observable.

---

## Related Documents

- **Implementation Steps**: See [@docs/SERVER-ROADMAP-v1.0-STEPS.md](SERVER-ROADMAP-v1.0-STEPS.md) for detailed branch and commit organization
- **Extension Roadmap**: See [@docs/ROADMAP-v0.5-v1.0.md](ROADMAP-v0.5-v1.0.md) for comparison with extension development

---
