# Tanaka Development Roadmap (v1.0)

This roadmap consolidates extension and server development, focusing on pending work with related changes grouped together.

## 🎯 Current Status

- **Completed**: Phase 1 (UI Migration), Phase 2 (Architecture), and Phase 3 (Critical Fixes) ✅
- **Current**: Phase 4 (Baseline & Architecture) 📊
- **Extension**: v0.5.0 with 85%+ test coverage, React/Preact UI, CRDT Web Worker, full permission management
- **Server**: Clean architecture with repositories, services, error handling, CRDT sync, complete security hardening

**🎉 MILESTONE**: All critical bugs fixed! Multi-device synchronization is fully functional. Now establishing baselines and architectural decisions before quality improvements.

---

## 🌿 Branch Strategy (Pending Work)

**⚠️ IMPORTANT: Always create feature branches with the exact names listed below. NEVER push directly to main.**

```
main
├── Phase 4: Baseline & Architecture (CURRENT)
├── Phase 5: Core Stability
├── Phase 6: Polish & Production
└── Phase 7: Production Ready
```

---

## ✅ Phase 3: Critical Fixes (COMPLETE)

Fixed all critical bugs preventing multi-device sync (PRs #69-#80). SQLx migrations implemented. Three data integrity items deferred to Phase 5.

---

## 📊 Phase 4: Baseline & Architecture

### Overview

Before implementing improvements, we need to establish clear baselines and document key architectural decisions. This phase ensures we can measure progress and have a solid foundation for future work.

### Primary Goals

1. **Baseline Metrics Collection**
   - Measure current performance characteristics
   - Document memory usage patterns
   - Establish network call frequency
   - Create reproducible benchmarks

2. **Architectural Decisions**
   - Document CRDT library rationale
   - Define state management strategy
   - Establish API versioning approach
   - Create deployment strategy

3. **Operational Readiness**
   - Define rollback procedures
   - Create incident response playbooks
   - Establish monitoring thresholds
   - Document backup/restore procedures

### Implementation Tasks

#### 🔧 Branch: `feat/baseline-metrics`
**Establish Performance Baselines**

- [ ] Measure current sync latency (P50, P95, P99)
  - Create automated benchmark suite
  - Test with 10, 50, 100, 200+ tabs
  - Document results in metrics/baseline.md
- [ ] Profile memory usage patterns
  - 24-hour memory usage tracking
  - Identify growth patterns
  - Document heap snapshot analysis
- [ ] Count network calls per user action
  - Track all API calls during typical usage
  - Measure payload sizes
  - Document call frequency by operation type
- [ ] Document operation processing time
  - Time each CRDT operation type
  - Measure queue processing speed
  - Create performance budget

#### 📐 Branch: `docs/architecture-decisions`
**Document Key Architecture Decisions**

- [ ] Create ADR-001: CRDT Library Selection
  - Why Yjs over alternatives
  - Performance implications
  - Future migration considerations
- [ ] Create ADR-002: State Management Strategy
  - browser.storage.local limitations
  - Scaling considerations
  - State size projections
- [ ] Create ADR-003: Worker Thread Strategy
  - Fallback handling
  - Message passing overhead
  - Browser compatibility
- [ ] Create ADR-004: API Versioning
  - Protocol evolution strategy
  - Backward compatibility approach
  - Client-server version negotiation

#### 🚀 Branch: `docs/operational-runbook`
**Create Operational Documentation**

- [ ] Write deployment procedures
  - Blue-green deployment strategy
  - Rollback procedures
  - Version compatibility matrix
- [ ] Create incident response playbook
  - Alert thresholds
  - Escalation procedures
  - Common issues and fixes
- [ ] Document data migration strategy
  - Upgrade procedures
  - Data compatibility
  - Rollback data handling
- [ ] Establish monitoring guidelines
  - Key metrics to track
  - Alert configuration
  - Dashboard setup

### Success Criteria

- [ ] All baseline metrics documented and reproducible
- [ ] Architecture decisions documented in ADR format
- [ ] Operational runbook reviewed and tested
- [ ] Performance budgets established
- [ ] Team aligned on architectural direction

---

## 🧪 Phase 5: Core Stability

### Overview

Phase 5 focuses on core stability improvements that directly impact reliability and performance. With baselines established in Phase 4, we can now measure the impact of our improvements.

This phase addresses critical technical debt in three key areas: memory management, performance optimization, and error resilience. We implement only the most essential improvements that block v1.0.

**Key Focus Areas:**

1. **Memory Management**: Fix identified leaks and implement proper cleanup
2. **Performance**: Optimize for 200+ tab scenarios with batching and caching
3. **Resilience**: Build robust error recovery and offline support

### Primary Goals

1. **Memory Management**: Fix critical leaks and implement proper cleanup
   - Fix all identified memory leaks in event handlers
   - Implement AbortController pattern for cleanup
   - Add proper disposal in destructors
   - No growing memory leaks over 24-hour usage

2. **Performance Optimization**: Handle 200+ tabs smoothly
   - Implement operation batching with deduplication
   - Optimize database indices and queries
   - Reduce network calls by 70%+ through batching
   - Target sub-100ms sync latency for P95

3. **Error Resilience**: Graceful handling of failures
   - Implement exponential backoff with jitter
   - Add circuit breaker for cascading failures
   - Create offline operation queue
   - Ensure recovery from extended outages

### Dependencies & Prerequisites

Before starting Phase 5, ensure:

1. **Phase 4 Complete**:
   - Baseline metrics collected and documented
   - Architecture decisions recorded
   - Operational runbook created
   - Performance budgets defined
2. **Development Environment**:
   - Node.js 24+, pnpm 10.11+, Rust 1.83+
   - SQLx CLI for database migrations
   - cargo-nextest and cargo-llvm-cov for testing
3. **Testing Infrastructure**:
   - Unit test framework operational
   - CI/CD pipeline running all checks
   - Pre-commit hooks installed and working
   - Benchmark suite ready

### Sub-phases

Phase 5 is organized into 3 focused sub-phases:

#### Phase 5.1: Memory & Performance
**Focus**: Fix critical memory leaks and implement performance optimizations
- Branch: `fix/memory-and-event-handling`
- Branch: `feat/operation-batching`
- Establishes stable foundation for further improvements

#### Phase 5.2: Resilience
**Focus**: Build robust error handling and recovery mechanisms
- Branch: `feat/error-recovery`
- Ensures application continues working under adverse conditions

#### Phase 5.3: Basic Security
**Focus**: Implement essential security measures
- Branch: `feat/input-validation`
- Basic input validation and sanitization only

### Implementation Notes

**⚠️ Avoid These Anti-patterns from Analysis:**
- ❌ WeakMap for window tracking - would cause immediate garbage collection
- ❌ Token encryption with key in same storage - provides no security benefit
- ❌ Complex request signing - over-engineered for personal use application
- ❌ Overly complex worker message types - violates DRY principle
- ✅ Focus on real improvements: memory leaks, performance, error handling

### Implementation Branches

#### 🔧 Branch: `fix/memory-and-event-handling`
**Memory Management & Event Handler Improvements**

- [ ] Extension: Implement AbortController pattern for all event listeners in TabEventHandler
  - Store listeners in Map for cleanup tracking
  - Add abort signal support to all browser event listeners
  - Execute cleanup functions on abort signal
- [ ] Extension: Add proper cleanup in destructors/dispose methods
  - Clear all timers in cleanup methods
  - Remove all event listeners explicitly
  - Add debugLog for cleanup confirmation
- [ ] Extension: Fix TabEventHandler missing listeners (onActivated, windowRemoved)
  - Currently missing proper cleanup for these events
  - Add to listeners Map and cleanup functions array
- [ ] Extension: Replace current tracking with proper strong references
  - Current weak reference approach is flawed
  - Maintain Set<number> for tracked windows with proper cleanup
- [ ] Server: Switch from Mutex to RwLock in CrdtManager for better concurrency
  - Use parking_lot::RwLock for better performance
  - Read locks for queries, write locks for mutations
  - Reduces lock contention under load
- [ ] Tests: Add memory leak detection tests
  - Profile memory usage before/after operations
  - Check for retained references after cleanup
  - Verify all listeners are removed

#### 🚀 Branch: `feat/operation-batching`
**Performance Optimization with Operation Batching**

- [ ] Extension: Implement OperationBatcher with deduplication
  - Max batch size: 100 operations
  - Max batch age: 1 second
  - Deduplication by operation type and target ID
  - Keep only latest operation for same target
- [ ] Extension: Configure priority-based batching delays
  - CRITICAL (close_tab, track/untrack_window): 50ms
  - HIGH (upsert_tab, move_tab): 200ms  
  - NORMAL (set_active, window_focus): 500ms
  - LOW (change_url): 1000ms
- [ ] Server: Add composite database indices
  - idx_crdt_operations_device_clock on (device_id, clock DESC)
  - idx_crdt_operations_created_at on (created_at DESC)
  - idx_crdt_operations_type_target_clock on (operation_type, target_id, clock DESC)
  - idx_crdt_state_active_tabs partial index for active tabs
- [ ] Server: Optimize SQLite configuration
  - Set cache_size to -65536 (64MB)
  - Enable memory-mapped I/O (mmap_size = 256MB)
  - Set page_size to 4096
  - Use NORMAL synchronous mode
  - Schedule VACUUM operations
- [ ] Server: Implement connection pool optimization
  - Min connections: 2, Max connections: configurable
  - Idle timeout: 10 minutes
  - Connection lifetime: 1 hour
  - Test connections before acquire
- [ ] Tests: Performance benchmarks
  - Measure sync latency with 200+ tabs
  - Profile memory usage under load
  - Verify 70%+ reduction in network calls
  - Compare against Phase 4 baselines

#### 🔄 Branch: `feat/error-recovery`
**Enhanced Error Recovery & Resilience**

- [ ] Extension: Implement exponential backoff with jitter
  - Initial delay: 1000ms, max delay: 60000ms
  - Backoff multiplier: 2.0
  - Jitter: ±30% randomization
  - Calculate delay with proper capping
- [ ] Extension: Add circuit breaker pattern for API calls
  - Failure threshold: 5 failures (configurable)
  - Reset timeout: 30 seconds
  - Success threshold: 3 successes to close
  - Half-open state with limited retries
- [ ] Extension: Create offline operation queue
  - Persist operations to browser.storage.local
  - Queue up to 1000 operations
  - Resume on connection restore
  - Priority-based queue processing
- [ ] Server: Implement request timeout handling
  - Configure per-endpoint timeouts
  - Return partial results on timeout
  - Add timeout headers to responses
- [ ] Tests: Failure scenario testing
  - Network failure simulation
  - Timeout testing at various stages
  - Circuit breaker state transitions
  - Recovery from extended outages

#### 🛡️ Branch: `feat/input-validation`
**Basic Security Implementation**

- [ ] Extension: Add basic input validation
  - serverUrlSchema: validate URL format
  - authTokenSchema: min length validation
  - syncRequestSchema: basic structure validation
  - tabDataSchema: max length limits
- [ ] Extension: Implement server URL validation
  - Must use HTTP or HTTPS protocol
  - Allow HTTP for localhost development
  - Reject invalid URL formats
  - Add URL length limits (2048 chars)
- [ ] Server: Add request validation middleware
  - Validate request size limits
  - Check content-type headers
  - Basic schema validation
- [ ] Tests: Input validation tests
  - Boundary value testing
  - Invalid input rejection
  - Error message validation

### Testing Strategy

#### Phase 5.1: Memory & Performance Testing
- **Memory Leak Detection**: Automated heap snapshot comparison
- **Performance Benchmarks**: Compare against Phase 4 baselines
- **Load Tests**: Verify improvements under stress
- **Concurrency Tests**: Multi-device sync scenarios

#### Phase 5.2: Resilience Testing
- **Chaos Testing**: Network failures, timeouts, partial responses
- **Recovery Testing**: Extended outage scenarios
- **Circuit Breaker**: State transition verification
- **Contract Testing**: Extension-server API compatibility

#### Phase 5.3: Security Testing
- **Input Validation**: Basic sanitization tests
- **Dependency Scanning**: Automated vulnerability checks
- **Boundary Testing**: Edge cases for all inputs

### Success Criteria vs Phase 4 Baselines

- Memory usage: No growth over 24 hours (vs current X MB/hour)
- Sync latency P95: <100ms (vs current Y ms)
- Network calls: 70% reduction (vs current Z calls/min)
- Error recovery: 100% recovery from 5-minute outage (vs current failures)
- Security: Zero critical vulnerabilities (vs current scan results)

---

## 🎨 Phase 6: Polish & Production

### Overview

With core stability achieved in Phase 5, we now focus on user experience, code quality, and production readiness. This phase transforms the functional application into a polished product.

### Primary Goals

1. **Code Quality**: Clean architecture and patterns
   - Eliminate TypeScript `any` types
   - Consistent file organization
   - Apply SOLID principles
   - Improve test coverage to 95%+

2. **User Interface**: Accessible and delightful
   - Component library with design tokens
   - Dark mode support
   - WCAG 2.1 AA compliance
   - Loading states and error boundaries

3. **Developer Experience**: Tools and documentation
   - Storybook for components
   - API documentation
   - Debug mode
   - Performance profiling

4. **Security Hardening**: Beyond basics
   - CSP headers
   - Rate limiting strategies
   - Advanced input validation

### Implementation Branches

#### 🎨 Branch: `feat/ui-components`
**Component Library & Design System**

- [ ] Create design token system
- [ ] Build accessible component library
- [ ] Implement dark mode
- [ ] Add loading states and error boundaries
- [ ] Visual regression tests

#### 🔒 Branch: `feat/advanced-security`
**Security Hardening**

- [ ] Implement CSP headers
- [ ] Add rate limiting by operation complexity
- [ ] Enhanced input validation with Zod
- [ ] Security-focused test suite

#### 📊 Branch: `feat/monitoring`
**Observability & Developer Experience**

- [ ] Add performance marks
- [ ] Implement debug mode
- [ ] Create health check endpoints
- [ ] Basic metrics collection
- [ ] Update developer documentation

---

## 🚀 Phase 7: Production Ready

### Overview

Prepare for v1.0 release with final optimizations, production monitoring, and Mozilla addon store submission.

### Primary Goals

1. **Production Monitoring**:
   - Server metrics and dashboards
   - Distributed tracing
   - Alert configuration
   - Performance tracking

2. **Final Optimizations**:
   - Meet all performance budgets
   - Handle 200+ tabs smoothly
   - Optimize for battery life
   - Minimize resource usage

3. **Production Hardening**:
   - Operation idempotency
   - Robust operation ID format
   - Full CRDT state materialization
   - Feature flags for gradual rollout
   - Rollback procedures

4. **Release Preparation**:
   - Mozilla addon store compliance
   - Single-binary server distribution
   - v1.0 documentation
   - Migration guides
   - Public announcement prep

### Implementation Tasks

- [ ] Implement production monitoring suite
- [ ] Pass Mozilla addon review
- [ ] Create installer packages
- [ ] Write migration documentation
- [ ] Performance optimization pass
- [ ] Security audit
- [ ] Load testing at scale
- [ ] Beta testing program

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
| Baseline Metrics         | Documented     | Phase 4 |
| Architecture Decisions   | Documented     | Phase 4 |
| Memory Leaks             | None growing   | Phase 5 |
| Network Call Reduction   | 70%+           | Phase 5 |
| Error Recovery           | 100% from 5min | Phase 5 |
| Extension Test Coverage  | 95%+           | Phase 6 |
| Overall Test Coverage    | 95%+           | Phase 6 |
| Accessibility Compliance | WCAG 2.1 AA    | Phase 6 |
| Visual Regression Tests  | Implemented    | Phase 6 |
| Cross-browser Testing    | Complete       | Phase 6 |
| Usability Testing        | User validated | Phase 6 |
| Sync Latency P95         | ≤ 10ms         | Phase 7 |
| 200+ Tabs Performance    | Smooth         | Phase 7 |
| Security Audit           | Passed         | Phase 7 |
| Mozilla Approval         | Ready          | Phase 7 |

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

## ✅ Phase 4 Completion Criteria

- [ ] All baseline metrics collected and documented
- [ ] Performance budgets established
- [ ] Architecture decisions documented (4+ ADRs)
- [ ] Operational runbook created and reviewed
- [ ] Team aligned on architectural direction

## ✅ Phase 5 Completion Criteria

### Phase 5.1: Memory & Performance
- [ ] No growing memory leaks over 24-hour usage
- [ ] All event listeners properly cleaned up
- [ ] Operation batching reduces network calls by 70%+
- [ ] SQLite optimized with composite indices
- [ ] Sub-100ms sync latency for P95

### Phase 5.2: Resilience
- [ ] Exponential backoff with jitter implemented
- [ ] Circuit breaker prevents cascade failures
- [ ] Offline operation queue persists operations
- [ ] Graceful degradation for failure scenarios
- [ ] Recovery from extended outages tested

### Phase 5.3: Basic Security
- [ ] Basic input validation implemented
- [ ] No critical vulnerabilities in dependency scan
- [ ] Input sanitization for user data

## ✅ Phase 6 Completion Criteria

- [ ] TypeScript strict mode, no `any` types
- [ ] Component library with 95%+ coverage
- [ ] WCAG 2.1 AA compliance verified
- [ ] Visual regression tests in CI
- [ ] Debug mode and monitoring implemented
- [ ] Developer documentation complete

## ✅ Phase 7 Completion Criteria

- [ ] Performance meets all budgets
- [ ] Security audit passed
- [ ] Mozilla addon store requirements met
- [ ] Production monitoring operational
- [ ] v1.0 documentation complete
