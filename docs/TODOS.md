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

#### Branch: `feat/add-ui-prototypes`

**Add UI Prototypes**

- [x] Commit all prototype files as-is
  - [x] Popup redesign with window tracking animation
  - [x] Settings page with tabbed navigation
  - [x] Onboarding flow with step-by-step setup
  - [x] Error states and troubleshooting page
  - [x] Context menu with quick actions
  - [x] Empty states for all scenarios
  - [x] Notification system (toasts, progress, inline)
  - [x] Sync history timeline view
  - [x] Advanced tab search interface
  - [x] Window details management panel
  - [x] Extension icon with gradient design

#### Branch: `feat/consolidate-prototypes`

**Consolidate Prototype Styles**

- [ ] Extract common CSS into shared stylesheet
  - [ ] Color variables and gradients
  - [ ] Typography scale and fonts
  - [ ] Spacing and sizing system
  - [ ] Animation keyframes and transitions
  - [ ] Common component styles (buttons, cards, inputs)
- [ ] Extract design system tokens
  - [ ] Colors: Primary (#6366f1, #8b5cf6), Background (#0a0a0b, #0f0f10), Text (#e7e7e8, #a1a1aa, #6b7280)
  - [ ] Spacing: 4px base unit (8, 12, 16, 20, 24, 30, 40px scale)
  - [ ] Border radius: Small (6-8px), Medium (10-12px), Large (16-20px)
  - [ ] Shadows: Consistent elevation system
  - [ ] Animation: Standard easings and durations
- [ ] Create TypeScript interfaces for prototype data
  - [ ] Window and tab types
  - [ ] Sync status states
  - [ ] Notification types
  - [ ] Settings structure
- [ ] Consolidate JavaScript behaviors
  - [ ] Toggle interactions
  - [ ] Form validations
  - [ ] Animation triggers
  - [ ] State management patterns

#### Branch: `feat/create-design-system`

**Convert to React Component Library**

- [ ] Set up component library structure
  - [ ] Create components directory
  - [ ] Set up Storybook for component development
  - [ ] Configure CSS modules or styled-components
- [ ] Build core design system components
  - [ ] Button (primary, secondary, danger)
  - [ ] Card (default, elevated, interactive)
  - [ ] Input/TextArea with validation
  - [ ] Toggle switch
  - [ ] Badge/Status indicators
  - [ ] Toast notifications
  - [ ] Modal/Overlay
  - [ ] Dropdown/Select
  - [ ] Tooltip
  - [ ] LoadingSpinner/Skeleton

#### Branch: `feat/ui-redesign`

**Implement Redesigned Pages**

- [ ] Popup page redesign
  - [ ] WindowCard with tracking toggle
  - [ ] SyncStatus indicator
  - [ ] QuickActions bar
  - [ ] TrackingAnimation overlay
- [ ] Settings page redesign
  - [ ] TabNavigation component
  - [ ] SettingsSection cards
  - [ ] Form components integration
  - [ ] Device management
- [ ] Onboarding flow
  - [ ] ProgressBar stepper
  - [ ] Connection test
  - [ ] Window selection
  - [ ] Success animation
- [ ] Error/troubleshooting page
  - [ ] DiagnosticPanel
  - [ ] Common issues accordion
  - [ ] Debug info display
- [ ] Additional pages
  - [ ] Context menu implementation
  - [ ] Empty states for all views
  - [ ] Notification system
  - [ ] Sync history timeline
  - [ ] Tab search interface
  - [ ] Window details panel
- [ ] Implement state management integration
  - [ ] Window tracking state
  - [ ] Sync status and progress
  - [ ] Settings persistence
  - [ ] Error/warning states
  - [ ] Onboarding progress
- [ ] Add missing UI states
  - [ ] Loading states (skeleton screens, progress indicators)
  - [ ] Offline mode indicators
  - [ ] Sync conflict resolution UI
  - [ ] Bulk actions (select multiple windows)
- [ ] Accessibility improvements
  - [ ] ARIA labels and roles
  - [ ] Keyboard navigation (Tab, Enter, Escape)
  - [ ] Focus management and trapping
  - [ ] Screen reader announcements
  - [ ] High contrast mode support
- [ ] Animation refinements
  - [ ] Page transitions (slide, fade)
  - [ ] Stagger animations for lists
  - [ ] Smooth height transitions
  - [ ] Loading progress animations
  - [ ] Success/error state transitions
- [ ] Theme system implementation
  - [ ] CSS custom properties for all tokens
  - [ ] Theme provider component
  - [ ] Light theme variant
  - [ ] System preference detection
  - [ ] Smooth theme transitions
- [ ] Responsive improvements
  - [ ] Popup: Fixed 380px with internal responsiveness
  - [ ] Settings: Adapt to window width
  - [ ] Onboarding: Center and scale appropriately
  - [ ] Touch-friendly tap targets (min 44px)
- [ ] Performance optimizations
  - [ ] Virtualized window lists for 200+ items
  - [ ] Debounced search/filter inputs
  - [ ] Lazy load heavy components
  - [ ] Optimize animation performance
  - [ ] Reduce re-renders with memo

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
