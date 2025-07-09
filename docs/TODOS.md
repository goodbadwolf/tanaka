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

#### Branch: `feat/consolidate-prototypes` ✅ **MAJOR MILESTONE COMPLETE**

**Consolidate Prototype Styles**

- [x] **PHASE 1 COMPLETE: 4 PAGES FULLY EXTRACTED** - 1,797 lines of inline CSS → 0 lines
  - [x] Popup prototype: 520 lines extracted (0.00% regression)
  - [x] Settings page: 400 lines extracted (0.32% regression)
  - [x] Onboarding flow: 350 lines extracted (0.27% regression)
  - [x] Error states: 527 lines extracted (0.01% regression)

- [x] **CSS ARCHITECTURE ESTABLISHED**
  - [x] styles.css - Core design system with expanded variables
  - [x] animations.css - Centralized @keyframes (fixed duplicates)
  - [x] utilities.css - 300+ utility classes created
  - [x] components.css - Enhanced with icon/badge systems
  - [x] Page-specific CSS for all 4 completed pages

- [x] **CSS OPTIMIZATION COMPLETED** (January 6, 2025)
  - [x] Extracted all remaining inline styles
  - [x] Created comprehensive utilities.css
  - [x] Enhanced components.css with icon/badge systems
  - [x] Added missing CSS variables (error color, z-index, shadows)
  - [x] Fixed animation organization (moved to animations.css)
  - [x] Updated all HTML files with utilities.css link
  - [x] All visual regression tests passing (12/12)

- [x] Extract common CSS into shared stylesheet
  - [x] Color variables and gradients
  - [x] Typography scale and fonts
  - [x] Spacing and sizing system (extended to 3xl/4xl)
  - [x] Animation keyframes and transitions
  - [x] Common component styles (buttons, cards, inputs)
- [x] Extract design system tokens
  - [x] Colors: Primary (#6366f1, #8b5cf6), Background (#0a0a0b, #0f0f10), Text (#e7e7e8, #a1a1aa, #6b7280), Error (#ef4444)
  - [x] Spacing: 4px base unit (xs through 4xl scale)
  - [x] Border radius: Small (4px), Medium (8px), Large (12px), XL (20px)
  - [x] Shadows: Complete system (sm/md/lg/xl/glow/inner)
  - [x] Z-index: Systematic scale (base through max)
  - [x] Animation: Standard easings and durations
- [x] Consolidate JavaScript behaviors
  - [x] Toggle interactions
  - [x] Form validations
  - [x] Animation triggers
  - [x] State management patterns

**ALL 11 prototype files completed with 100% CSS extraction** ✅

#### ~~Branch: `feat/extract-remaining-prototypes`~~ ✅ COMPLETED

**Extract Remaining Prototype CSS** ✅ **COMPLETED in `feat/consolidate-prototypes`**

All 7 remaining prototype files were successfully extracted:

**Notifications** (`notifications.html` ~180 lines) ✅
- [x] Setup BackstopJS configuration for notifications page
- [x] Created prototype/v2/css/notifications.css for page-specific styles
- [x] Created prototype/v2/notifications.html
- [x] Extracted toast system and notification styles
- [x] Tested visual regression throughout extraction (0.00%)

**Context Menu** (`context-menu.html` ~150 lines) ✅
- [x] Setup BackstopJS configuration for context menu
- [x] Created prototype/v2/css/context-menu.css for page-specific styles
- [x] Created prototype/v2/context-menu.html
- [x] Extracted dropdown and menu item styles
- [x] Tested visual regression throughout extraction (0.00%)

**Tab Search** (`tab-search.html` ~300 lines) ✅
- [x] Setup BackstopJS configuration for tab search
- [x] Created prototype/v2/css/tab-search.css for page-specific styles
- [x] Created prototype/v2/tab-search.html
- [x] Extracted search interface and result styles
- [x] Tested visual regression throughout extraction (0.00%)

**Window Details** (`window-details.html` ~250 lines) ✅
- [x] Setup BackstopJS configuration for window details
- [x] Created prototype/v2/css/window-details.css for page-specific styles
- [x] Created prototype/v2/window-details.html
- [x] Extracted detail panel and management styles
- [x] Tested visual regression throughout extraction (0.00%)

**Sync History** (`sync-history.html` ~280 lines) ✅
- [x] Setup BackstopJS configuration for sync history
- [x] Created prototype/v2/css/sync-history.css for page-specific styles
- [x] Created prototype/v2/sync-history.html
- [x] Extracted timeline and history item styles
- [x] Tested visual regression throughout extraction (0.00%)

**Empty States** (`empty-states.html` ~120 lines) ✅
- [x] Setup BackstopJS configuration for empty states
- [x] Created prototype/v2/css/empty-states.css for page-specific styles
- [x] Created prototype/v2/empty-states.html
- [x] Extracted empty state illustrations and messages
- [x] Tested visual regression throughout extraction (0.00%)

**Index/Demo** (`index.html` ~100 lines) ✅
- [x] Completed prototype/v2/index.html with new CSS architecture
- [x] Extracted any remaining demo-specific styles
- [x] Tested visual regression throughout extraction (0.00%)

### UI Redesign with Mantine

**Note**: Complete UI redesign using Mantine UI library with iterative approach - build components as needed, not upfront.

#### Branch: `feat/mantine-setup`

**Phase 1: Setup Mantine**

- [ ] Install Mantine and dependencies
- [ ] Basic theme configuration (colors from v3 prototype)
- [ ] Set up MantineProvider in extension entry points
- [ ] Get popup page working end-to-end
- [ ] Add theme switching support (light/dark)

#### Branch: `feat/popup-redesign`

**Phase 2: Popup Redesign**

- [ ] Window list with tracking toggles
- [ ] Sync status indicator with live animation
- [ ] Quick action buttons (Track Window, Sync Now)
- [ ] Theme toggle in header
- [ ] Build components inline as needed

#### Branch: `feat/settings-redesign`

**Phase 3: Settings Redesign**

- [ ] Tabbed interface (General, Sync, Devices, Advanced, About)
- [ ] Theme toggle in header
- [ ] Server configuration form
- [ ] Device management list
- [ ] Extract shared components if patterns emerge

#### Branch: `feat/remaining-pages`

**Phase 4: Additional Pages**

- [ ] Onboarding flow (if needed)
- [ ] Error states with troubleshooting
- [ ] Empty states for no windows/tabs
- [ ] Continue building components as required

#### Branch: `feat/ui-polish`

**Phase 5: Polish & Refactor**

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

- [ ] Reorganize CSS into core/utilities/components/pages structure
  - [ ] Create core/ directory for variables, reset, base
  - [ ] Create utilities/ directory for layout, spacing, typography, states
  - [ ] Create components/ directory for buttons, cards, forms, badges, modals
  - [ ] Create pages/ directory for page-specific styles
  - [ ] Create main.css to import all files in correct order
- [ ] Implement BEM-like modifier patterns
  - [ ] Convert .button variants to .button--primary, .button--danger
  - [ ] Convert .card variants to .card--hover, .card--selected
  - [ ] Update HTML to use new modifier classes
- [ ] Optimize selector specificity
  - [ ] Reduce overly specific selectors
  - [ ] Group similar properties
  - [ ] Create transition utility groups
- [ ] Implement critical CSS splitting
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

### Release Preparation

#### Branch: `feat/v1-release`

**Release**

- [ ] Submit to Mozilla addon store
- [ ] Create signed release builds
- [ ] Write installation guide
- [ ] Test full user journey
- [ ] Tag v1.0 release

---
