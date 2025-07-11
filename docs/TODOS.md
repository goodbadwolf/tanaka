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

> **Note: v3 Design Elements to Preserve**

- Colors: #6366f1 (primary), #8b5cf6 (secondary), #0a0a0b (dark bg), #0f0f10 (surface)
- UI: Purple gradient buttons, glowing effects, card-based layout, smooth animations

### Branch: `docs/operational-basics`

#### Basic Documentation

- [ ] Write simple deployment steps
- [ ] Document backup/restore process
- [ ] List common issues and fixes

### Branch: `chore/update-cargo-test-references`

#### Update cargo test to cargo nextest

- [ ] Update .github/workflows/ci.yml to use cargo nextest run
- [ ] Check all documentation files for cargo test references
- [ ] Update any scripts that use cargo test
- [ ] Verify pre-commit hooks use nextest

### Branch: `docs/git-best-practices`

#### Git Best Practices Documentation

- [ ] Document that `git add -A` should never be used
- [ ] Explain why it stages unintended files
- [ ] Show alternatives: `git add <specific-files>` or `git add -p`
- [ ] Update CLAUDE.md with this guideline
- [ ] Add to contributor documentation

### Branch: `fix/memory-leaks`

#### Fix Memory Leaks & Performance

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

#### Error Recovery

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

### ~~Branch: `feat/mantine-setup`~~ (COMPLETED - Merged to main)

#### Setup Mantine (UI Redesign - build components iteratively as needed)

> **NOTE**: Pick one item at a time when working, and commit it when finished after confirmation from the user. Only then move on to the next one

- [x] Install Mantine and dependencies
- [x] Basic theme configuration (colors from v3 prototype)
- [x] Add theme switching support (light/dark)
- [x] Create UI component playground for development
- [x] Enhance theme config with v3 colors (#6366f1, #8b5cf6)
- [x] Add multiple styling approaches (CSS classes, CSS-in-JS, CSS modules)
- [x] Implement recommended hybrid styling pattern:
  - Create `extension/src/playground/styles/` folder for CSS files
  - Use plain CSS for base styles (visible in DevTools)
  - Use styles prop for dynamic/interactive behavior
  - Example: `className="playground-button"` + `styles={{ root: { '&:hover': {...} } }}`
- [x] Implement dual-theme system with v3 and cyberpunk themes:
  - Reorganized existing theme as 'v3' in dedicated folders
  - Created cyberpunk theme with neon colors and futuristic design
  - Added theme switching via SegmentedControl
  - Implemented theme-specific CSS scoping
  - Updated ThemeProvider for dynamic theme selection
- [x] Implement gradient buttons and glowing card effects (in both themes)
- [x] Add DevTools-friendly data attributes for component identification
- [x] Create styling utility functions for reusable patterns
- [x] Add full-page gradient background to playground:
  - CSS class: `.playground-container` with `min-height: 100vh`
  - Background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
  - Apply to Container with `size="lg"` and `padding: 2rem`
- ~~[ ] Implement animated gradients with keyframes:~~ (Skipped - not needed)
  - ~~4-color gradient: `#ee7752, #e73c7e, #23a6d5, #23d5ab`~~
  - ~~Animation: `gradient 15s ease infinite` with `backgroundSize: 400% 400%`~~
  - ~~Keyframes: 0% → 50% → 100% background position transitions~~
- [x] Create debugStyles utilities:
  - `getClassName: (component, variant) => \`tnk-${component}${variant ? \`--${variant}\` : ''}\``
  - `createStyledComponent` that adds `data-styled-component` attribute and `displayName`
  - Example: `GradientButton` with pink gradient (#FE6B8B → #FF8E53), 48px height
- [x] Add dynamic theme-aware styling examples:
  - Dark mode: `linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)`
  - Light mode: `linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)`
  - Using `isDark = colorScheme === 'dark'` pattern
- [x] Show combined styling approaches (CSS + styles prop):
  - `.glowing-card` with glass morphism: `backdrop-filter: blur(10px)`, `rgba(255, 255, 255, 0.1)` bg
  - `.custom-button` with gradient: `linear-gradient(45deg, #fc466b 0%, #3f5efb 100%)`
  - Hover effects: `translateY(-2px)`, `box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2)`
  - Pink outline button with dynamic hover state switching
- [x] Add CSS effects and utilities:
  - Text gradient: `linear-gradient(45deg, #f093fb 0%, #f5576c 100%)` with `-webkit-background-clip`
  - White theme toggle button with `rgba(255, 255, 255, 0.9)` background
  - Title with `textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'`
  - Data attributes pattern: `data-component="example-card"` with hover tooltip in debug mode

### Branch: `feat/popup-redesign`

#### Popup Redesign

- [ ] Set up MantineProvider in popup entry point
- [ ] Get popup page working end-to-end with Mantine
- [ ] Window list with tracking toggles
- [ ] Sync status indicator with live animation
- [ ] Quick action buttons (Track Window, Sync Now)
- [ ] Theme toggle in header
- [ ] Build components inline as needed

### Branch: `feat/settings-redesign`

#### Settings Redesign

- [ ] Set up MantineProvider in settings entry point
- [ ] Tabbed interface (General, Sync, Devices, Advanced, About)
- [ ] Theme toggle in header
- [ ] Server configuration form
- [ ] Device management list
- [ ] Extract shared components if patterns emerge

### Branch: `feat/remaining-pages`

#### Additional Pages

- [ ] Onboarding flow (if needed)
- [ ] Error states with troubleshooting
- [ ] Empty states for no windows/tabs
- [ ] Continue building components as required

### Branch: `feat/ui-polish`

#### Polish & Refactor

- [ ] Extract truly reusable components
- [ ] Optimize bundle size (target < 150KB)
- [ ] Performance improvements (TTI < 200ms, smooth 60fps)
- [ ] Visual consistency pass
- [ ] Firefox compatibility testing
- [ ] Improve error messages with better copy
- [ ] Add tooltips for complex features
- [ ] Add keyboard navigation support

### Branch: `chore/postcss-setup`

#### PostCSS Configuration

- [ ] Add PostCSS configuration for advanced CSS features
- [ ] Install postcss, postcss-loader, and autoprefixer
- [ ] Configure PostCSS for Mantine UI optimizations
- [ ] Test CSS modules and vendor prefixing

### Branch: `feat/code-cleanup`

#### Code Quality

- [ ] Fix TypeScript strict mode issues
- [ ] Increase test coverage to 80%
- [ ] Remove dead code
- [ ] Update dependencies

### Branch: `feat/v1-release`

#### Release

- [ ] Submit to Mozilla addon store
- [ ] Create signed release builds
- [ ] Write installation guide
- [ ] Test full user journey
- [ ] Tag v1.0 release

### Branch: `docs/design-system-planning`

#### Design System Architecture Planning

- [ ] Review DESIGN_SYSTEM_SPEC.md and evaluate transformation scope
- [ ] Create implementation roadmap with dependencies on SCSS migration Phase 3
- [ ] Define migration strategy from playground to design system
- [ ] Document breaking changes and backward compatibility approach

### Branch: `feat/scss-phase-2.5` (COMPLETED - Merged to main)

#### SCSS Migration Phase 2.5: Styling Architecture Cleanup

See [SCSS_ROADMAP.md](./SCSS_ROADMAP.md) for detailed implementation.

- [x] Clean slate - removed old webapp, settings, popup implementations
- [x] Established new architecture with `.tnk-` prefix for all custom components
- [x] Migrated all playground components to SCSS with BEM methodology
- [x] Achieved 90% bundle size reduction (29MB → 2.8MB)
- [x] Created comprehensive styling guide and documentation
- [x] Implemented twilight theme with CSS variables
- [x] Removed all inline styles and CSS-in-JS usage

### Branch: `feat/scss-phase-3`

#### SCSS Migration Phase 3: Consolidation & Optimization

See [SCSS_ROADMAP.md](./SCSS_ROADMAP.md) for detailed implementation.

- [ ] Polish and finalize twilight and neon themes
- [ ] Add Dividers component
- [ ] Extract common patterns into mixins
- [ ] Consolidate duplicate styles
- [ ] Remove unused styles
- [ ] Performance testing

### Branch: `feat/scss-phase-4`

#### SCSS Migration Phase 4: Production Pages

See [SCSS_ROADMAP.md](./SCSS_ROADMAP.md) for detailed implementation.

- [ ] Implement new popup page with SCSS architecture
- [ ] Implement new settings page with SCSS architecture
- [ ] Apply consistent theme system
- [ ] Test with real extension data

---
