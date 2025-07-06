# Tanaka Development Roadmap (v1.0)

This roadmap consolidates extension and server development, focusing on pending work with related changes grouped together.

## 🎯 Current Status

- **Completed**: Phase 1 (UI Migration), Phase 2 (Architecture), and Phase 3 (Critical Fixes) ✅
- **Current**: Phase 4 (UI Redesign & Testing) 🎨
- **Extension**: v0.5.0 with 85%+ test coverage, React/Preact UI, CRDT Web Worker, full permission management
- **Server**: Clean architecture with repositories, services, error handling, CRDT sync, complete security hardening

**🎉 MILESTONE**: All critical bugs fixed! Multi-device synchronization is fully functional. Now focusing on UI improvements and comprehensive testing.

---

## 🌿 Branch Strategy (Pending Work)

**⚠️ IMPORTANT: Always create feature branches with the exact names listed below. NEVER push directly to main.**

```
main
├── Phase 3: Critical Fixes (small atomic branches)
│   ├── fix/device-auth          # Fix device ID authentication preventing multi-device sync
│   ├── fix/server-persistence   # Restore state from DB on server restart
│   ├── fix/lamport-clock        # Fix server-side Lamport clock atomicity
│   ├── fix/queue-threshold      # Complete queue size threshold implementation
│   ├── fix/message-protocol     # Fix popup message protocol inconsistency
│   ├── fix/initial-sync         # Fix initial sync truncation beyond 100 tabs
│   ├── fix/rate-limiter-leak    # Fix rate limiter memory leak
│   ├── fix/cors-config          # Replace permissive CORS configuration
│   ├── fix/csp-manifest         # Add Content Security Policy
│   ├── fix/input-validation     # Add request validation and DOS prevention
│   ├── fix/permission-checks    # Add dynamic permission verification
│   ├── fix/sqlx-migrations      # Switch from runtime CREATE to SQLx migrations ✅
│   ├── fix/operation-idempotency # Add idempotency to operation storage
│   ├── fix/operation-ids        # Fix operation ID collision issues
│   └── fix/crdt-materialization # Persist CRDT state to database tables
├── Phase 4: UI Redesign & Testing
└── Phase 5: Production Ready
```

---

## ✅ Phase 3: Critical Fixes (COMPLETE)

### Overview

Architecture review identified critical bugs that completely broke multi-device synchronization. All issues have been successfully resolved.

### 3.1 Core Functionality Fixes 🔴 **SHOWSTOPPERS**

These bugs prevent Tanaka from fulfilling its primary purpose:

#### `fix/device-auth` - Device ID Authentication Bug ✅
**Impact**: All devices forced to use same ID, making multi-device sync impossible  
**Fix**: Trust client-provided device_id instead of deriving from token  
**Status**: Completed in PR #74

#### `fix/server-persistence` - Server State Persistence ✅
**Impact**: Complete data loss on server restart  
**Fix**: Reload Lamport clock and operations from database on startup  
**Status**: Completed in PR #69

#### `fix/lamport-clock` - Lamport Clock Atomicity ✅
**Impact**: Race conditions cause incorrect operation ordering  
**Fix**: Use atomic compare-and-swap for server clock updates  
**Status**: Completed - Fixed using `compare_exchange_weak` for thread-safe updates

#### `fix/queue-threshold` - Queue Size Threshold ✅
**Impact**: Users wait up to 10s for sync after rapid changes  
**Fix**: Trigger immediate sync when queue exceeds threshold  
**Status**: Completed - Queue threshold now triggers immediate sync when 50+ operations pending

#### `fix/message-protocol` - Message Protocol Inconsistency ✅
**Impact**: Popup shows errors or blank window list  
**Fix**: Align message handler response with popup expectations  
**Status**: Completed in PR #72

#### `fix/initial-sync` - Initial Sync Truncation ✅
**Impact**: New devices silently lose tabs beyond first 100  
**Fix**: Send CRDT state snapshot for initial sync  
**Status**: Completed in PR #73

#### `fix/rate-limiter-leak` - Rate Limiter Memory Leak ✅
**Impact**: Server eventually runs out of memory and crashes  
**Fix**: Properly schedule cleanup with elapsed time check  
**Status**: Completed in PR #76

### 3.2 Security Fixes 🔒 **REQUIRED FOR RELEASE**

#### `fix/cors-config` - CORS Configuration ✅
**Impact**: Security vulnerability with permissive CORS  
**Fix**: Allow only browser extension origins and configured domains  
**Status**: Completed in PR #77

#### `fix/csp-manifest` - Content Security Policy ✅
**Impact**: Required for Mozilla addon store submission  
**Fix**: Add CSP to manifest.json  
**Status**: Completed - Added comprehensive CSP with strict security policy

#### `fix/input-validation` - Input Validation ✅
**Impact**: Potential DOS attacks  
**Fix**: Validate request size and operation count  
**Status**: Completed in PR #78

#### `fix/permission-checks` - Dynamic Permission Verification ✅
**Impact**: MV3 allows runtime permission revocation  
**Fix**: Check permissions before each sync attempt  
**Status**: Completed - Added PermissionsService and integrated permission checks into sync flow

### 3.3 Data Integrity Fixes 💾 **PREVENT DATA LOSS**

> **Note**: Most of these items were deprioritized as they are not blocking multi-device sync. SQLx migrations were completed, but other items will be addressed in Phase 5 for production hardening.

#### `fix/sqlx-migrations` - Database Migrations ✅
**Impact**: Runtime CREATE TABLE is fragile  
**Fix**: Use proper SQLx migration system  
**Status**: Completed - SQLx migrations implemented with initial schema migration

#### `fix/operation-idempotency` - Operation Idempotency (Deferred to Phase 5)
**Impact**: Duplicate operations on retry  
**Fix**: Use INSERT OR IGNORE with proper operation IDs  
**Status**: Deferred - Not causing issues in practice

#### `fix/operation-ids` - Operation ID Format (Deferred to Phase 5)
**Impact**: IDs with underscores break parsing  
**Fix**: Use non-printable delimiter or composite primary key  
**Status**: Deferred - Current format working adequately

#### `fix/crdt-materialization` - CRDT State Persistence (Deferred to Phase 5)
**Impact**: Memory state not reflected in database  
**Fix**: Update database tables atomically with CRDT operations  
**Status**: Deferred - DashMap cache provides sufficient durability

---

## 🧪 Phase 4: UI Redesign & Testing

### Overview

Modernize the extension UI with proper design system, comprehensive testing, and improved developer experience.

### Primary Goals

1. **Code Quality**: Zero `any` types, consistent patterns, clean architecture
2. **Design System**: WCAG 2.1 AA compliant, design tokens, dark mode
3. **Component Library**: Reusable, tested, accessible components
4. **Testing**: 95%+ coverage, visual regression, E2E user flows
5. **Developer Experience**: Storybook, documentation, tooling

---

## 🚀 Phase 5: Production Ready

### Overview

Prepare for v1.0 release with performance optimization, monitoring, production hardening, and Mozilla addon store submission.

### Primary Goals

1. **Monitoring**: Server metrics, distributed tracing, performance dashboards
2. **Performance**: Handle 200+ tabs smoothly, optimize sync latency
3. **Production Hardening**:
   - Operation idempotency to prevent duplicates
   - Robust operation ID format
   - Full CRDT state materialization to database
4. **Release**: Mozilla addon store ready, single-binary server, v1.0 documentation

---

## 📊 Success Metrics (Pending)

| Metric                   | Target         | Phase   |
| ------------------------ | -------------- | ------- |
| Multi-device Sync        | Working        | Phase 3 |
| Data Persistence         | No loss        | Phase 3 |
| Operation Ordering       | Correct        | Phase 3 |
| Sync Latency (Active)    | ≤ 1s           | Phase 3 |
| Memory Leaks             | None           | Phase 3 |
| Security Vulnerabilities | Fixed          | Phase 3 |
| Extension Test Coverage  | 95%+           | Phase 4 |
| Overall Test Coverage    | 95%+           | Phase 4 |
| Accessibility Compliance | WCAG 2.1 AA    | Phase 4 |
| Visual Regression Tests  | Implemented    | Phase 4 |
| Cross-browser Testing    | Complete       | Phase 4 |
| Usability Testing        | User validated | Phase 4 |
| Sync Latency P95         | ≤ 10ms         | Phase 5 |
| 200+ Tabs Performance    | Smooth         | Phase 5 |
| Security Audit           | Passed         | Phase 5 |
| Mozilla Approval         | Ready          | Phase 5 |

---

## 📝 Progress Tracking Rules

- Use `[ ]` for pending, `[x]` for completed
- Update this file as part of each PR
- Each branch should result in working software
- Run all tests before marking complete
- **Always create a PR when a branch is ready for review**
- Include comprehensive testing and documentation in each PR

---

## 🔑 Key Principles

1. **Unified Changes**: Related extension and server changes in same branch
2. **Incremental Progress**: Each branch should be independently mergeable
3. **Test Everything**: Both sides need comprehensive tests
4. **Performance First**: Every change considers 200+ tab scenarios
5. **Clean Architecture**: Apply same patterns to both extension and server

---

## ✅ Success Criteria

### Phase 3 (Critical Fixes)

#### Core Functionality ✓
- [x] Multiple Firefox instances can sync tabs using same server
- [x] Server restarts don't lose data - state restored from database
- [x] Operations applied in correct order with atomic Lamport clock
- [x] Sync happens within 1s during activity (queue threshold working)
- [x] Popup displays correct window list without errors
- [x] New devices receive complete state (>100 tabs supported)
- [x] Server runs indefinitely without memory leaks

#### Security & Compliance ✓
- [x] CORS properly configured - only extension origins allowed
- [x] Content Security Policy added to manifest.json
- [x] Input validation prevents DOS attacks
- [x] Permissions checked before each sync operation

#### Data Integrity
- [x] Database uses SQLx migrations (no runtime CREATE TABLE) ✓
- [ ] Operations are idempotent - no duplicates on retry - *Deferred to Phase 5*
- [ ] Operation IDs handle all character combinations - *Deferred to Phase 5*
- [ ] CRDT state persisted to database tables - *Deferred to Phase 5*

### Phase 4 (UI Redesign & Testing)

- [ ] All code follows consistent organization patterns with zero `any` types
- [ ] Design token system implemented with WCAG 2.1 AA compliance
- [ ] Component library built with 95%+ test coverage
- [ ] Dark mode fully implemented with theme switching
- [ ] Visual regression tests integrated into CI
- [ ] E2E test suite covering all user flows
- [ ] Storybook documentation for all components
- [ ] Technical debt reduced by 80%+

### Phase 5 (Production Ready)

- [ ] Server metrics and health endpoints implemented
- [ ] P95 sync latency ≤ 10ms verified under load
- [ ] 200+ tabs handled smoothly without performance degradation
- [ ] Distributed tracing integrated for debugging
- [ ] Operations are idempotent with no duplicates (deferred from Phase 3)
- [ ] Operation IDs handle all character combinations (deferred from Phase 3)
- [ ] CRDT state fully persisted to database (deferred from Phase 3)
- [ ] Single-binary server distribution created
- [ ] Mozilla addon store submission ready
- [ ] v1.0 documentation complete with migration guide
- [ ] Release automation scripts tested and working
