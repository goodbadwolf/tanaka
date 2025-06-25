# Tanaka Implementation Steps (v0.5 - v1.0)

This document provides an extremely detailed branch and commit organization for implementing the v0.5 and v1.0 roadmap.

## 📝 Progress Tracking

- Use `[ ]` for pending commits, `[x]` for completed commits
- **IMPORTANT**: Update checkboxes as part of the PR, not after merging
- The final commit before creating a PR should update both ROADMAP files
- Add notes in parentheses for any deviations: `[x] (modified: added extra validation)`

## 🌿 Branch Strategy

```
main
├── feat/rspack-react-migration (v0.5)
│   ├── feat/shared-components
│   ├── feat/preact-signals
│   ├── feat/component-tests
│   ├── feat/performance-optimization
│   └── feat/e2e-tests
└── feat/clean-architecture (v1.0)
    ├── feat/di-tokens
    ├── feat/core-models
    ├── feat/browser-acl
    ├── feat/api-schema-evolution
    ├── feat/repository-pattern
    └── feat/service-interfaces
```

---

## 📦 Part 1: v0.5 - Modern UI Migration

### 🔀 Branch: `feat/rspack-react-migration` (current)

#### Phase 1: Shared Components Library ✅

**Branch**: `feat/shared-components` (merged to main)

```bash
git checkout -b feat/shared-components
```

**Commits**:

1. [x] `feat: create components directory structure`
   - Create `src/components/` directory
   - Add `index.ts` for exports
   - Set up component organization
   - Add test setup for components

2. [x] `feat: implement Button component with variants`
   - Create `Button.tsx` with primary/secondary/danger variants
   - Add TypeScript props interface
   - Include basic styling
   - Add `Button.test.tsx` with variant tests
   - Test click handlers and disabled states

3. [x] `feat: implement Input component with validation`
   - Create `Input.tsx` with error states
   - Add validation prop support
   - Include focus/blur handling
   - Add `Input.test.tsx` with validation tests
   - Test error display and input events

4. [x] `feat: implement LoadingSpinner component`
   - Create `LoadingSpinner.tsx`
   - Add size variants (small/medium/large)
   - Include animation styles
   - Add `LoadingSpinner.test.tsx`
   - Test size prop and accessibility

5. [x] `feat: implement ErrorMessage component`
   - Create `ErrorMessage.tsx`
   - Add error type variants
   - Include dismiss functionality
   - Add `ErrorMessage.test.tsx`
   - Test dismiss handler and variants

6. [x] `feat: implement Card component`
   - Create `Card.tsx` with header/body/footer slots
   - Add shadow variants
   - Include responsive design
   - Add `Card.test.tsx`
   - Test slot rendering and styling

7. [x] `docs: add component documentation`
   - Create Storybook stories (optional)
   - Add usage examples
   - Document props
   - Include test examples

**PR**: ✅ Merged `feat/shared-components` → `main` (PR #13)

#### Phase 2: State Management ✅

**Branch**: `feat/preact-signals` (in progress)

```bash
git checkout -b feat/preact-signals
```

**Commits**:

1. [x] `chore: install @preact/signals`
   - Add dependency
   - Update TypeScript config
   - Add test utilities for signals

2. [x] `feat: create extension state signals`
   - Create `src/store/extension.ts`
   - Define window tracking state
   - Add sync status signal
   - Add `extension.test.ts` with state tests
   - Test signal updates and subscriptions

3. [x] `feat: create settings state signals`
   - Create `src/store/settings.ts`
   - Define settings signals
   - Add persistence layer
   - Add `settings.test.ts` with persistence tests
   - Test load/save operations

4. [x] `feat: integrate signals with WindowTracker`
   - Update `WindowTracker.tsx` to use signals
   - Remove prop drilling
   - Add reactive updates
   - Update `WindowTracker.test.tsx` for signals
   - Test reactive behavior

5. [x] `feat: integrate signals with SettingsApp`
   - Update `SettingsApp.tsx` to use signals
   - Connect to settings store
   - Add auto-save functionality
   - Update `SettingsApp.test.tsx` for signals
   - Test auto-save behavior

6. [x] `refactor: migrate popup state to signals`
   - Update `PopupApp.tsx`
   - Remove useState calls
   - Use computed signals
   - Update `PopupApp.test.tsx`
   - Test computed signal updates

**PR**: Merge `feat/preact-signals` → `feat/rspack-react-migration`

#### Phase 3: Test Infrastructure & Coverage

**Branch**: `feat/test-infrastructure`

**Note**: Test coverage goal of 80%+ was achieved early via `test/improve-coverage` branch (PR #22) with:
- Fixed skipped tests in SettingsApp
- Added comprehensive API module tests (100% coverage)
- Added comprehensive browser module tests (100% coverage)
- Overall coverage: 86.8%

```bash
git checkout -b feat/test-infrastructure
```

**Commits**:

1. `chore: configure React Testing Library and coverage`
   - Update Jest config for better coverage
   - Add testing utilities and helpers
   - Configure test environment
   - Set up coverage thresholds (80%)
   - Add coverage reporting scripts

2. `test: enhance existing component test coverage`
   - Add missing edge case tests
   - Test error boundaries
   - Test accessibility features
   - Ensure 80%+ coverage per component

3. `test: add integration tests for popup flow`
   - Test full popup initialization
   - Test message passing to background
   - Test error states
   - Mock browser APIs

4. `test: add integration tests for settings flow`
   - Test settings load and save cycle
   - Test form validation flow
   - Test error recovery
   - Mock storage APIs

5. `test: add hook testing utilities`
   - Create `src/test-utils/hooks.tsx`
   - Add renderHook wrapper
   - Test useExtensionState thoroughly
   - Test useSettings edge cases

6. `docs: add testing guide`
   - Document testing patterns
   - Add examples for common scenarios
   - Include coverage requirements
   - Add CI/CD test commands

**PR**: Merge `feat/component-tests` → `feat/rspack-react-migration`

#### Phase 4: Vanilla JS Removal

**Branch**: `feat/remove-vanilla-js` (from rspack-react-migration)

```bash
git checkout -b feat/remove-vanilla-js
```

**Commits**:

1. `refactor: remove vanilla popup.js`
   - Delete old popup implementation
   - Remove event listeners
   - Clean up imports

2. `refactor: remove vanilla settings.js`
   - Delete old settings implementation
   - Remove form handling
   - Update build config

3. `refactor: clean up legacy styles`
   - Remove unused CSS
   - Consolidate style files
   - Update imports

4. `chore: update build configuration`
   - Remove old entry points
   - Update HTML templates
   - Clean up assets

**PR**: Merge `feat/remove-vanilla-js` → `feat/rspack-react-migration`

#### Phase 5: Performance Optimization

**Branch**: `feat/performance-optimization`

```bash
git checkout -b feat/performance-optimization
```

**Commits**:

1. `feat: implement lazy loading for settings`
   - Add React.lazy for SettingsApp
   - Create loading boundary
   - Add error boundary

2. `feat: add performance monitoring`
   - Create `src/utils/performance.ts`
   - Add timing marks
   - Implement reporting

3. `feat: enable tree shaking`
   - Update rspack config
   - Mark side-effect free modules
   - Optimize imports

4. `feat: configure minification`
   - Add terser plugin
   - Configure optimization
   - Set production flags

5. `feat: implement bundle analysis`
   - Add analyze script
   - Generate bundle report
   - Document findings

6. `perf: optimize component re-renders`
   - Add memo where needed
   - Optimize dependencies
   - Fix render loops

7. `perf: optimize asset loading`
   - Implement resource hints
   - Add preload directives
   - Optimize images

**PR**: Merge `feat/performance-optimization` → `feat/rspack-react-migration`

#### Phase 6: E2E Testing

**Branch**: `feat/e2e-tests`

```bash
git checkout -b feat/e2e-tests
```

**Commits**:

1. `chore: install and configure Playwright`
   - Add Playwright dependencies
   - Create config file
   - Set up test structure

2. `test: add extension installation E2E test`
   - Test extension loads
   - Test popup opens
   - Test basic functionality

3. `test: add window tracking E2E flow`
   - Test tracking toggle
   - Test multi-window sync
   - Test persistence

4. `test: add settings configuration E2E test`
   - Test settings navigation
   - Test form submission
   - Test validation

5. `test: add full sync flow E2E test`
   - Test tab creation sync
   - Test tab close sync
   - Test conflict resolution

6. `test: add error scenario E2E tests`
   - Test offline behavior
   - Test server errors
   - Test recovery

**PR**: Merge `feat/e2e-tests` → `feat/rspack-react-migration`

#### Phase 7: Production Readiness

**Branch**: `feat/production-ready` (from rspack-react-migration)

```bash
git checkout -b feat/production-ready
```

**Commits**:

1. `test: validate performance metrics`
   - Run performance tests
   - Document results
   - Compare with baseline

2. `security: audit CSP and permissions`
   - Review manifest permissions
   - Validate CSP headers
   - Check for vulnerabilities

3. `docs: update all documentation`
   - Update README.md
   - Update DEV.md
   - Update component docs

4. `ci: update GitHub Actions workflow`
   - Add new test commands
   - Update build steps
   - Add artifact uploads

5. `chore: final QA checklist`
   - Run full test suite
   - Manual testing checklist
   - Performance validation

**PR**: Merge `feat/production-ready` → `feat/rspack-react-migration`

### 🎯 Final v0.5 Release

**PR**: Merge `feat/rspack-react-migration` → `main`
**Tag**: `v0.5.0`

---

## 🏗️ Part 2: v1.0 - Clean Architecture

### 🔀 Branch: `feat/clean-architecture`

```bash
git checkout main
git checkout -b feat/clean-architecture
```

#### Phase 1: DI Tokens & Core Models

**Branch**: `feat/di-tokens`

```bash
git checkout -b feat/di-tokens
```

**Commits**:

1. `feat: create DI tokens with Symbol`
   - Create `src/di/tokens.ts`
   - Define all service tokens
   - Export TOKENS constant
   - Add `tokens.test.ts` to verify uniqueness
   - Test Symbol.for behavior

2. `feat: implement core Tab model with tests`
   - Create `src/models/tab.ts`
   - Add Tab interface and schema
   - Implement business methods
   - Add `tab.test.ts` with validation tests
   - Test isSyncable and isRecentlyAccessed methods

3. `feat: implement Window model with tests`
   - Create `src/models/window.ts`
   - Add Window interface
   - Add relationship methods
   - Add `window.test.ts`
   - Test window-tab relationships

4. `feat: implement Settings model with tests`
   - Create `src/models/settings.ts`
   - Add validation schema
   - Add defaults
   - Add `settings.test.ts`
   - Test validation and defaults

5. `feat: add memoized validation with benchmarks`
   - Create `src/utils/memoize.ts`
   - Implement parseTab function
   - Add performance optimization
   - Add `memoize.test.ts` with cache tests
   - Add performance benchmarks

6. `test: add container health check`
   - Create `src/di/container.test.ts`
   - Test all tokens resolve
   - Check circular dependencies
   - Validate registration
   - Test production vs development modes

**PR**: Merge `feat/di-tokens` → `feat/clean-architecture`

#### Phase 2: Browser Anti-Corruption Layer

**Branch**: `feat/browser-acl`

```bash
git checkout -b feat/browser-acl
```

**Commits**:

1. `feat: create browser mappers with tests`
   - Create `src/browser/mappers.ts`
   - Implement browserTabToTab
   - Add compatibility checks
   - Add `mappers.test.ts`
   - Test all conversion scenarios

2. `refactor: update Browser class to use models`
   - Import core Tab model
   - Use mappers internally
   - Remove BrowserTab exposure
   - Update existing Browser tests
   - Ensure no BrowserTab leaks

3. `feat: add browser compatibility layer`
   - Handle missing lastAccessed
   - Add fallback values
   - Document workarounds
   - Add compatibility tests
   - Test Firefox version differences

4. `chore: add ESLint boundary rules with tests`
   - Configure import restrictions
   - Block BrowserTab imports
   - Add custom messages
   - Add ESLint rule tests
   - Verify boundary enforcement

**PR**: Merge `feat/browser-acl` → `feat/clean-architecture`

#### Phase 3: API Schema Evolution

**Branch**: `feat/api-schema-evolution`

```bash
git checkout -b feat/api-schema-evolution
```

**Commits**:

1. `refactor: move generated types to api directory`
   - Create `src/api/generated/`
   - Move type definitions
   - Update imports
   - Update tests to use new paths

2. `feat: implement schema versioning with tests`
   - Add version field to SyncTab
   - Create migration system
   - Document versions
   - Add `schema-version.test.ts`
   - Test version detection

3. `feat: create API mappers with contract tests`
   - Create `src/api/mappers.ts`
   - Implement tabToSyncTab
   - Implement syncTabToTab
   - Add `mappers.test.ts` with round-trip tests
   - Test data integrity

4. `feat: add data corruption handling with tests`
   - Add try-catch blocks
   - Log parsing errors
   - Return null on failure
   - Add corruption test cases
   - Test recovery behavior

5. `test: add comprehensive schema evolution tests`
   - Create `schema-evolution.test.ts`
   - Test backward compatibility
   - Test forward compatibility
   - Test migration paths
   - Add performance benchmarks for parsing

**PR**: Merge `feat/api-schema-evolution` → `feat/clean-architecture`

#### Phase 4: Repository Pattern

**Branch**: `feat/repository-pattern`

```bash
git checkout -b feat/repository-pattern
```

**Commits**:

1. `feat: create repository interfaces`
   - Create `src/repositories/interfaces.ts`
   - Define ITabRepository
   - Define IWindowRepository
   - Define ISettingsRepository
   - Add JSDoc documentation

2. `feat: implement Mutex with concurrency tests`
   - Create `src/utils/mutex.ts`
   - Add exclusive execution
   - Add queue management
   - Add `mutex.test.ts`
   - Test race conditions and deadlocks

3. `feat: implement TabRepository with tests`
   - Create `src/repositories/tab-repository.ts`
   - Use DI tokens
   - Add mutex protection
   - Add `tab-repository.test.ts`
   - Test concurrent sync operations

4. `feat: implement WindowRepository with tests`
   - Create `src/repositories/window-repository.ts`
   - Add tracking methods
   - Use storage abstraction
   - Add `window-repository.test.ts`
   - Test track/untrack operations

5. `feat: add performance instrumentation`
   - Create instrumentation wrapper
   - Add timing metrics
   - Log slow operations
   - Add performance tests
   - Verify minimal overhead

6. `refactor: register repositories in DI container`
   - Update container configuration
   - Use Symbol tokens
   - Add instrumentation
   - Update container tests
   - Verify proper registration

**PR**: Merge `feat/repository-pattern` → `feat/clean-architecture`

#### Phase 5: Service Interfaces

**Branch**: `feat/service-interfaces`

```bash
git checkout -b feat/service-interfaces
```

**Commits**:

1. `feat: create service interfaces`
   - Define ISyncManager
   - Define IWindowTracker
   - Define IMessageHandler
   - Define ITabEventHandler
   - Add method signatures and docs

2. `refactor: update SyncManager with interface and tests`
   - Implement ISyncManager
   - Use Symbol token
   - Update imports
   - Update `sync-manager.test.ts`
   - Test interface compliance

3. `refactor: update WindowTracker with interface and tests`
   - Implement IWindowTracker
   - Add interface methods
   - Update registration
   - Update `window-tracker.test.ts`
   - Test all interface methods

4. `feat: create mock implementations with tests`
   - Create MockTanakaAPI
   - Create MockSyncManager
   - Add test data generators
   - Add mock behavior tests
   - Verify mock fidelity

5. `feat: create offline implementations with tests`
   - Create OfflineTanakaAPI
   - Add caching layer
   - Queue updates for retry
   - Add `offline-api.test.ts`
   - Test offline/online transitions

6. `feat: add observability to services`
   - Add performance tracking
   - Add error reporting
   - Add metrics collection
   - Add observability tests
   - Verify metrics accuracy

**PR**: Merge `feat/service-interfaces` → `feat/clean-architecture`

#### Phase 6: Integration & Documentation

**Branch**: `feat/integration-docs` (from clean-architecture)

```bash
git checkout -b feat/integration-docs
```

**Commits**:

1. `test: add end-to-end architecture tests`
   - Test full data flow (Browser → Model → API)
   - Verify boundary enforcement
   - Test error propagation
   - Validate performance targets
   - Ensure 200+ tabs performance

2. `test: add cross-boundary integration tests`
   - Test Browser ACL integration
   - Test Repository-API integration
   - Test Service orchestration
   - Verify no type leakage
   - Test production mode behavior

3. `perf: add comprehensive benchmarks`
   - Benchmark 200+ tabs scenarios
   - Measure memory usage
   - Profile CPU usage
   - Compare with v0.5 baseline
   - Document performance wins

4. `docs: create architecture documentation`
   - Create `docs/ARCHITECTURE.md`
   - Add data flow diagrams
   - Document design decisions
   - Include code examples
   - Add troubleshooting guide

5. `docs: update CLAUDE.md with new patterns`
   - Add Symbol token pattern
   - Document memoization usage
   - Add repository examples
   - Include testing patterns
   - Update troubleshooting section

**PR**: Merge `feat/comprehensive-tests` → `feat/clean-architecture`

### 🎯 Final v1.0 Release

**PR**: Merge `feat/clean-architecture` → `main`
**Tag**: `v1.0.0`

---

## 📋 Commit Guidelines

### Documentation Updates

Each feature branch should include roadmap updates **as part of the PR**:

1. **Final commit before creating PR should update:**
   - **ROADMAP-v0.5-v1.0.md**: Mark completed items with `[x]`
   - **ROADMAP-v0.5-v1.0-STEPS.md**: Mark commits as complete with `[x]`
   - Update "Current" column in Success Metrics if applicable
   - Add any new discovered tasks

2. **Include roadmap updates in the PR**:
   - This ensures roadmap stays in sync with code changes
   - Prevents forgetting to update documentation
   - Makes PR self-documenting

Example final commit before PR:

```bash
# After completing all feature work, update roadmaps
git add docs/ROADMAP-v0.5-v1.0.md docs/ROADMAP-v0.5-v1.0-STEPS.md
git commit -m "docs: update roadmaps for Phase X completion

- Mark all completed items with [x]
- Update success metrics
- Note any deviations or additional work"
```

## 📋 PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Test
- [ ] Documentation

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] **ROADMAP files updated with [x] for completed items**
- [ ] **Success metrics updated if applicable**
- [ ] No console errors
```

---

## 🔄 Continuous Integration

Each PR should trigger:

1. TypeScript compilation
2. ESLint checks
3. Unit tests
4. Integration tests
5. Bundle size check
6. Performance benchmarks (for key PRs)

---

**Note**: This is a living document. Update commit messages and branch names as implementation progresses.
