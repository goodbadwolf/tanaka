# Tanaka Architecture Review v2

This document identifies critical bugs and pragmatic improvements for the Tanaka tab synchronization system.

## Current State: Fundamentally Broken

**Tanaka cannot fulfill its primary purpose** - syncing tabs between Firefox instances. When users try to use it:

1. **First Device**: Works locally ✓
2. **Second Device**: Cannot sync - authentication forces same device_id ✗
3. **Server Restart**: All data lost ✗
4. **Extended Use**: Memory leak causes crash ✗

## Critical Bugs (Break Core Functionality)

### 1. Device ID Authentication - THE Showstopper

**Impact**: Makes multi-device sync impossible. All devices are forced to use the same ID.

**Current broken code**:
```rust
// services/auth.rs
pub async fn authenticate(&self, token: &str, device_id: &str) -> Result<AuthContext> {
    let hash = // derive from token
    if device_id != hash { return Err(Unauthorized); } // BREAKS EVERYTHING
}
```

**Fix**:
```rust
pub async fn authenticate(&self, token: &str, request_device_id: &str) -> Result<AuthContext> {
    if token != self.shared_token {
        return Err(AppError::Unauthorized);
    }

    Ok(AuthContext {
        device_id: request_device_id.to_string(), // Trust client's device_id!
        authenticated: true,
    })
}
```

### 2. Complete Data Loss on Server Restart

**Impact**: Server starts with empty state, ignoring all history in database.

**Fix**:
```rust
impl CrdtManager {
    pub async fn initialize_from_db(&self, pool: &SqlitePool) -> Result<()> {
        // Restore Lamport clock
        let max_clock = sqlx::query_scalar!(
            "SELECT COALESCE(MAX(clock), 0) FROM operations"
        )
        .fetch_one(pool)
        .await?;

        self.clock.set_minimum(max_clock);

        // Reload operations to rebuild state
        let operations = sqlx::query_as!(
            StoredOperation,
            "SELECT * FROM operations ORDER BY clock ASC"
        )
        .fetch_all(pool)
        .await?;

        let doc = self.get_document("default")?;
        for op in operations {
            let crdt_op: CrdtOperation = serde_json::from_str(&op.data)?;
            doc.apply_operation(&crdt_op)?;
        }

        Ok(())
    }
}
```

### 3. Lamport Clock Race Conditions

**Server-side**: Non-atomic increment can cause operation ordering issues.

**Fix**:
```rust
impl LamportClock {
    pub fn update(&self, received: u64) -> u64 {
        loop {
            let current = self.0.load(Ordering::Acquire);
            let new_value = current.max(received) + 1;

            match self.0.compare_exchange_weak(
                current,
                new_value,
                Ordering::Release,
                Ordering::Acquire,
            ) {
                Ok(_) => return new_value,
                Err(_) => continue,
            }
        }
    }
}
```

**Extension-side**: ✅ Already fixed - eliminated dual increment between main thread and worker.

### 4. Queue Size Threshold Missing

**Impact**: Users wait up to 10s for sync after many rapid changes.

**Status**: ⚠️ Partially implemented, needs error handling in `triggerBatchedSync`.

**Fix**:
```typescript
async queueOperation(op: CrdtOperation) {
  // ... existing code ...

  try {
    const state = await this.worker.getState();
    if (state.queueLength > this.adaptiveConfig.queueSizeThreshold) {
      await this.syncNow(); // Force immediate sync
    }
  } catch (error) {
    debugLog('Failed to get worker state, continuing with normal batching', error);
  }
}
```

### 5. Message Protocol Inconsistency

**Impact**: Popup may show errors or blank window list.

**Fix**: Remove `titles` expectation from popup, or have MessageHandler send them:
```typescript
case MessageType.GET_TRACKED_WINDOWS:
  const windowIds = await this.windowTracker.getTrackedWindows();
  return { windowIds }; // Popup should not expect 'titles'
```

### 6. Initial Sync Truncation

**Impact**: New devices silently lose tabs beyond the first 100.

**Fix**: Send CRDT state snapshot for initial sync:
```rust
if request.since_clock.is_none() {
    let doc = crdt_manager.get_document("default")?;
    let state_vector = doc.encode_state_as_update();

    return Ok(SyncResponse {
        state_snapshot: Some(base64::encode(state_vector)),
        operations: vec![],
        server_clock: clock.current(),
    });
}
```

### 7. Rate Limiter Memory Leak

**Impact**: Server eventually runs out of memory and crashes.

**Current bug**: Cleanup condition `now.elapsed().as_secs() % 300 == 0` never triggers.

**Fix**:
```rust
pub struct SharedTokenAuthService {
    last_cleanup: Mutex<Instant>,
    cleanup_interval: Duration,
}

async fn maybe_cleanup(&self) {
    let mut last = self.last_cleanup.lock().unwrap();
    if last.elapsed() >= self.cleanup_interval {
        *last = Instant::now();
        drop(last); // Release lock before cleanup

        let cutoff = Instant::now() - Duration::from_secs(3600);
        self.rate_limiter.retain(|_, times| {
            times.retain(|t| *t > cutoff);
            !times.is_empty()
        });
    }
}
```

## Security Vulnerabilities

### CORS Configuration

**Current**: `CorsLayer::permissive()` allows any origin.

**Fix**:
```rust
let cors = CorsLayer::new()
    .allow_origin(AllowOrigin::predicate(|origin, _req| {
        let origin_str = origin.to_str().unwrap_or("");

        // Always allow browser extensions
        origin_str.starts_with("moz-extension://") ||
        origin_str.starts_with("chrome-extension://") ||
        // Allow configured origins
        config.allowed_origins.contains(&origin_str.to_string())
    }))
    .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
    .allow_headers([header::AUTHORIZATION, header::CONTENT_TYPE])
    .allow_credentials(true);
```

### Content Security Policy

**Required for AMO submission**:
```json
// manifest.json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self';"
  }
}
```

### Input Validation

**Prevent DOS attacks**:
```rust
const MAX_OPERATIONS_PER_REQUEST: usize = 1000;
const MAX_OPERATION_SIZE: usize = 1_048_576; // 1MB

impl SyncRequest {
    fn validate(&self) -> Result<(), ValidationError> {
        if self.operations.len() > MAX_OPERATIONS_PER_REQUEST {
            return Err(ValidationError::TooManyOperations);
        }
        // Additional size checks
        Ok(())
    }
}
```

### Dynamic Permission Verification

**MV3 allows users to revoke permissions at runtime**:
```typescript
async function syncWithPermissionCheck(): Promise<Result<void, Error>> {
  const requiredOrigins = [`${CONFIG.serverUrl}/*`];

  const hasPermission = await browser.permissions.contains({
    origins: requiredOrigins
  });

  if (!hasPermission) {
    return err(new Error('Sync permission revoked by user'));
  }

  return performSync();
}
```

## Data Integrity Issues

### Database Migrations

**Issue**: Using runtime CREATE TABLE instead of proper migrations.

**Fix**: Use SQLx migrations:
```bash
sqlx migrate add initial_schema
```

```sql
-- migrations/001_initial_schema.sql
CREATE TABLE IF NOT EXISTS operations (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL,
    clock BIGINT NOT NULL,
    data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_operations_sync ON operations(clock) WHERE clock > 0;
CREATE INDEX idx_operations_device ON operations(device_id, clock);
```

### Idempotency

**Fix duplicate operations**:
```rust
const INSERT_OPERATION: &str = r#"
    INSERT OR IGNORE INTO operations (id, device_id, clock, data)
    VALUES (?, ?, ?, ?)
"#;
```

### Operation ID Collisions

**Issue**: ID format `{clock}_{device_id}_{targetId}` breaks when IDs contain underscores.

**Fix**: Use non-printable delimiter or composite primary key:
```rust
// Option 1: Non-printable delimiter
let operation_id = format!("{}\x1F{}\x1F{}", clock, device_id, target_id);

// Option 2: Composite primary key
CREATE TABLE operations (
    clock BIGINT NOT NULL,
    device_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    operation_data JSON NOT NULL,
    PRIMARY KEY (clock, device_id, target_id)
);
```

### CRDT State Materialization

**Issue**: Operations update memory but not database tables.

**Fix**: Update both atomically:
```rust
impl SyncService {
    async fn apply_operations(&self, ops: Vec<CrdtOperation>) -> Result<()> {
        let mut tx = self.pool.begin().await?;

        for op in ops {
            // 1. Store in operations log
            self.op_repo.store(&mut tx, &op).await?;

            // 2. Update materialized state
            match &op {
                CrdtOperation::UpsertTab { tab, .. } => {
                    sqlx::query!(
                        "INSERT OR REPLACE INTO tabs (id, window_id, url, title, index)
                         VALUES (?, ?, ?, ?, ?)",
                        tab.id, tab.window_id, tab.url, tab.title, tab.index
                    )
                    .execute(&mut tx)
                    .await?;
                }
                CrdtOperation::CloseTab { tab_id, .. } => {
                    sqlx::query!("DELETE FROM tabs WHERE id = ?", tab_id)
                        .execute(&mut tx)
                        .await?;
                }
                // ... other operations
            }

            // 3. Update in-memory CRDT (after DB success)
            self.crdt_manager.apply_operation(&op)?;
        }

        tx.commit().await?;
        Ok(())
    }
}
```

## Performance Optimizations (Only After Measuring)

### SQLite Configuration
```rust
sqlx::query("PRAGMA journal_mode = WAL").execute(&pool).await?;
sqlx::query("PRAGMA synchronous = NORMAL").execute(&pool).await?;
sqlx::query("PRAGMA cache_size = -64000").execute(&pool).await?;
sqlx::query("PRAGMA mmap_size = 268435456").execute(&pool).await?;
sqlx::query("PRAGMA temp_store = MEMORY").execute(&pool).await?;
```

### Tab Event Debouncing
```typescript
class TabEventHandler {
  private pendingOperations = new Map<string, CrdtOperation>();

  private flushOperations = debounce(async () => {
    if (this.pendingOperations.size === 0) return;

    const operations = Array.from(this.pendingOperations.values());
    this.pendingOperations.clear();

    for (const op of operations) {
      await this.syncManager.queueOperation(op);
    }
  }, 300);

  onTabUpdated(tab: Tab) {
    const op: CrdtOperation = {
      type: 'upsert_tab',
      id: tab.id.toString(),
      data: {
        window_id: tab.windowId.toString(),
        url: tab.url ?? '',
        title: tab.title ?? '',
        active: tab.active ?? false,
        index: tab.index,
        updated_at: BigInt(Date.now()),
      },
    };
    this.pendingOperations.set(tab.id, op); // Overwrites previous
    this.flushOperations();
  }
}
```

## Monitoring & Measurement

### Add Performance Tracking
```typescript
class SyncManager {
  async sync() {
    const start = performance.now();

    try {
      await this.performSync();
      const duration = performance.now() - start;

      if (duration > 10) { // 10ms target
        console.warn(`Sync exceeded target: ${duration}ms`);
      }
    } catch (error) {
      // Handle error
    }
  }
}
```

### Memory Budget
```typescript
const MEMORY_BUDGET = {
  BACKGROUND_SCRIPT: 50 * 1024 * 1024,  // 50MB
  OPERATION_QUEUE: 5 * 1024 * 1024,     // 5MB
  WARNING_THRESHOLD: 0.8  // Warn at 80%
};
```

## Code Organization Improvements

### Extract TabOperations Service
```typescript
// New file: extension/src/services/tab-operations.ts
export class TabOperationsService {
  constructor(private browser: IBrowser, private windowTracker: WindowTracker) {}

  async applyOperation(op: CrdtOperation): Promise<Result<void, ExtensionError>> {
    switch (op.type) {
      case 'upsert_tab':
        return await this.upsertTab(op);
      case 'close_tab':
        return await this.closeTab(op);
      default:
        return err(ErrorFactories.invalidData(`Unknown operation type`));
    }
  }
}
```

### Consistent Error Handling
```typescript
import { Result, ok, err } from 'neverthrow';

async function syncTabs(): Promise<Result<void, SyncError>> {
  const validationResult = validateSync();
  if (validationResult.isErr()) {
    return err(validationResult.error);
  }

  return await performSync();
}
```

### API Response Validation
```typescript
import { z } from 'zod';

const SyncResponseSchema = z.object({
  operations: z.array(z.discriminatedUnion('type', [
    // Define schema for each operation type
  ])),
  clock: z.union([z.number(), z.string()]),
});

class TanakaAPI {
  async sync(request: SyncRequest): Promise<Result<SyncResponse, ApiError>> {
    const response = await fetch(...);
    const data = await response.json();

    const parseResult = SyncResponseSchema.safeParse(data);
    if (!parseResult.success) {
      return err(ErrorFactories.invalidData('Invalid response format'));
    }

    return ok(parseResult.data);
  }
}
```

## What NOT to Do

### Over-Engineering to Avoid
- ❌ JWT tokens, OAuth, user accounts - shared token is sufficient
- ❌ Microservices, CQRS, Event Sourcing - massive overkill
- ❌ Repository interfaces everywhere - SQLite isn't changing
- ❌ Redis caching - in-memory is fine
- ❌ Prometheus + Grafana - log files suffice
- ❌ 100% test coverage mandate
- ❌ Property testing, chaos engineering, fuzzing

### Premature Optimizations
- ❌ Custom CRDT implementations - use proven libraries
- ❌ Worker pools - one worker is sufficient
- ❌ SharedArrayBuffer - only if serialization >1ms proven
- ❌ Aggressive code splitting - current bundle is reasonable

## Action Checklist

### Must Fix (Breaks Everything)
- [ ] Fix device ID authentication bug
- [ ] Implement server state persistence on restart
- [ ] Fix server Lamport clock atomicity
- [ ] Complete queue size threshold implementation
- [ ] Fix message protocol inconsistency
- [ ] Fix initial sync truncation
- [ ] Fix rate limiter memory leak

### Should Fix (Security)
- [ ] Replace permissive CORS with proper configuration
- [ ] Add Content Security Policy to manifest.json
- [ ] Add input validation and DOS prevention
- [ ] Implement dynamic permission verification

### Data Integrity
- [ ] Switch to SQLx migrations
- [ ] Add idempotency to operations
- [ ] Fix operation ID collision issues
- [ ] Implement CRDT state materialization

### Measure First, Then Maybe Fix
- [ ] Add performance monitoring
- [ ] Track memory usage
- [ ] Apply SQLite optimizations (if slow)
- [ ] Implement tab event debouncing (if >100 syncs/minute)
- [ ] Extract TabOperations service (if SyncManager >600 lines)

## Success Criteria

Tanaka works correctly when:

### Functionality
- [x] Extension Lamport clock fixed (no dual increment)
- [ ] Multiple Firefox instances can sync tabs using same server
- [ ] Server restarts don't lose data
- [ ] Operations applied in correct order
- [ ] New devices receive complete state
- [ ] Sync happens within 1s during activity
- [ ] Rate limiter cleanup runs without memory growth

### Performance (Verify via Monitoring)
- [ ] P95 sync latency ≤ 10ms
- [ ] Memory usage <50MB with 200+ tabs
- [ ] Tab updates debounced appropriately
- [ ] Batch operations reduce DB load

### Security & Reliability
- [ ] CORS properly configured
- [ ] Input validation prevents DOS
- [ ] Network retries succeed idempotently
- [ ] CSP compliant for AMO submission

### Code Quality
- [ ] SyncManager <300 lines (currently 500+)
- [ ] All async functions return Result<T, E>
- [ ] External API responses validated
- [ ] No test coverage regression

## Key Principle

**Fix bugs → Add monitoring → Optimize based on data**

Tanaka is personal software. Make it work first, then make it good.
