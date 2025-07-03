# Approved Recommendations from Server Review

This document extracts actionable improvements from the original review while maintaining Tanaka's philosophy of simplicity and self-hostability.

## Worth Implementing

### 1. Fix CRDT Implementation (CRITICAL)
**Problem**: `get_tabs()` and `get_windows()` returning empty vectors indicates broken core functionality.

**Action**: Debug and fix the yrs CRDT integration rather than replacing it entirely.
- Investigate why data isn't being properly stored/retrieved
- Add integration tests to verify CRDT operations actually work
- Consider simpler CRDT if yrs proves too complex, but avoid heavy dependencies

### 2. Consolidate CRDT Logic
**Problem**: CRDT logic scattered across `sync.rs`, `services/sync.rs`, and `crdt.rs`.

**Action**: Consolidate into a single, well-organized module:
```rust
// src/sync/mod.rs
mod crdt;
mod operations;
mod handler;

pub use handler::sync_handler;
pub use operations::{CrdtOperation, SyncRequest, SyncResponse};
```

### 3. Implement Database Migrations
**Problem**: Using `CREATE TABLE IF NOT EXISTS` makes schema evolution difficult.

**Action**: Add SQLx migrations for proper schema versioning:
```bash
# Use sqlx-cli to create and manage migrations
sqlx migrate add initial_schema
```

### 4. Fix CORS Configuration
**Problem**: `CorsLayer::permissive()` is a security risk.

**Action**: Make CORS configurable but secure by default:
```rust
// Allow configuration via config file
let cors = CorsLayer::new()
    .allow_origin(/* from config */)
    .allow_methods([Method::GET, Method::POST])
    .allow_headers([header::AUTHORIZATION, header::CONTENT_TYPE]);
```

### 5. Remove Dead Code
**Problem**: Unused service traits add complexity without value.

**Action**: Remove unused abstractions, but keep ones that are actually used or provide clear testing benefits.

### 6. Simplify Error Types
**Problem**: Overlapping error variants complicate error handling.

**Action**: Consolidate similar errors while keeping enough detail for debugging:
```rust
#[derive(Debug, Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Authentication failed")]
    Auth,

    #[error("Invalid request: {0}")]
    BadRequest(String),

    #[error("Internal error: {0}")]
    Internal(String),
}
```

### 7. Add Basic Rate Limiting
**Problem**: No rate limiting protection.

**Action**: Implement simple in-memory rate limiting (no Redis needed):
```rust
// Use a simple token bucket or sliding window in memory
// Reset on server restart is acceptable for personal use
```

### 8. Test Behavior, Not Implementation
**Problem**: Tests focus on internal details.

**Action**: Rewrite tests to verify API behavior and outcomes rather than internal state.

### 9. Add Indexes Based on Actual Queries
**Problem**: Too many indexes without query analysis.

**Action**: Profile actual query patterns and only add indexes that improve real performance.

### 10. Consider API Versioning
**Problem**: No strategy for API evolution.

**Action**: Add simple version prefix to allow future changes:
```rust
.route("/api/v1/sync", post(sync_handler))
```

## Things to AVOID from the Review

### 1. JWT Authentication
- **Why avoid**: Overkill for personal use, adds token management complexity
- **Keep instead**: Improved shared token with configurable expiration

### 2. Redis Dependency
- **Why avoid**: External service requirement contradicts self-hosting simplicity
- **Keep instead**: In-memory rate limiting that resets on restart

### 3. Heavy CRDT Libraries (Automerge)
- **Why avoid**: Large dependency for a simple sync use case
- **Keep instead**: Fix existing yrs implementation or write simple CRDT

### 4. Complete Architecture Rewrite
- **Why avoid**: Working code is better than perfect architecture
- **Keep instead**: Incremental improvements to existing structure

### 5. Overly Complex Service Layers
- **Why avoid**: Abstract interfaces without concrete benefit
- **Keep instead**: Direct, simple implementations

### 6. Splitting Sync into Multiple Endpoints
- **Why avoid**: Complicates client implementation
- **Keep instead**: Single sync endpoint with clear request/response structure

### 7. Over-engineering for "Enterprise" Patterns
- **Why avoid**: This is a personal tool, not enterprise software
- **Keep instead**: Pragmatic solutions that work

### 8. Removing All Caching
- **Why avoid**: Statement cache might provide real benefits
- **Keep instead**: Profile first, remove only if proven unnecessary

## Implementation Priority

1. **Critical**: Fix CRDT implementation (broken core functionality)
2. **High**: Add database migrations, fix CORS
3. **Medium**: Consolidate CRDT logic, remove dead code
4. **Low**: Simplify errors, add rate limiting, improve tests

## Guiding Principles

- **Simplicity over purity**: Pragmatic solutions that work
- **No external dependencies**: Keep it self-contained
- **Incremental improvement**: Don't rewrite what works
- **Profile before optimizing**: Measure, don't assume
- **Personal tool focus**: Avoid enterprise complexity
