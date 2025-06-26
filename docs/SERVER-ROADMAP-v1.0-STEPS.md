# Server Implementation Steps (v1.0)

This document provides detailed branch and commit organization for implementing the optimized server v1.0 roadmap.

## 📝 Progress Tracking

- Use `[ ]` for pending commits, `[x]` for completed commits
- **IMPORTANT**: Update checkboxes as part of the PR, not after merging
- The final commit before creating a PR should update both SERVER-ROADMAP files
- Add notes in parentheses for any deviations: `[x] (modified: added extra validation)`

## 🌿 Branch Strategy

```
main
└── feat/server-v1.0-architecture
    ├── feat/core-foundation         # Phase 0 - Error, Config, DI, Modules
    ├── feat/data-layer              # Phase 1 - Repository, CRDT, Tests
    ├── feat/business-logic          # Phase 2 - Services, Domain, Validation
    ├── feat/crdt-synchronization    # Phase 3 - Clock, Updates, Delta Sync
    ├── feat/performance-security    # Phase 4 - Cache, TLS, Optimization
    └── feat/observability-polish    # Phase 5 - Metrics, Health, Docs
```

## ⚠️ CRITICAL: Pre-commit Requirements

**EVERY commit MUST pass these checks before pushing:**

```bash
# Run from server directory
cargo fmt --all           # Format code
cargo clippy --all-targets -- -D warnings  # Linting
cargo test                 # All tests must pass
```

**If any check fails, fix the issues before committing!**

---

## 🏗️ Server v1.0 - Clean Architecture Implementation

### 🔀 Branch: `feat/server-v1.0-architecture`

```bash
git checkout main
git checkout -b feat/server-v1.0-architecture
```

#### Phase 0: Core Foundation

**Branch**: `feat/core-foundation`

```bash
git checkout -b feat/core-foundation
```

**Commits**:

1. [ ] `chore: add core foundation dependencies`
   - Add `thiserror = "2.0"` for error handling
   - Add `serde = { version = "1.0", features = ["derive"] }`
   - Add `toml = "0.8"` and `dotenvy = "0.15"` for configuration
   - Add `shaku = "0.5"` for dependency injection
   - Run `cargo check` to verify compilation

2. [ ] `feat: implement error architecture with thiserror`
   - Create `src/errors/mod.rs` and `src/errors/app_error.rs`
   - Define `AppError` enum with all error variants
   - Implement `IntoResponse` for Axum
   - Map errors to appropriate HTTP status codes
   - Create structured JSON error responses

3. [ ] `feat: add configuration management`
   - Create `src/config/mod.rs` and `src/config/settings.rs`
   - Define `Config`, `ServerConfig`, `DatabaseConfig`, `AuthConfig`, `TlsConfig`
   - Implement TOML file loading with environment overrides
   - Add validation for configuration values
   - Create `server/config/example.toml` with documentation

4. [ ] `feat: establish module structure`
   - Create directory structure: `domain/`, `repositories/`, `services/`, `handlers/`, `middleware/`
   - Add `mod.rs` files with module exports
   - Update `lib.rs` with public API surface
   - Define clear module boundaries
   - Document module purposes

5. [ ] `feat: set up dependency injection with shaku`
   - Create `src/di/mod.rs` and `src/di/module.rs`
   - Define `TanakaModule` with shaku
   - Create provider traits for core components
   - Set up mock provider support for testing
   - Wire basic DI in `main.rs`

6. [ ] `refactor: update main.rs to use new foundation`
   - Load configuration from file/env
   - Initialize error handling
   - Set up DI container
   - Remove all hardcoded values
   - Verify application starts correctly

7. [ ] `test: add foundation tests`
   - Test error conversions and responses
   - Test configuration loading and validation
   - Test DI container setup
   - Verify module boundaries

8. [ ] `docs: update roadmap for core foundation completion`
   - Mark Phase 0 items complete in SERVER-ROADMAP-v1.0.md
   - Update this file's checkboxes
   - Document any architectural decisions

**PR**: Merge `feat/core-foundation` → `feat/server-v1.0-architecture`

#### Phase 1: Data Layer

**Branch**: `feat/data-layer`

```bash
git checkout feat/server-v1.0-architecture
git checkout -b feat/data-layer
```

**Commits**:

1. [ ] `chore: add data layer dependencies`
   - Add `yrs = "0.21"` for CRDT support
   - Add `async-trait = "0.1"` for repository traits
   - Add `tokio-test = "0.4"` to dev-dependencies
   - Add `tempfile = "3.0"` for test databases
   - Verify dependency compatibility

2. [ ] `feat: define repository traits`
   - Create `src/repositories/mod.rs` and `src/repositories/traits.rs`
   - Define `TabRepository` trait with async methods
   - Include error handling using `AppError`
   - Document trait methods and contracts
   - Add `Send + Sync` bounds for async usage

3. [ ] `feat: implement CRDT document models`
   - Create `src/domain/crdt/mod.rs` and `src/domain/crdt/document.rs`
   - Define `YrsDocument` wrapper around `yrs::Doc`
   - Add methods for binary update handling
   - Implement merge logic for Yjs documents
   - Create conversion utilities

4. [ ] `feat: create database migration for CRDT schema`
   - Create migration file in `migrations/` directory
   - Define `tabs` table with BLOB for CRDT state
   - Add `clock`, `device_id`, and `updated_at` fields
   - Create `sync_state` table for client tracking
   - Add indexes for performance

5. [ ] `feat: implement SQLite repository`
   - Create `src/repositories/impl/sqlite_tab_repository.rs`
   - Implement `TabRepository` for SQLite
   - Handle binary CRDT state storage/retrieval
   - Add clock-based query methods
   - Use prepared statements for performance

6. [ ] `feat: create test utilities`
   - Create `tests/common/mod.rs`
   - Add `setup_test_db()` function
   - Add test data factories
   - Create cleanup utilities
   - Document test patterns

7. [ ] `test: add comprehensive repository tests`
   - Test all CRUD operations
   - Test CRDT state persistence
   - Test concurrent access scenarios
   - Test error conditions
   - Achieve high coverage

8. [ ] `refactor: wire repository through DI`
   - Register `SqliteTabRepository` in shaku module
   - Add repository provider
   - Update handlers to use injected repository
   - Remove direct SQL from handlers

9. [ ] `docs: update roadmap for data layer completion`
   - Mark Phase 1 items complete
   - Document repository patterns
   - Update architecture documentation

**PR**: Merge `feat/data-layer` → `feat/server-v1.0-architecture`

#### Phase 2: Business Logic

**Branch**: `feat/business-logic`

```bash
git checkout feat/server-v1.0-architecture
git checkout -b feat/business-logic
```

**Commits**:

1. [ ] `chore: add business logic dependencies`
   - Add `validator = "0.18"` for input validation
   - Update Cargo.lock
   - Run pre-commit checks

2. [ ] `feat: define service traits`
   - Create `src/services/mod.rs` and `src/services/traits.rs`
   - Define `SyncService` trait with business methods
   - Define `AuthService` trait for authentication
   - Document service boundaries
   - Add async trait bounds

3. [ ] `feat: create domain models`
   - Create `src/domain/mod.rs` and `src/domain/models.rs`
   - Define business domain types (Tab, Window, SyncState)
   - Separate from DTOs and database models
   - Add domain-specific methods
   - Implement validation rules

4. [ ] `feat: implement sync service`
   - Create `src/services/impl/sync_service.rs`
   - Implement business logic for synchronization
   - Add validation for sync requests
   - Handle business rules and constraints
   - Use repository through DI

5. [ ] `feat: implement auth service`
   - Create `src/services/impl/auth_service.rs`
   - Implement token validation logic
   - Add rate limiting preparation
   - Handle authentication failures
   - Use configuration through DI

6. [ ] `feat: add input validation layer`
   - Create `src/validation/mod.rs`
   - Implement request validators
   - Add domain constraint validation
   - Create validation middleware
   - Return structured validation errors

7. [ ] `test: add service layer tests`
   - Test service business logic
   - Test validation rules
   - Mock repository layer
   - Test error scenarios
   - Achieve high coverage

8. [ ] `refactor: update handlers to use services`
   - Inject services into handlers
   - Remove business logic from handlers
   - Focus handlers on HTTP concerns
   - Maintain API compatibility

9. [ ] `docs: update roadmap for business logic completion`
   - Mark Phase 2 items complete
   - Document service patterns
   - Update API documentation

**PR**: Merge `feat/business-logic` → `feat/server-v1.0-architecture`

#### Phase 3: CRDT Synchronization

**Branch**: `feat/crdt-synchronization`

```bash
git checkout feat/server-v1.0-architecture
git checkout -b feat/crdt-synchronization
```

**Commits**:

1. [ ] `feat: implement Lamport clock`
   - Create `src/domain/crdt/clock.rs`
   - Implement `LamportClock` with `AtomicU64`
   - Add thread-safe increment methods
   - Ensure monotonic ordering
   - Add clock comparison utilities

2. [ ] `feat: add binary update handling to sync endpoint`
   - Update sync handler to accept binary data
   - Parse Yjs updates using `yrs`
   - Merge updates into server document
   - Handle malformed update data
   - Add request size limits

3. [ ] `feat: implement delta synchronization`
   - Add "since" parameter to sync endpoint
   - Track client sync state in database
   - Generate delta updates based on clock
   - Optimize for minimal data transfer
   - Handle clock reset scenarios

4. [ ] `test: add CRDT synchronization tests`
   - Test concurrent updates from multiple clients
   - Verify eventual consistency
   - Test clock ordering guarantees
   - Test delta sync efficiency
   - Verify no data loss

5. [ ] `perf: optimize CRDT operations`
   - Add caching for frequently accessed documents
   - Batch database writes
   - Optimize delta computation
   - Profile and benchmark
   - Document performance characteristics

6. [ ] `docs: update roadmap for CRDT sync completion`
   - Mark Phase 3 items complete
   - Document sync protocol
   - Add sequence diagrams

**PR**: Merge `feat/crdt-synchronization` → `feat/server-v1.0-architecture`

#### Phase 4: Performance & Security

**Branch**: `feat/performance-security`

```bash
git checkout feat/server-v1.0-architecture
git checkout -b feat/performance-security
```

**Commits**:

1. [ ] `chore: add performance and security dependencies`
   - Add `dashmap = "6"` for caching
   - Add `rustls = "0.23"` and `rustls-pemfile = "2"`
   - Add `criterion = "0.5"` to dev-dependencies
   - Verify no conflicts

2. [ ] `feat: implement caching layer with DashMap`
   - Create `src/cache/mod.rs`
   - Implement `DocumentCache` using DashMap
   - Add cache warming on startup
   - Implement TTL and eviction
   - Monitor cache metrics

3. [ ] `feat: add TLS support`
   - Create `src/tls/mod.rs`
   - Parse TLS configuration
   - Support self-signed and Let's Encrypt
   - Configure rustls for axum
   - Add certificate reloading

4. [ ] `feat: implement performance optimizations`
   - Enable SQLite WAL mode
   - Configure connection pool
   - Add prepared statement caching
   - Optimize for 200+ tabs
   - Add batch operations

5. [ ] `perf: create benchmark suite`
   - Create `benches/sync_benchmark.rs`
   - Benchmark sync endpoint latency
   - Test with varying tab counts
   - Measure memory usage
   - Target P95 ≤ 10ms

6. [ ] `feat: harden security`
   - Implement secure token validation
   - Add request size limits
   - Add rate limiting hooks
   - Validate all inputs
   - Add security headers

7. [ ] `test: add performance and security tests`
   - Test cache behavior
   - Test TLS configuration
   - Load test with many clients
   - Test security boundaries
   - Verify optimizations

8. [ ] `docs: update roadmap for performance/security completion`
   - Mark Phase 4 items complete
   - Document performance results
   - Add security guidelines

**PR**: Merge `feat/performance-security` → `feat/server-v1.0-architecture`

#### Phase 5: Observability & Polish

**Branch**: `feat/observability-polish`

```bash
git checkout feat/server-v1.0-architecture
git checkout -b feat/observability-polish
```

**Commits**:

1. [ ] `chore: add observability dependencies`
   - Add `metrics = "0.23"` and `prometheus = "0.13"`
   - Add `tracing = "0.1"` and `tracing-opentelemetry = "0.26"`
   - Configure feature flags
   - Verify compatibility

2. [ ] `feat: implement metrics collection`
   - Create `src/observability/mod.rs` and `src/observability/metrics.rs`
   - Add request duration histograms
   - Add operation counters
   - Track error rates by type
   - Export business metrics

3. [ ] `feat: add distributed tracing`
   - Create `src/observability/tracing.rs`
   - Configure OpenTelemetry exporter
   - Add spans to all operations
   - Include relevant context
   - Support sampling

4. [ ] `feat: implement health endpoints`
   - Create `src/handlers/health.rs`
   - Add `/healthz` for liveness
   - Add `/ready` for readiness
   - Check database connectivity
   - Return structured status

5. [ ] `feat: add metrics endpoint`
   - Create `/metrics` handler
   - Export Prometheus format
   - Include custom metrics
   - Add metric descriptions
   - Document scraping

6. [ ] `feat: add API documentation`
   - Integrate OpenAPI/Swagger
   - Document all endpoints
   - Add request/response examples
   - Generate client SDKs
   - Host documentation UI

7. [ ] `test: add end-to-end tests`
   - Test complete user flows
   - Verify metrics accuracy
   - Test health checks
   - Validate documentation
   - Check all integrations

8. [ ] `docs: finalize v1.0 documentation`
   - Update all roadmap files
   - Verify success metrics
   - Create migration guide
   - Add deployment guide
   - Prepare release notes

**PR**: Merge `feat/observability-polish` → `feat/server-v1.0-architecture`

### 🎯 Final v1.0 Server Release

**PR**: Merge `feat/server-v1.0-architecture` → `main`
**Tag**: `server-v1.0.0`

---

## 📋 Commit Guidelines

### Pre-commit Checklist

**EVERY commit must pass these checks:**

1. **Code Formatting**: `cargo fmt --all`
2. **Linting**: `cargo clippy --all-targets -- -D warnings`
3. **Tests**: `cargo test`
4. **Documentation**: Update relevant docs if needed
5. **Dependencies**: `cargo check` for compilation

### Documentation Updates

Each feature branch should include roadmap updates **as part of the PR**:

1. **Final commit before creating PR should update:**
   - **SERVER-ROADMAP-v1.0.md**: Mark completed items with `[x]`
   - **SERVER-ROADMAP-v1.0-STEPS.md**: Mark commits as complete with `[x]`
   - Update "Current Status" and success metrics
   - Add any discovered tasks or deviations

2. **Include roadmap updates in the PR**:
   - Ensures roadmap stays in sync with code changes
   - Prevents forgetting to update documentation
   - Makes PR self-documenting

Example final commit before PR:

```bash
# After completing all feature work, update roadmaps
git add docs/SERVER-ROADMAP-v1.0.md docs/SERVER-ROADMAP-v1.0-STEPS.md
git commit -m "docs: update server roadmaps for Phase X completion

- Mark all completed items with [x]
- Update success metrics
- Note any deviations or additional work"
```

## 📋 PR Template

```markdown
## Description
Brief description of server improvements

## Type of Change
- [ ] Architecture improvement
- [ ] New feature
- [ ] Bug fix
- [ ] Test coverage
- [ ] Documentation

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Performance benchmarks run (if applicable)
- [ ] Manual testing completed

## Pre-commit Checks
- [ ] `cargo fmt --all` passes
- [ ] `cargo clippy --all-targets -- -D warnings` passes
- [ ] `cargo test` passes
- [ ] No compilation warnings

## Documentation
- [ ] Code follows Rust best practices
- [ ] Self-review completed
- [ ] API documentation updated (if applicable)
- [ ] **SERVER-ROADMAP files updated with [x] for completed items**
- [ ] **Success metrics updated if applicable**

## Performance Impact
- [ ] No performance regression
- [ ] Benchmarks included (for performance-critical changes)
- [ ] Memory usage acceptable
```

---

## 🔄 Continuous Integration

Each PR should trigger:

1. **Rust Quality Checks**:
   - `cargo check --all-targets`
   - `cargo clippy -- -D warnings`
   - `cargo fmt --check`

2. **Testing**:
   - `cargo test`
   - `cargo test --release`
   - Integration tests
   - Coverage report generation

3. **Performance**:
   - Benchmark critical paths
   - Memory usage validation
   - Build time measurement

4. **Security**:
   - `cargo audit`
   - Dependency vulnerability scan
   - RUSTSEC advisory check

5. **Documentation**:
   - `cargo doc --no-deps`
   - Verify no broken links
   - Check example compilation

---

## 📊 Success Metrics

| Metric | v0.5 Baseline | v1.0 Target | Current |
|--------|---------------|-------------|---------|
| **Test Coverage (Lines)** | 0% | ≥ 80% | TBD |
| **Test Coverage (Branches)** | 0% | ≥ 70% | TBD |
| **P95 Sync Latency** | ~50ms | ≤ 10ms | TBD |
| **Error Rate (5xx)** | Unknown | < 0.1% | TBD |
| **Memory Footprint** | Unknown | ≤ 30MB RSS | TBD |
| **Build Time (CI)** | Unknown | ≤ 30s | TBD |
| **Error Handling** | String errors | Typed `AppError` | TBD |
| **Code Organization** | Flat structure | Domain modules | TBD |
| **Configuration** | Hardcoded | TOML + env vars | TBD |
| **Lines of Code** | ~200 | ~2000+ | TBD |

---

## 🚀 Development Workflow

1. **Start a new feature branch** from the appropriate parent
2. **Make atomic commits** - each commit should be one logical change
3. **Run pre-commit checks** before EVERY commit
4. **Update tests** as you go - don't leave them for the end
5. **Document as you code** - add doc comments and update relevant docs
6. **Update roadmaps** in the final commit before PR
7. **Create PR** with the template filled out completely

---

**Note**: This is a living document. Update commit messages and track progress as implementation proceeds. The optimized phase ordering reduces total work by establishing patterns early and avoiding repetitive refactoring.
