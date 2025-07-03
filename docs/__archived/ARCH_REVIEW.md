# Tanaka Architecture Review: Unified Extension & Server Analysis

This document synthesizes all architecture reviews for both the Firefox extension and Rust server, identifying critical bugs and pragmatic improvements for this personal tab synchronization tool.

## 🎯 Core Principle: Fix Bugs, Measure, Then Optimize

**Priority order across the entire system:**
1. Fix critical bugs that break functionality
2. Add monitoring to understand actual performance
3. Only optimize based on real data, not assumptions

## Executive Summary

Tanaka is **fundamentally broken** in its current state. The most severe finding: **multi-device sync—Tanaka's primary purpose—doesn't work** due to a device ID authentication bug in the server. Additionally:

- Server loses all data on restart (no state persistence)
- Extension has Lamport clock synchronization issues
- Both sides have race conditions that could corrupt sync state
- Security vulnerabilities exist in CORS configuration
- Memory leaks will cause server crashes

**Key insight**: Architectural improvements are meaningless if the core functionality doesn't work. Fix the showstopper bugs first.

## 🔴 Current State: What a User Experiences

When someone tries to use Tanaka today:

1. **First Device**: Extension installs, server starts, tabs sync locally ✓
2. **Second Device**: Authentication fails OR treats both devices as one (no sync) ✗
3. **Server Restart**: All tabs vanish, sync state lost ✗
4. **Heavy Usage**: After 100+ operations, new devices miss tabs ✗
5. **Extended Runtime**: Server eventually crashes from memory leak ✗

**Bottom Line**: A user cannot successfully sync tabs between two Firefox instances, which is Tanaka's sole purpose.

## 🚨 Priority 1: Critical Bugs (Break Core Functionality)

### Server-Side Showstoppers

#### 1.1 Multi-Device Sync is Completely Broken
**Component**: Server  
**Impact**: THE showstopper - makes Tanaka unusable for its intended purpose  
**Bug**: Server derives device_id from auth token hash, forcing all devices to have same ID

```rust
// BROKEN CODE in services/auth.rs
pub async fn authenticate(&self, token: &str, device_id: &str) -> Result<AuthContext> {
    let hash = // derive from token
    if device_id != hash { return Err(Unauthorized); } // THIS BREAKS EVERYTHING
}

// FIXED CODE - Trust client device_id
pub async fn authenticate(&self, token: &str, request_device_id: &str) -> Result<AuthContext> {
    if token != self.shared_token {
        return Err(AppError::Unauthorized);
    }

    Ok(AuthContext {
        device_id: request_device_id.to_string(), // Use what client provides!
        authenticated: true,
    })
}
```

#### 1.2 Complete Data Loss on Server Restart
**Component**: Server  
**Impact**: All tabs disappear when server restarts  
**Bug**: Server starts with empty CRDT state, ignoring database history

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

#### 1.3 Lamport Clock Race Conditions

**Server-Side Race** (Non-atomic update):
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

**Extension-Side Issue** (Dual increment - FIXED):
```typescript
// Bug: Both main thread and worker increment clock
// Fix: Single source of truth
class SyncManagerWithWorker {
  async queueOperation(op: CrdtOperation) {
    this.lamportClock++;
    op.clock = this.lamportClock.toString();
    // Worker should NOT increment, just queue
    await this.worker.queueOperation(op);
  }
}
```

### Extension-Side Critical Bugs

#### 1.4 Missing Queue Size Threshold
**Component**: Extension  
**Impact**: User waits up to 10s for sync after many rapid changes  
**Status**: ⚠️ IN PROGRESS

```typescript
async queueOperation(op: CrdtOperation) {
  // ... existing code ...

  try {
    const state = await this.worker.getState();
    if (state.queueLength > this.adaptiveConfig.queueSizeThreshold) {
      // Force immediate sync instead of waiting
      await this.syncNow();
    }
  } catch (error) {
    debugLog('Failed to get worker state, continuing with normal batching', error);
  }
}
```

**Fix needed**: Also add this error handling in `triggerBatchedSync` method

#### 1.5 Message Protocol Inconsistency
**Component**: Extension  
**Impact**: Popup may show errors or blank window list  
**Bug**: Popup expects `titles` in response but MessageHandler never sends them

```typescript
case MessageType.GET_TRACKED_WINDOWS:
  const windowIds = await this.windowTracker.getTrackedWindows();
  return { windowIds };  // Remove titles expectation from popup
```

#### 1.6 Initial Sync Data Loss
**Component**: Server  
**Impact**: New clients silently lose tabs > 100

```rust
if request.since_clock.is_none() {
    // Option 1: Send CRDT state snapshot
    let doc = crdt_manager.get_document("default")?;
    let state_vector = doc.encode_state_as_update();

    return Ok(SyncResponse {
        state_snapshot: Some(base64::encode(state_vector)),
        operations: vec![],
        server_clock: clock.current(),
    });
}
```

## 🔒 Priority 2: Security Vulnerabilities

### 2.1 Wide-Open CORS Configuration (Server)
**All reviews agree**: `CorsLayer::permissive()` is a security hole

```rust
// FIXED - Proper configuration
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

### 2.2 Content Security Policy (Extension)
**Required for AMO submission**:
```json
// manifest.json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self';"
  }
}
```

### 2.3 Input Validation & DOS Prevention (Server)
```rust
const MAX_OPERATIONS_PER_REQUEST: usize = 1000;
const MAX_OPERATION_SIZE: usize = 1_048_576; // 1MB

impl SyncRequest {
    fn validate(&self) -> Result<(), ValidationError> {
        if self.operations.len() > MAX_OPERATIONS_PER_REQUEST {
            return Err(ValidationError::TooManyOperations);
        }
        // Check size of each operation
        Ok(())
    }
}
```

### 2.4 Dynamic Permission Verification (Extension)
**MV3 allows users to revoke permissions**:
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

### 2.5 Rate Limiter Memory Leak (Server)
**Issue**: Cleanup never runs due to logic error  
**Impact**: Unbounded memory growth, eventual OOM

```rust
// BROKEN: now.elapsed() is always ~0
if now.elapsed().as_secs() % 300 == 0

// FIXED:
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

## 🏗️ Priority 3: Data Integrity & Consistency

### 3.1 Database Migrations (Server - UNANIMOUS)
**Every review emphasizes**: Stop using runtime CREATE TABLE

```bash
# Initialize migrations
sqlx migrate add initial_schema

# In migrations/001_initial_schema.sql
CREATE TABLE IF NOT EXISTS operations (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL,
    clock BIGINT NOT NULL,
    data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_operations_sync ON operations(clock) WHERE clock > 0;
CREATE INDEX idx_operations_device ON operations(device_id, clock);

# In main.rs
sqlx::migrate!("./migrations").run(&pool).await?;
```

### 3.2 Idempotency for Network Reliability

**Server-side fix**:
```rust
// Use INSERT OR IGNORE
const INSERT_OPERATION: &str = r#"
    INSERT OR IGNORE INTO operations (id, device_id, clock, data)
    VALUES (?, ?, ?, ?)
"#;

// Treat duplicates as success
match op_repo.store(&op).await {
    Ok(_) => {},
    Err(AppError::Database(e)) if is_unique_violation(&e) => {
        debug!("Duplicate operation ignored: {}", op.id);
    }
    Err(e) => return Err(e),
}
```

### 3.3 Operation ID Collision Prevention (Server)
**Issue**: ID format `{clock}_{device_id}_{targetId}` breaks with underscores

```rust
// Option 1: Use non-printable delimiter
let operation_id = format!("{}\x1F{}\x1F{}", clock, device_id, target_id);

// Option 2: Use composite primary key
CREATE TABLE operations (
    clock BIGINT NOT NULL,
    device_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    operation_data JSON NOT NULL,
    PRIMARY KEY (clock, device_id, target_id)
);
```

### 3.4 CRDT State Materialization (Server)
**Issue**: Operations update in-memory CRDT but not database tables

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

## 🚀 Priority 4: Performance Optimizations

### 4.1 SQLite Configuration (Server - 5-10x improvement)
```rust
// After opening connection
sqlx::query("PRAGMA journal_mode = WAL").execute(&pool).await?;
sqlx::query("PRAGMA synchronous = NORMAL").execute(&pool).await?;
sqlx::query("PRAGMA cache_size = -64000").execute(&pool).await?;
sqlx::query("PRAGMA mmap_size = 268435456").execute(&pool).await?;
sqlx::query("PRAGMA temp_store = MEMORY").execute(&pool).await?;
```

### 4.2 Debounce Tab Events (Extension - 50% reduction)
```typescript
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

class TabEventHandler {
  private pendingOperations = new Map<string, CrdtOperation>();

  private flushOperations = debounce(async () => {
    if (this.pendingOperations.size === 0) return;

    const operations = Array.from(this.pendingOperations.values());
    this.pendingOperations.clear();

    // Queue operations individually
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

### 4.3 Batch Database Operations (Server)
```rust
pub async fn store_operations_batch(&self, operations: &[Operation]) -> Result<()> {
    if operations.is_empty() {
        return Ok(());
    }

    let mut tx = self.pool.begin().await?;

    // Build batch insert
    let placeholders: Vec<String> = operations
        .iter()
        .map(|_| "(?, ?, ?, ?)")
        .collect();

    let query = format!(
        "INSERT OR IGNORE INTO operations (id, device_id, clock, data) VALUES {}",
        placeholders.join(", ")
    );

    let mut query_builder = sqlx::query(&query);

    for op in operations {
        query_builder = query_builder
            .bind(&op.id)
            .bind(&op.device_id)
            .bind(op.clock)
            .bind(serde_json::to_string(&op.data)?);
    }

    query_builder.execute(&mut tx).await?;
    tx.commit().await?;
    Ok(())
}
```

### 4.4 Query Optimization (Server)
```rust
// Better index usage
CREATE INDEX idx_operations_sync ON operations(clock) WHERE clock > 0;

// Direct count query instead of fetching rows
let count = sqlx::query_scalar!(
    "SELECT COUNT(*) FROM operations WHERE device_id != ?",
    device_id
)
.fetch_one(pool)
.await?;

// Query in correct order (not DESC then reverse)
SELECT * FROM operations
WHERE clock > ?
ORDER BY clock ASC
LIMIT ?
```

## 📊 Priority 5: Monitoring & Measurement

### Performance Monitoring (Extension)
```typescript
class SyncManager {
  private performanceMetrics = {
    syncDurations: [],
    memoryUsage: [],
    queueSizes: []
  };

  async sync() {
    const start = performance.now();

    try {
      await this.performSync();

      const duration = performance.now() - start;
      this.trackPerformance(duration);

      if (duration > 10) {  // 10ms target
        console.warn(`Sync exceeded target: ${duration}ms`);
      }
    } catch (error) {
      // Existing error handling
    }
  }

  private trackPerformance(duration: number) {
    this.performanceMetrics.syncDurations.push(duration);

    // Calculate P95 periodically
    if (this.performanceMetrics.syncDurations.length % 100 === 0) {
      this.logP95Metrics();
    }
  }
}
```

### Memory Budget Constants (Extension)
```typescript
const MEMORY_BUDGET = {
  BACKGROUND_SCRIPT: 50 * 1024 * 1024,  // 50MB
  OPERATION_QUEUE: 5 * 1024 * 1024,     // 5MB
  WARNING_THRESHOLD: 0.8  // Warn at 80% usage
};
```

## 🛡️ Priority 6: Robustness & Resilience

### 6.1 Worker Lifecycle Management (Extension)
**Why**: Prevent worker leaks on extension reload
```typescript
class WorkerManager {
  private worker: Worker | null = null;

  constructor() {
    if (browser.runtime?.onSuspend) {
      browser.runtime.onSuspend.addListener(() => this.cleanup());
    }
  }

  cleanup() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
```

### 6.2 Enhanced Exponential Backoff with Jitter (Extension)
**Why**: Prevents thundering herd when multiple clients reconnect
```typescript
async function exponentialBackoffWithJitter(
  fn: () => Promise<any>,
  attempt: number
): Promise<any> {
  const baseDelay = Math.min(5000 * Math.pow(2, attempt), 60000);
  const jitter = Math.random() * 0.1 * baseDelay; // 10% jitter

  await new Promise(resolve =>
    setTimeout(resolve, baseDelay + jitter)
  );

  return fn();
}
```

### 6.3 Online/Offline Queue Management (Extension)
**Why**: Better UX during network interruptions
```typescript
class OfflineQueueManager {
  constructor(private syncManager: SyncManager) {
    window.addEventListener('online', async () => {
      console.log('Connection restored, syncing...');
      await this.syncManager.syncNow();
    });

    window.addEventListener('offline', () => {
      console.log('Connection lost, queueing operations...');
    });
  }
}
```

### 6.4 Centralize Configuration (Extension)
**Why**: Remove magic numbers
```typescript
export const SYNC_CONFIG = {
  intervals: {
    active: 1000,    // 1s when active
    idle: 10000,     // 10s when idle
    error: 5000,     // 5s base error backoff
  },
  batching: {
    debounceMs: 300,
    maxBatchSize: 100,
  },
  thresholds: {
    queueSize: 50,
    maxQueueSize: 1000,
  },
} as const;
```

## 🔧 Priority 7: Code Organization

### 7.1 Extract TabOperations from SyncManager (Extension)
**Why**: SyncManager is 500+ lines, doing too much

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
      // ... other operations
      default:
        return err(ErrorFactories.invalidData(`Unknown operation type`));
    }
  }
}

// Simplified SyncManager focuses on sync orchestration only
class SyncManagerWithWorker {
  constructor(
    private tabOperations: TabOperationsService,  // Injected
    private api: TanakaAPI,
    private worker: CrdtWorkerClient
  ) {}
}
```

### 7.2 Standardize Error Handling
**Use Result pattern consistently**:
```typescript
import { Result, ok, err } from 'neverthrow';
import { ExtensionError, ErrorFactories } from '../error/types';

// Convert all async operations to return Result
async function syncTabs(): Promise<Result<void, SyncError>> {
  // No try/catch, use Result throughout
  const validationResult = validateSync();
  if (validationResult.isErr()) {
    return err(validationResult.error);
  }

  const syncResult = await performSync();
  return syncResult;
}
```

### 7.3 Service Layer Consistency (Server)
**Route everything through services**:
```rust
// Before: Handler does everything
async fn sync_handler(
    State((crdt_manager, pool)): State<(Arc<CrdtManager>, SqlitePool)>,
    // ... lots of logic
) -> Result<Json<SyncResponse>>

// After: Handler delegates to service
async fn sync_handler(
    State(container): State<Arc<ServiceContainer>>,
    auth: AuthContext,
    Json(request): Json<SyncRequest>,
) -> Result<Json<SyncResponse>> {
    container.sync_service
        .sync(request, auth)
        .await
        .map(Json)
}
```

### 7.4 Add Runtime Validation for External Data (Extension)
**Why**: API responses not validated
**Fix**: Use Zod for external boundaries only
```typescript
import { z } from 'zod';

// Validate API responses with Zod discriminated unions
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

    // Validate external data
    const parseResult = SyncResponseSchema.safeParse(data);
    if (!parseResult.success) {
      return err(ErrorFactories.invalidData('Invalid response format'));
    }

    return ok(parseResult.data);
  }
}
```

## 🧪 Priority 8: Testing Strategy

### Integration Tests (80% focus)
Test actual sync behavior across both components:

```rust
#[tokio::test]
async fn test_multi_device_sync() {
    let app = setup_test_app().await;

    // Device 1 creates tabs
    let device1_response = sync_request(&app, "device-1", vec![
        create_tab_op("tab1", "https://example.com"),
    ]).await;

    // Device 2 should receive them
    let device2_response = sync_request(&app, "device-2", vec![]).await;
    assert_eq!(device2_response.operations.len(), 1);

    // Device 1 shouldn't receive its own operations back
    let device1_update = sync_request(&app, "device-1", vec![]).await;
    assert_eq!(device1_update.operations.len(), 0);
}
```

### Key Test Scenarios
- **Performance**: Sync 200 tabs in <10ms
- **Stress Test**: Dev command to generate 200+ tabs
- **CRDT Convergence**: Operations converge regardless of order
- **Network Reliability**: Retries succeed idempotently
- **Memory Limits**: Stay under 50MB with heavy usage

## 🔮 Future Optimizations (Only If Monitoring Shows Need)

### Data-Driven Optimizations
These should ONLY be implemented if monitoring proves they're needed:

#### Loro CRDT (Extension)
**Consider if**: Memory usage exceeds 50MB with 200+ tabs  
**Benefit**: 10x memory reduction vs Yjs  
**Cost**: Migration complexity, testing effort

#### SharedArrayBuffer (Extension)
**Consider if**: Worker message serialization takes >1ms  
**Benefit**: Zero-copy communication with worker  
**Cost**: Requires cross-origin isolation headers

#### Advanced Batching (Server)
**Consider if**: Database write latency >5ms with batches  
**Benefit**: Further reduced DB load  
**Cost**: More complex error handling

#### Bundle Optimization (Extension)
**Consider if**: Bundle size exceeds 1MB  
**Current size**: Check with `pnpm run analyze`
```typescript
// rspack.config.ts additions if needed
export default defineConfig({
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
        },
      },
    },
  },
});
```

## ❌ Things to AVOID (Consolidated)

### Authentication & Security Over-Engineering
- ❌ JWT tokens with refresh - shared token is fine
- ❌ OAuth flows - unnecessary complexity
- ❌ User accounts - it's personal software
- ❌ Multi-level encryption - single layer sufficient
- ❌ CSRF protection - not applicable to WebExtension

### Architectural Astronautics
- ❌ Microservices - it's literally one service
- ❌ CQRS/Event Sourcing - massive overkill
- ❌ Full DDD with aggregates - CRDT is your aggregate
- ❌ Repository interfaces everywhere - SQLite isn't going anywhere
- ❌ Interface explosion (ISyncRepository, IOperationQueue, etc.)
- ❌ Strict Clean Architecture layers - this is a browser extension
- ❌ Event Bus Pattern - browser's messaging is sufficient

### Premature Optimizations
- ❌ Redis caching - in-memory is fine
- ❌ Custom CRDT implementations - use proven libraries
- ❌ Distributed systems patterns - you have 2-3 devices
- ❌ Worker pools - one worker is sufficient
- ❌ SharedArrayBuffer - only if serialization >1ms
- ❌ Aggressive code splitting - current bundle reasonable
- ❌ requestIdleCallback everything - only for non-critical

### Over-Engineering Monitoring
- ❌ Prometheus + Grafana - log file is enough
- ❌ OpenTelemetry - just use debug! statements
- ❌ Distributed tracing - it's one server
- ❌ Complex health checks - systemd handles this

### Excessive Testing
- ❌ 100% code coverage mandate
- ❌ Property testing everything
- ❌ Load testing for millions of users
- ❌ Chaos engineering
- ❌ Fuzzing everything

### Library & Tool Overkill
- ❌ fp-ts library - neverthrow is simpler
- ❌ MobX state management - Preact Signals works
- ❌ Webpack migration - Rspack is superior
- ❌ JSDoc everywhere - TypeScript provides types

## 📋 Implementation Roadmap

### Time Investment Summary
- **Phase 1 (Emergency)**: 12 hours - Make it work
- **Phase 2 (Data Integrity)**: 13.5 hours - Make it safe  
- **Phase 3 (Performance)**: 10.5 hours - Make it fast
- **Phase 4 (Code Quality)**: 16 hours - Make it clean
- **Total**: ~52 hours (6-7 days of focused work)

### Phase 1: Emergency Fixes (THIS WEEK)
Fix showstopper bugs that prevent basic functionality:

1. **Fix device ID authentication** (2 hours) - WITHOUT THIS, NOTHING WORKS
2. **Implement state persistence on restart** (4 hours) - Data loss unacceptable
3. **Fix Lamport clock atomicity (server)** (1 hour) - Prevents corruption
4. **Fix queue threshold (extension)** (1 hour) - Users wait 10s
5. **Fix initial sync truncation** (2 hours) - Silent data loss
6. **Fix rate limiter memory leak** (1 hour) - Will OOM
7. **Fix CORS configuration** (1 hour) - Security hole

**Estimated**: 12 hours total

### Phase 2: Data Integrity (NEXT WEEK)
Ensure data consistency and reliability:

1. **Add SQLx migrations** (2 hours)
2. **Fix operation ID format** (1 hour)
3. **Add idempotency** (2 hours)
4. **Add input validation limits** (1 hour)
5. **Ensure transactional consistency** (4 hours)
6. **Fix materialized state updates** (3 hours)
7. **Add CSP to manifest.json** (30 minutes)

**Estimated**: 13.5 hours total

### Phase 3: Performance & Monitoring (FOLLOWING WEEK)
Measure and optimize based on data:

1. **Add performance monitoring (both sides)** (4 hours)
2. **Apply SQLite optimizations** (30 minutes)
3. **Implement batch operations** (2 hours)
4. **Add tab event debouncing** (2 hours)
5. **Add memory tracking** (2 hours)

**Estimated**: 10.5 hours total

### Phase 4: Code Quality & Testing
Improve maintainability:

1. **Extract TabOperations service** (3 hours)
2. **Standardize error handling** (4 hours)
3. **Add multi-device integration tests** (4 hours)
4. **Add CRDT convergence tests** (2 hours)
5. **Consolidate service layer usage** (3 hours)

**Estimated**: 16 hours total

## 🎯 Success Criteria

Tanaka works correctly when:

### Functionality
- [x] Lamport clock dual increment fixed (extension)
- [ ] Multiple Firefox instances can sync tabs using same server
- [ ] Server restarts don't lose data
- [ ] Operations applied in correct order
- [ ] New devices receive complete state
- [ ] Sync happens within 1s during activity

### Performance
- [ ] P95 sync latency ≤ 10ms (verified via monitoring)
- [ ] Memory usage <50MB with 200+ tabs
- [ ] Tab updates debounced (50% reduction in sync calls)
- [ ] Batch operations reduce DB load

### Security & Reliability
- [ ] CORS properly configured
- [ ] Input validation prevents DOS
- [ ] Network retries succeed idempotently
- [ ] CSP compliant for AMO submission

### Code Quality
- [ ] SyncManager reduced from 500+ to <300 lines
- [ ] All async functions return Result<T, E>
- [ ] External API responses validated
- [ ] No test coverage regression

## 📋 Concrete Action Items

### Do Now (Bugs)
1. [ ] Fix device ID authentication bug - multi-device sync is impossible
2. [ ] Implement server state persistence - data loss on restart
3. [ ] Fix queue threshold bug - users wait 10s for syncs
4. [ ] Fix message protocol - popup shows errors
5. [ ] Fix rate limiter memory leak - will OOM
6. [ ] Add CSP to manifest.json - AMO requirement

### Do Next (Security & Data)
1. [ ] Fix CORS configuration - security vulnerability
2. [ ] Add SQLx migrations - can't evolve schema
3. [ ] Add input validation limits - DOS prevention
4. [ ] Implement idempotency - network reliability

### Do Later (Measure First)
1. [ ] Add performance monitoring - can't optimize without data
2. [ ] Add memory tracking - know when approaching 50MB
3. [ ] Add P95 latency logging - verify <10ms target

### Do Only If Needed (Based on Data)
- Debounce tab events if seeing >100 sync calls/minute
- Extract TabOperations if SyncManager >600 lines
- Add Loro CRDT if memory actually exceeds 50MB
- Consider SharedArrayBuffer if worker messages >1ms

## 💡 Key Takeaway

**Tanaka is currently unusable for its primary purpose**. The device ID bug means users can't sync between devices at all. Combined with data loss on restart and other critical bugs, the priority must be:

1. **Make it work** (fix showstopper bugs)
2. **Make it safe** (data integrity, security)
3. **Make it fast** (only after measuring)
4. **Make it clean** (refactoring comes last)

The most valuable reviews (ChatGPT Deep Research for server, pragmatic extension review) focused on **actual user impact** rather than architectural purity. That's the right approach for personal software.

**No premature optimization. Fix bugs → Add monitoring → Optimize based on real data.**
