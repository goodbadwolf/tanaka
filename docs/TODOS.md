# Tanaka TODOs

This file tracks all pending work for the Tanaka project.

## Key Principles

1. **Unified Changes**: Related extension and server changes in same branch
   - Frontend and backend changes that depend on each other ship together
   - Reduces integration bugs and deployment complexity
   - Example: New CRDT operation needs both extension handler and server endpoint

2. **Incremental Progress**: Each branch should be independently mergeable
   - No "big bang" PRs - break work into digestible pieces
   - Each PR should leave the system in a working state
   - Feature flags for gradual rollout of larger changes

3. **Test Everything**: Both sides need comprehensive tests
   - Unit tests for business logic (aim for 80%+ coverage)
   - Integration tests for critical paths (sync, auth, persistence)
   - Manual testing checklist for UI changes
   - Performance benchmarks for changes affecting 200+ tabs

4. **Performance First**: Every change considers 200+ tab scenarios
   - Profile memory usage before and after changes
   - Measure sync latency impact
   - Consider battery life implications
   - Use Web Workers for heavy operations

5. **Clean Architecture**: Apply same patterns to both extension and server
   - Consistent error handling (Result types)
   - Shared domain models via code generation
   - Repository pattern for data access
   - Service layer for business logic

---

## Progress Tracking Rules

### Task Management
- Use `[ ]` for pending, `[x]` for completed tasks
- Break large tasks into subtasks when complexity emerges
- Add discovered work as new tasks rather than expanding existing ones
- Mark tasks complete only when fully done (not partially)

### Pull Request Workflow
- **Always create a PR when a branch is ready for review**
- Update this TODO file as part of each PR that completes tasks
- Include in PR description:
  - Which TODO tasks are addressed
  - Testing performed (automated + manual)
  - Performance impact analysis
  - Screenshots for UI changes

### Quality Gates
- Run all tests before marking complete (`cargo nextest run` + `pnpm test`)
- Ensure pre-commit hooks pass (`pre-commit run --all-files`)
- Verify no memory leaks introduced (test with 200+ tabs)
- Update relevant documentation (user guides, API docs, comments)

### Branch Protection
- NEVER push directly to main branch of the remote `origin`
- All changes must go through PR review process
- Squash commits for clean history when merging
- Delete feature branches after merge

---

## Pending Tasks

All work to be completed.

### Documentation

#### Branch: `docs/operational-basics`

**Basic Documentation**

- [ ] Write simple deployment steps
- [ ] Document backup/restore process
- [ ] List common issues and fixes

#### Branch: `chore/update-cargo-test-references`

**Update cargo test to cargo nextest**

- [ ] Replace all `cargo test` references with `cargo nextest run`
  - Update .github/workflows/ci.yml
  - Check all documentation files
  - Update any scripts that use cargo test
  - Verify pre-commit hooks use nextest

#### Branch: `docs/git-best-practices`

**Git Best Practices Documentation**

- [ ] Document that `git add -A` should never be used
  - Explain why (stages unintended files)
  - Show alternatives: `git add <specific-files>` or `git add -p`
  - Update CLAUDE.md with this guideline
  - Add to contributor documentation

### Baseline Measurements

#### Branch: `docs/baseline-metrics`

**Establish Baselines**

- [ ] Test with 200+ tabs and note performance
- [ ] Check memory usage patterns
- [ ] Document sync frequency
- [ ] Document why Yjs was chosen for CRDT
- [ ] Document current architecture decisions

### Core Stability

#### Branch: `fix/memory-leaks`

**Fix Memory Leaks**

- [ ] Extension: Fix event handler cleanup in TabEventHandler
  - Add cleanup methods for all browser event listeners
  - Clear timers and intervals on dispose
  - Remove listeners for onActivated, windowRemoved events
- [ ] Extension: Fix window tracking memory issues
  - Replace weak references with proper Set<number>
  - Clean up tracked windows on untrack
- [ ] Server: Improve concurrency handling
  - Consider RwLock instead of Mutex for better read performance
- [ ] Tests: Verify no memory growth over extended usage

#### Branch: `feat/performance`

**Basic Performance Improvements**

- [ ] Extension: Implement simple operation batching
  - Batch size: 50-100 operations
  - Max wait time: 1 second
  - Deduplicate operations for same tab
- [ ] Extension: Add operation priorities
  - High: close_tab, track/untrack (send immediately)
  - Medium: tab updates (batch with 200ms delay)
  - Low: URL changes (batch with 1s delay)
- [ ] Server: Add database indices
  - Index on (device_id, clock) for sync queries
  - Index on operation_type for filtering
  - Consider partial index for active tabs only
- [ ] Server: Basic SQLite tuning
  - Increase cache size for better performance
  - Use WAL mode (already enabled)
  - VACUUM periodically
- [ ] Tests: Verify handles 200+ tabs smoothly

#### Branch: `feat/error-recovery`

**Error Recovery**

- [ ] Extension: Add exponential backoff
  - Start: 1s, max: 60s, multiplier: 2
  - Add small random jitter to prevent thundering herd
  - Reset on successful sync
- [ ] Extension: Implement offline queue
  - Store failed operations in browser.storage.local
  - Limit queue to 1000 operations
  - Retry when connection restored
- [ ] Extension: Handle common failures gracefully
  - Network timeouts
  - Server errors (500s)
  - Auth failures (401s)
- [ ] Server: Add request timeouts
  - Set reasonable timeout (30s) for sync endpoint
  - Return partial results if possible
- [ ] Tests: Verify recovery from network outages

### User Experience

#### Branch: `feat/ui-redesign`

**Complete UI Redesign**

- [ ] Implement new modern UI design
  - Create fresh, modern interface design
  - Ensure consistent design system across all components
  - Use modern CSS with CSS variables for theming
  - Follow current UI/UX best practices
- [ ] Convert to React/Preact components
  - Create reusable component library
  - Implement proper state management
  - Add TypeScript types for all components
- [ ] Implement animations and transitions
  - Smooth page transitions
  - Loading states with skeleton screens
  - Micro-interactions for better UX
- [ ] Add comprehensive theming support
  - Dark mode (default)
  - Light mode
  - System preference detection
  - Theme persistence
- [ ] Responsive design
  - Test on different screen sizes
  - Ensure popup works at various widths
  - Mobile-friendly settings page

#### Branch: `feat/ui-polish`

**UI Improvements** (after redesign)

- [ ] Improve error messages with better copy
- [ ] Add tooltips for complex features
- [ ] Optimize performance for smooth 60fps
- [ ] Add keyboard navigation support

#### Branch: `feat/code-cleanup`

**Code Quality**

- [ ] Fix TypeScript strict mode issues
- [ ] Increase test coverage to 80%
- [ ] Remove dead code
- [ ] Update dependencies

### Release Preparation

#### Branch: `feat/v1-release`

**Release**

- [ ] Submit to Mozilla addon store
- [ ] Create signed release builds
- [ ] Write installation guide
- [ ] Test full user journey
- [ ] Tag v1.0 release

---
