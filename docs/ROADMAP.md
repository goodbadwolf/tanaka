# Tanaka Development Roadmap (v1.0)

This roadmap consolidates extension and server development, focusing on pending work with related changes grouped together.

## 🎯 Current Status

- **Completed**: Phase 1 (UI Migration), Phase 2 (Architecture), and Phase 3 (Critical Fixes) ✅
- **Current**: Phase 4 (Quality & Resilience) 🎨
- **Extension**: v0.5.0 with 85%+ test coverage, React/Preact UI, CRDT Web Worker, full permission management
- **Server**: Clean architecture with repositories, services, error handling, CRDT sync, complete security hardening

**🎉 MILESTONE**: All critical bugs fixed! Multi-device synchronization is fully functional. Now focusing on quality improvements, resilience, and production readiness.

---

## 🌿 Branch Strategy (Pending Work)

**⚠️ IMPORTANT: Always create feature branches with the exact names listed below. NEVER push directly to main.**

```
main
├── Phase 4: Quality & Resilience (CURRENT)
└── Phase 5: Production Ready
```

---

## ✅ Phase 3: Critical Fixes (COMPLETE)

Fixed all critical bugs preventing multi-device sync (PRs #69-#80). SQLx migrations implemented. Three data integrity items deferred to Phase 5.

---

## 🧪 Phase 4: Quality & Resilience

### Overview

Phase 4 represents a critical refinement phase where we transform Tanaka from a functional prototype into a polished, production-quality application. With multi-device synchronization now working reliably (Phase 3 complete), we shift focus to user experience, code quality, and long-term maintainability.

This phase addresses technical debt accumulated during rapid feature development while establishing foundations for sustainable growth. We're implementing battle-tested patterns from production systems: proper memory management, resilient error handling, and comprehensive observability.

**Key Transformation Areas:**

1. **From Prototype to Product**: Elevate code quality from "it works" to "it's maintainable, performant, and delightful to use"
2. **From Reactive to Proactive**: Implement monitoring and observability before issues arise in production
3. **From Basic to Accessible**: Ensure the extension is usable by everyone, meeting WCAG 2.1 AA standards
4. **From Fragile to Resilient**: Build in error recovery, offline support, and graceful degradation

### Primary Goals

1. **Code Quality**: Zero `any` types, consistent patterns, clean architecture
   - Eliminate all TypeScript `any` types with proper type definitions
   - Establish consistent file organization (services/, components/, utils/)
   - Implement dependency injection for testability
   - Apply SOLID principles throughout the codebase
   - Document architectural decisions in ADR format

2. **Design System**: WCAG 2.1 AA compliant, design tokens, dark mode
   - Create comprehensive design token system (colors, spacing, typography)
   - Implement CSS custom properties for runtime theming
   - Support system preference detection and manual override
   - Ensure 4.5:1 contrast ratios for normal text, 3:1 for large text
   - Test with screen readers (NVDA, JAWS, VoiceOver)

3. **Component Library**: Reusable, tested, accessible components
   - Build core components: Button, Input, Card, Modal, Toast
   - Implement compound components for complex UI patterns
   - Use React.forwardRef for proper ref handling
   - Include keyboard navigation and ARIA attributes
   - Achieve 100% test coverage for all components

4. **Testing**: 95%+ coverage, visual regression, E2E user flows
   - Unit tests for all business logic and utilities
   - Integration tests for API communication
   - Visual regression tests with Playwright
   - E2E tests for critical user journeys
   - Performance benchmarks for sync operations

5. **Developer Experience**: Storybook, documentation, tooling
   - Storybook for component development and documentation
   - JSDoc comments for all public APIs
   - Automated API documentation generation
   - Development mode with hot reload and debug logging
   - Git hooks for code quality enforcement

6. **Performance & Reliability**: Memory leak fixes, operation batching, error recovery
   - Fix all identified memory leaks in event handlers
   - Implement intelligent operation batching with deduplication
   - Add circuit breaker for API resilience
   - Create offline operation queue with persistence
   - Target sub-100ms sync latency for 95th percentile

7. **Security Hardening**: Input validation, CSP headers, secure configuration
   - Validate all user inputs with Zod schemas
   - Implement Content Security Policy for extension pages
   - Add rate limiting and request size limits
   - Secure storage for sensitive configuration
   - Regular dependency vulnerability scanning

### Dependencies & Prerequisites

Before starting Phase 4, ensure:

1. **Phase 3 Complete**: Multi-device sync working reliably without data loss
2. **Development Environment**:
   - Node.js 24+, pnpm 10.11+, Rust 1.83+
   - SQLx CLI for database migrations
   - cargo-nextest and cargo-llvm-cov for testing
3. **Testing Infrastructure**:
   - Unit test framework operational
   - CI/CD pipeline running all checks
   - Pre-commit hooks installed and working
4. **Baseline Metrics**:
   - Current sync latency measured
   - Memory usage profile documented
   - Network call frequency recorded

### Sub-phases

Phase 4 is organized into 5 incremental sub-phases, each building on the previous:

#### Phase 4.1: Foundation (Memory & Performance)
**Focus**: Fix critical memory leaks and implement performance optimizations
- Branch: `fix/memory-and-event-handling`
- Branch: `feat/operation-batching`
- Establishes stable foundation for further improvements

#### Phase 4.2: Resilience
**Focus**: Build robust error handling and recovery mechanisms
- Branch: `feat/error-recovery`
- Ensures application continues working under adverse conditions

#### Phase 4.3: Security
**Focus**: Harden the application against security vulnerabilities
- Branch: `feat/input-validation`
- Protects user data and prevents malicious inputs

#### Phase 4.4: User Experience
**Focus**: Create polished UI with accessibility and design system
- Branch: `feat/ui-components`
- Delivers delightful, accessible user interface

#### Phase 4.5: Observability
**Focus**: Add monitoring and debugging capabilities
- Branch: `feat/monitoring`
- Enables proactive issue detection and resolution

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
- [ ] Extension: Add operation compression for large payloads
  - Use lz-string for payloads > 1KB
  - Compress/decompress in OperationBatcher
  - Add compression threshold configuration
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
- [ ] Server: Implement connection pool optimization
  - Min connections: 2, Max connections: configurable
  - Idle timeout: 10 minutes
  - Connection lifetime: 1 hour
  - Test connections before acquire
- [ ] Tests: Performance benchmarks
  - Measure sync latency with 200+ tabs
  - Profile memory usage under load
  - Verify 70%+ reduction in network calls

#### 🔄 Branch: `feat/error-recovery`
**Enhanced Error Recovery & Resilience**

- [ ] Extension: Implement exponential backoff with jitter
  - Initial delay: 1000ms, max delay: 60000ms
  - Backoff multiplier: 2.0
  - Jitter: ±30% randomization
  - Calculate delay with proper capping
- [ ] Extension: Add circuit breaker pattern for API calls
  - Failure threshold: 5 failures
  - Reset timeout: 30 seconds
  - Success threshold: 3 successes to close
  - Half-open state with limited retries
- [ ] Extension: Enhance retry mechanism
  - Check abort signals
  - Categorize errors by retryability
  - Different retry strategies per error type
  - Add retry callbacks for monitoring
- [ ] Extension: Create offline operation queue
  - Persist operations to browser.storage.local
  - Queue up to 1000 operations
  - Resume on connection restore
  - Priority-based queue processing
- [ ] Extension: Add partial sync recovery
  - Handle incomplete sync responses
  - Resume from last successful operation
  - Validate partial state consistency
- [ ] Server: Implement request timeout handling
  - Configure per-endpoint timeouts
  - Return partial results on timeout
  - Add timeout headers to responses
- [ ] Server: Add graceful degradation for CRDT operations
  - Fallback to last known good state
  - Return degraded service indicators
  - Queue operations during degradation
- [ ] Tests: Failure scenario testing
  - Network failure simulation
  - Timeout testing at various stages
  - Circuit breaker state transitions
  - Recovery from extended outages

#### 🛡️ Branch: `feat/input-validation`
**Security Hardening with Input Validation**

- [ ] Extension: Add Zod schemas for all API inputs
  - serverUrlSchema: validate URL format, protocol (http/https only)
  - authTokenSchema: min 16 chars, alphanumeric + underscore/dash only
  - syncRequestSchema: validate clock, device_id, operations array
  - tabDataSchema: validate all tab properties with max lengths
- [ ] Extension: Implement server URL validation
  - Must use HTTP or HTTPS protocol
  - Localhost must use HTTPS
  - Reject invalid URL formats
  - Add URL length limits (2048 chars)
- [ ] Extension: Add CSP headers to extension pages
  - Restrict script sources to self
  - Disable inline scripts
  - Add frame-ancestors directive
- [ ] Extension: Add settings validation
  - Validate sync interval (1000-60000ms)
  - Sanitize all user inputs
  - Add validateInput helper with Result type
- [ ] Server: Add request validation middleware
  - Validate all request bodies against schemas
  - Check content-type headers
  - Reject oversized payloads
- [ ] Server: Implement rate limiting by operation complexity
  - Track operation count AND complexity score
  - Different limits for different operation types
  - Per-device rate limiting
- [ ] Tests: Security-focused test suite
  - Test injection attempts
  - Validate all error paths
  - Fuzzing for input validation

#### 🎨 Branch: `feat/ui-components`
**Component Library & Design System**

- [ ] Extension: Create design token system
  - Color tokens: primary, secondary, danger, success, warning
  - Spacing scale: 4px base unit (4, 8, 12, 16, 24, 32, 48)
  - Typography: font families, sizes, weights, line heights
  - Shadows, borders, and radius tokens
- [ ] Extension: Build accessible component library
  - Button: variants (primary, secondary, danger), sizes, loading state
  - Input: validation, error states, required field handling
  - Card: header/footer slots, padding variants, interactive state
  - LoadingSpinner: sizes, colors, ARIA labels
  - ErrorMessage: types (error, warning, info), dismissible
- [ ] Extension: Implement dark mode with theme switching
  - CSS custom properties for theme values
  - System preference detection
  - Manual toggle with persistence
  - Smooth transitions between themes
- [ ] Extension: Add loading states and error boundaries
  - Skeleton loaders for async content
  - Error boundary component with fallback UI
  - Retry mechanisms in error states
  - Loading progress indicators
- [ ] Storybook: Document all components
  - Interactive component playground
  - Props documentation
  - Usage examples
  - Accessibility notes
- [ ] Tests: Visual regression tests
  - Playwright screenshot tests
  - Test all component states
  - Dark/light mode coverage
  - Responsive design tests

#### 📊 Branch: `feat/monitoring`
**Observability & Developer Experience**

- [ ] Extension: Add performance marks for critical operations
  - Mark sync start/end times
  - Measure CRDT operation processing
  - Track API call durations
  - Monitor memory usage snapshots
- [ ] Extension: Implement debug mode with verbose logging
  - Toggle via extension settings
  - Log all state changes
  - Show operation queue status
  - Display sync timing information
- [ ] Extension: Add performance profiling
  - Memory usage tracking with performance.memory
  - Operation count metrics
  - Network request statistics
  - Battery impact monitoring
- [ ] Server: Add health check endpoints
  - /health endpoint with system status
  - Database connection check
  - CRDT state validation
  - Response time metrics
- [ ] Server: Implement basic metrics collection
  - Request count by endpoint
  - Response time histograms
  - Operation count by type
  - Active connections gauge
- [ ] Server: Add diagnostics endpoints
  - /metrics for Prometheus scraping
  - /debug/crdt for state inspection
  - /debug/operations for recent operations
- [ ] Docs: Update developer documentation
  - Performance tuning guide
  - Debugging handbook
  - Metrics interpretation
  - Common issues reference
- [ ] Tests: Integration tests for monitoring
  - Health check endpoint tests
  - Metrics format validation
  - Performance regression tests
  - Load testing scenarios

### Testing Strategy

#### Phase 4.1: Foundation Testing
- **Memory Leak Detection**: Use Chrome DevTools Memory Profiler and heap snapshots
- **Performance Benchmarks**: Create baseline tests with 10, 50, 100, 200+ tabs
- **Concurrency Tests**: Simulate multiple devices syncing simultaneously
- **Load Tests**: Use k6 or similar for server stress testing

#### Phase 4.2: Resilience Testing
- **Chaos Testing**: Simulate network failures, timeouts, partial responses
- **Recovery Testing**: Verify system recovers from extended outages
- **Circuit Breaker**: Test state transitions and thresholds
- **Offline Testing**: Validate queue persistence and replay

#### Phase 4.3: Security Testing
- **Input Fuzzing**: Use AFL++ or similar for input validation
- **Penetration Testing**: OWASP ZAP for extension security
- **Dependency Scanning**: Automated vulnerability checks in CI
- **CSP Validation**: Verify Content Security Policy effectiveness

#### Phase 4.4: User Experience Testing
- **Accessibility Audit**: axe-core automated testing + manual screen reader
- **Visual Regression**: Playwright screenshots across themes and states
- **Cross-browser Testing**: Firefox stable, beta, and ESR versions
- **Usability Testing**: Real user feedback on component interactions

#### Phase 4.5: Observability Testing
- **Performance Regression**: Automated benchmarks in CI
- **Metric Validation**: Verify all metrics are accurate and useful
- **Debug Mode**: Test verbose logging doesn't impact performance
- **Integration Tests**: Ensure monitoring doesn't interfere with functionality

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

## ✅ Phase 4 Completion Criteria

### Phase 4.1: Foundation (Memory & Performance)
- [ ] Zero memory leaks verified through automated testing
- [ ] All event listeners properly cleaned up with AbortController
- [ ] Operation batching reduces network calls by 70%+
- [ ] SQLite optimized with composite indices and connection pooling
- [ ] Sub-100ms sync latency for typical operations

### Phase 4.2: Resilience
- [ ] Exponential backoff with jitter implemented
- [ ] Circuit breaker prevents cascade failures
- [ ] Offline operation queue persists up to 1000 operations
- [ ] Graceful degradation for all failure scenarios
- [ ] Recovery from extended outages tested

### Phase 4.3: Security
- [ ] All inputs validated with Zod schemas
- [ ] CSP headers protect extension pages
- [ ] Rate limiting prevents abuse
- [ ] No security vulnerabilities in dependency scan
- [ ] Security test suite passes with 100% coverage

### Phase 4.4: User Experience
- [ ] Design token system fully implemented
- [ ] Component library achieves 100% test coverage
- [ ] Dark mode works with system preference detection
- [ ] WCAG 2.1 AA compliance verified
- [ ] Visual regression tests integrated in CI

### Phase 4.5: Observability
- [ ] Performance marks track all critical operations
- [ ] Debug mode provides comprehensive visibility
- [ ] Health check endpoints respond within 50ms
- [ ] Metrics available for Prometheus scraping
- [ ] Developer documentation complete and accurate
