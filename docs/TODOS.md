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

## Pending Tasks

All work to be completed.

**Note: v3 Design Elements to Preserve**

- Colors: #6366f1 (primary), #8b5cf6 (secondary), #0a0a0b (dark bg), #0f0f10 (surface)
- UI: Purple gradient buttons, glowing effects, card-based layout, smooth animations

### Branch: `docs/operational-basics`

**Basic Documentation**

- [ ] Write simple deployment steps
- [ ] Document backup/restore process
- [ ] List common issues and fixes

### Branch: `chore/update-cargo-test-references`

**Update cargo test to cargo nextest**

- [ ] Update .github/workflows/ci.yml to use cargo nextest run
- [ ] Check all documentation files for cargo test references
- [ ] Update any scripts that use cargo test
- [ ] Verify pre-commit hooks use nextest

### Branch: `docs/git-best-practices`

**Git Best Practices Documentation**

- [ ] Document that `git add -A` should never be used
- [ ] Explain why it stages unintended files
- [ ] Show alternatives: `git add <specific-files>` or `git add -p`
- [ ] Update CLAUDE.md with this guideline
- [ ] Add to contributor documentation

### Branch: `fix/memory-leaks`

**Fix Memory Leaks & Performance**

- [ ] Extension: Fix event handler cleanup in TabEventHandler
- [ ] Extension: Fix window tracking memory issues
- [ ] Extension: Implement operation batching (50-100 ops, 1s max wait)
- [ ] Extension: Add operation priorities (high/medium/low)
- [ ] Server: Improve concurrency handling
- [ ] Server: Add database indices on (device_id, clock) and operation_type
- [ ] Server: Increase cache size and VACUUM periodically
- [ ] Tests: Verify no memory growth over extended usage
- [ ] Tests: Verify handles 200+ tabs smoothly

### Branch: `feat/error-recovery`

**Error Recovery**

- [ ] Extension: Add exponential backoff (1s start, 60s max, 2x multiplier)
- [ ] Extension: Add small random jitter to prevent thundering herd
- [ ] Extension: Reset backoff on successful sync
- [ ] Extension: Implement offline queue in browser.storage.local
- [ ] Extension: Limit queue to 1000 operations
- [ ] Extension: Retry when connection restored
- [ ] Extension: Handle network timeouts gracefully
- [ ] Extension: Handle server errors (500s) gracefully
- [ ] Extension: Handle auth failures (401s) gracefully
- [ ] Server: Add request timeouts (30s for sync endpoint)
- [ ] Server: Return partial results if possible
- [ ] Tests: Verify recovery from network outages

### Branch: `feat/mantine-setup`

**Setup Mantine** (UI Redesign - build components iteratively as needed)

- [ ] Install Mantine and dependencies
- [ ] Basic theme configuration (colors from v3 prototype)
- [ ] Set up MantineProvider in extension entry points
- [ ] Get popup page working end-to-end
- [ ] Add theme switching support (light/dark)

### Branch: `feat/popup-redesign`

**Popup Redesign**

- [ ] Window list with tracking toggles
- [ ] Sync status indicator with live animation
- [ ] Quick action buttons (Track Window, Sync Now)
- [ ] Theme toggle in header
- [ ] Build components inline as needed

### Branch: `feat/settings-redesign`

**Settings Redesign**

- [ ] Tabbed interface (General, Sync, Devices, Advanced, About)
- [ ] Theme toggle in header
- [ ] Server configuration form
- [ ] Device management list
- [ ] Extract shared components if patterns emerge

### Branch: `feat/remaining-pages`

**Additional Pages**

- [ ] Onboarding flow (if needed)
- [ ] Error states with troubleshooting
- [ ] Empty states for no windows/tabs
- [ ] Continue building components as required

### Branch: `feat/ui-polish`

**Polish & Refactor**

- [ ] Extract truly reusable components
- [ ] Optimize bundle size (target < 150KB)
- [ ] Performance improvements (TTI < 200ms, smooth 60fps)
- [ ] Visual consistency pass
- [ ] Firefox compatibility testing
- [ ] Improve error messages with better copy
- [ ] Add tooltips for complex features
- [ ] Add keyboard navigation support

### Branch: `feat/code-cleanup`

**Code Quality**

- [ ] Fix TypeScript strict mode issues
- [ ] Increase test coverage to 80%
- [ ] Remove dead code
- [ ] Update dependencies

### Branch: `feat/v1-release`

**Release**

- [ ] Submit to Mozilla addon store
- [ ] Create signed release builds
- [ ] Write installation guide
- [ ] Test full user journey
- [ ] Tag v1.0 release

---
