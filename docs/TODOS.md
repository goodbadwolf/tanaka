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

#### Branch: `docs/operational-basics`

**Basic Documentation**

- [ ] Write simple deployment steps
- [ ] Document backup/restore process
- [ ] List common issues and fixes

#### Branch: `chore/update-cargo-test-references`

**Update cargo test to cargo nextest**

- [ ] Update .github/workflows/ci.yml to use cargo nextest run
- [ ] Check all documentation files for cargo test references
- [ ] Update any scripts that use cargo test
- [ ] Verify pre-commit hooks use nextest

#### Branch: `docs/git-best-practices`

**Git Best Practices Documentation**

- [ ] Document that `git add -A` should never be used
- [ ] Explain why it stages unintended files
- [ ] Show alternatives: `git add <specific-files>` or `git add -p`
- [ ] Update CLAUDE.md with this guideline
- [ ] Add to contributor documentation

#### Branch: `fix/memory-leaks`

**Fix Memory Leaks**

- [ ] Extension: Fix event handler cleanup in TabEventHandler
- [ ] Extension: Fix window tracking memory issues  
- [ ] Server: Improve concurrency handling
- [ ] Tests: Verify no memory growth over extended usage

#### Branch: `feat/performance`

**Basic Performance Improvements**

- [ ] Extension: Implement simple operation batching (50-100 operations, 1 second max wait)
- [ ] Extension: Deduplicate operations for same tab
- [ ] Extension: Add operation priorities (high/medium/low)
- [ ] Server: Add database indices on (device_id, clock) and operation_type
- [ ] Server: Consider partial index for active tabs only
- [ ] Server: Increase cache size for better performance
- [ ] Server: VACUUM periodically
- [ ] Tests: Verify handles 200+ tabs smoothly

#### Branch: `feat/error-recovery`

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

#### Branch: `feat/mantine-setup`

**Setup Mantine** (UI Redesign - build components iteratively as needed)

- [ ] Install Mantine and dependencies
- [ ] Basic theme configuration (colors from v3 prototype)
- [ ] Set up MantineProvider in extension entry points
- [ ] Get popup page working end-to-end
- [ ] Add theme switching support (light/dark)

#### Branch: `feat/popup-redesign`

**Popup Redesign**

- [ ] Window list with tracking toggles
- [ ] Sync status indicator with live animation
- [ ] Quick action buttons (Track Window, Sync Now)
- [ ] Theme toggle in header
- [ ] Build components inline as needed

#### Branch: `feat/settings-redesign`

**Settings Redesign**

- [ ] Tabbed interface (General, Sync, Devices, Advanced, About)
- [ ] Theme toggle in header
- [ ] Server configuration form
- [ ] Device management list
- [ ] Extract shared components if patterns emerge

#### Branch: `feat/remaining-pages`

**Additional Pages**

- [ ] Onboarding flow (if needed)
- [ ] Error states with troubleshooting
- [ ] Empty states for no windows/tabs
- [ ] Continue building components as required

#### Branch: `feat/ui-polish`  

**Polish & Refactor**

- [ ] Extract truly reusable components
- [ ] Optimize bundle size (target < 150KB)
- [ ] Performance improvements (TTI < 200ms)
- [ ] Visual consistency pass
- [ ] Firefox compatibility testing

**Design Elements to Preserve from v3:**
- Primary: #6366f1 (indigo gradient)
- Secondary: #8b5cf6 (purple accent)
- Dark Background: #0a0a0b
- Surface: #0f0f10
- Purple gradient buttons
- Glowing effects on interactive elements
- Card-based layout
- Smooth animations

#### Branch: `feat/css-architecture-improvements`

**CSS Architecture Refinements** (Lower Priority)

- [ ] Create core/ directory for variables, reset, base
- [ ] Create utilities/ directory for layout, spacing, typography, states
- [ ] Create components/ directory for buttons, cards, forms, badges, modals
- [ ] Create pages/ directory for page-specific styles
- [ ] Create main.css to import all files in correct order
- [ ] Convert .button variants to .button--primary, .button--danger
- [ ] Convert .card variants to .card--hover, .card--selected
- [ ] Update HTML to use new modifier classes
- [ ] Reduce overly specific selectors
- [ ] Group similar properties
- [ ] Create transition utility groups
- [ ] Identify above-fold styles
- [ ] Create critical.css for inline loading
- [ ] Load non-critical styles asynchronously

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

#### Branch: `feat/v1-release`

**Release**

- [ ] Submit to Mozilla addon store
- [ ] Create signed release builds
- [ ] Write installation guide
- [ ] Test full user journey
- [ ] Tag v1.0 release

---
