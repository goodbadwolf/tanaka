# Tanaka v3 Prototype TODOs

## 🚨 CRITICAL: THIS IS A PROTOTYPE - NO BACKWARD COMPATIBILITY! 🚨

**⚠️ EXTREMELY IMPORTANT ⚠️**
- **THIS IS A PROTOTYPE** - Break things freely!
- **NO BACKWARD COMPATIBILITY NEEDED** - Replace old classes directly
- **NO DUAL SELECTORS** - Just use the new BEM classes
- **BREAKING CHANGES ARE EXPECTED** - This is not production code
- **DELETE OLD CLASSES** - Don't maintain them alongside new ones

## Git Usage Instructions

### Branch Rules

- **ALWAYS**: Feature branches only, use `git add -p` (not `-A`), get confirmation for destructive ops (rm, restore, reset, rebase)
- **NEVER**: Commit/push to main, use `git add -A`
- **ALL** changes via pull request

### ⚠️ Task Completion = PR Ready

**Workflow:**

```bash
git checkout -b feat/your-task-name

# Work on each item and commit after EACH one
# Example: After completing item a
git add -p
git commit -m "feat: add scrollbar to index.html"

# After completing item b
git add -p
git commit -m "feat: delete tab-search page"

# Continue this pattern for ALL items

# Update TODO file before PR
git add -p prototype/v3/TODOS-V3.md
git commit -m "docs: mark task complete"

git push origin feat/your-task-name

# Create PR targeting feat/prototype-v3 (NOT main)
gh pr create --base feat/prototype-v3
```

**IMPORTANT**:

- ALWAYS COMMIT after completing EACH lettered item in a task. This creates a clear history and allows for easier rollback if needed.
- ALWAYS create PRs targeting `feat/prototype-v3` branch, NEVER `main`

**PR Requirements:**

1. ✅ All checkboxes complete (no partial PRs)
2. 📝 TODO file updated in your branch
3. 📋 Before merge: Review commits & update PR description
4. 🗑️ After merge: Delete local branch

## Progress Summary

- **Total Tasks**: 3 major refactoring tasks
- **Completed**: Task 1 (100%), Task 2.b (100%)
- **In Progress**: Task 2.c - Reusable HTML component templates
- **Pending**: Task 2.d-g, Task 3 (CSS consolidation)

## Pending Tasks

1. **Branch: `feat/remove-redundant-pages`** ✅ **COMPLETED**

   a. [x] Add a scrollbar to index.html
   b. [x] Delete tab-search
   c. [x] Delete window-details
   d. [x] Check all HTML files for links to removed pages
   e. [x] Update tanaka.js if it references removed pages
   f. [x] Verify no broken references remain
   g. [x] Test all remaining pages still work correctly
   h. [x] Update grid layout in index.html if needed
   i. [x] Use 4 columns in index
   j. [x] Consolidate pages that contain design items, but are not actual pages for the extension, into a single page.
   k. [x] Verify the consolidation

2. **Branch: `feat/refactor-v3-html-css-2`**

   **Goal**: Standardize HTML components with BEM methodology and prepare for CSS consolidation (Task 3).

   **⚠️ MANDATORY BackstopJS Testing ⚠️**:

   - **BEFORE STARTING**:
     1. Create backup copies of all HTML and CSS files:
        ```bash
        mkdir -p backup
        cp *.html backup/
        cp -r css backup/
        ```
     2. Update `backstop.json` to use backup files as reference
     3. Capture reference screenshots with `pnpm dlx backstopjs reference --config=backstop.json`
   - **AFTER EACH LETTERED ITEM**: Run `pnpm dlx backstopjs test --config=backstop.json`
   - **🛑 STOP if regression > 0.1%** - Do NOT proceed to next item
   - **🛑 STOP and investigate** any visual differences before continuing
   - **Expected**: 0% visual change (refactoring should be invisible)
   - **REMEMBER**: This is a prototype - REPLACE classes, don't add alongside!

   a. [x] Standardize component patterns across all HTML files
      - Identify all component variations (headers, cards, forms, buttons)
      - Document current naming inconsistencies
      - Plan unified component structure
      - ✅ **COMPLETED**: Created COMPONENT-ANALYSIS.md with comprehensive analysis of 22 component families
      - ✅ **SCOPE IDENTIFIED**: ~350 class changes required across 6 HTML files
      - ✅ **BEM STRUCTURE PLANNED**: 23 BEM blocks with 95+ modifiers defined
   b. [x] Implement consistent naming conventions (BEM methodology) - ✅ COMPLETE
      - Convert to BEM: .block__element--modifier
      - Update all HTML classes to follow BEM
      - Ensure self-documenting component names
      - ✅ **PHASE 1 COMPLETE**: 5/22 component families
        - Container/Layout System (container, container--main, container__content, etc.)
        - Header System (header, header--design, header__content, etc.)
        - Button System (button--primary, button--secondary)
        - Form System (form__group, form__label, form__input, etc.)
        - Utility/State System (u-text--meta, u-hidden, u-mt--xl, etc.)
      - ✅ **PHASE 2 COMPLETE**: 8/22 component families
        - Card System (card, card__badge, card__icon, card__title, card--prototype, etc.)
        - Icon System (icon icon--device, icon--empty, icon--large, etc.)
        - Badge System (badge, badge--warning)
      - ✅ **PHASE 3 COMPLETE**: 13/22 component families
        - Progress/Stepper System (progress__bar, stepper__step-line, etc.)
        - Animation System (animation__orb, scanner__window, etc.)
        - Live Indicator System (indicator--live, status__dot, etc.)
        - Navigation System (navigation__tabs, tab__entry, button--tab-active)
        - Notification/Toast System (toast--error, notification--inline, etc.)
      - ✅ **INFRASTRUCTURE COMPLETE**:
        - Desktop-only BackstopJS testing configured
        - Visual regression down to <1% for most pages
      - ✅ **PHASE 4 COMPLETE**: 22/22 component families complete (100%)
        - Modal/Overlay System ✅
        - Toggle/Switch System ✅
        - Empty State System ✅
        - Settings System ✅
        - Device Management System ✅
        - Status/Sync Status System ✅
        - Window Management System ✅
        - Tab System ✅
        - Timeline System ✅
      - 🎉 **ALL BEM CONVERSIONS COMPLETE!**
      - 📋 **PHASE 4 PLAN**: Complete BEM conversion for remaining components

        **Implementation Strategy**:
        - REPLACE old classes directly with new BEM classes
        - DELETE old class names from CSS files
        - Test with BackstopJS after each component (expect 0% regression)
        - Commit after each component family with message: `feat: implement BEM for [Component] System (X/22)`

        **Modal/Overlay System** (popup.html) ✅ COMPLETED
        - Current: `.track-overlay`, `.scanner__container`, `.scanner__window`
        - BEM: `overlay`, `overlay__scanner`, `overlay__window`
        - Modifiers: `overlay--active`, `overlay--scanning`

        **Toggle/Switch System** (popup.html, settings.html) ✅ COMPLETED
        - Current: `.toggle-switch`, `.toggle-switch--active`, `.toggle-group`
        - BEM: `toggle`, `toggle__switch`, `toggle__label`
        - Modifiers: `toggle--active`, `toggle--disabled`

        **Empty State System** (design-system.html) ✅ COMPLETED
        - Current: `.empty-title`, `.empty-description`, `.empty-hint`
        - BEM: `empty-state`, `empty-state__icon`, `empty-state__title`, `empty-state__description`
        - Modifiers: `empty-state--no-windows`, `empty-state--offline`

        **Settings System** (settings.html) ✅ COMPLETED
        - Current: `.settings-section`, `.settings-page`, `.section-header`
        - BEM: `settings`, `settings__section`, `settings__header`
        - Modifiers: `settings--danger`, `settings--advanced`

        **Device Management System** (settings.html, sync-history.html)
        - Current: `.device-list`, `.device-item`, `.device-status`
        - BEM: `device`, `device__list`, `device__item`, `device__status`
        - Modifiers: `device--active`, `device--inactive`, `device--current`

        **Status/Sync Status System** (multiple files)
        - Current: `.sync-status`, `.status__dot` (partial BEM)
        - BEM: `status`, `status__indicator`, `status__text`
        - Modifiers: `status--syncing`, `status--error`, `status--success`

        **Window Management System** (onboarding.html, popup.html)
        - Current: `.window-info`, `.window-details`, `.window-name`
        - BEM: `window`, `window__info`, `window__name`, `window__checkbox`
        - Modifiers: `window--tracked`, `window--selected`

        **Tab System** (popup.html)
        - Current: `.tab__entry`, `.tab__preview` (partial BEM)
        - BEM: `tab`, `tab__entry`, `tab__preview`, `tab__counter`
        - Modifiers: `tab--active`, `tab--pinned`

        **Timeline System** (sync-history.html)
        - Current: Already follows BEM but needs consistency check
        - Ensure all timeline classes strictly follow BEM pattern
        - Add missing modifiers for different event types

      - 📊 **PHASE 4 PRIORITY**:
        1. ~~Toggle/Switch System (HIGH - core UI interaction)~~ ✅ COMPLETED
        2. ~~Modal/Overlay System (HIGH - critical for tracking UX)~~ ✅ COMPLETED
        3. ~~Empty State System (MEDIUM - important for UX)~~ ✅ COMPLETED
        4. ~~Settings System (MEDIUM - page-specific)~~ ✅ COMPLETED
        5. ~~Device Management System (MEDIUM - feature-specific)~~ ✅ COMPLETED
        6. ~~Status/Sync Status System (MEDIUM - cross-file usage)~~ ✅ COMPLETED
        7. ~~Window Management System (MEDIUM - core feature)~~ ✅ COMPLETED
        8. ~~Tab System (MEDIUM - already partial BEM)~~ ✅ COMPLETED
        9. ~~Timeline System (LOW - already mostly BEM)~~ ✅ COMPLETED
   c. [ ] Create reusable HTML component templates
      - Extract common patterns into template snippets
      - Standardize component HTML structure
      - Remove duplicate HTML patterns
   d. [ ] Update design-system.html with all standardized components
      - Document all refactored components
      - Include usage examples with BEM classes
      - Show all variants and modifiers
   e. [ ] Add responsive and state utility classes to HTML
      - Add responsive utilities (.md:grid-2, .lg:hidden)
      - Add state variants (.hover:bg-primary)
      - Update HTML to use new utility classes
   f. [ ] Prepare CSS for consolidation (Task 3)
      - Identify CSS that needs to move to base/layout/components
      - Mark deprecated selectors for removal
      - Document CSS migration plan
   g. [ ] Test all pages after HTML refactoring
      - Verify all functionality works
      - Run visual regression tests with BackstopJS
      - Ensure no broken references or missing styles

3. **Branch: `feat/css-consolidation-blueprint`**

   **Goal**: Consolidate 10 CSS files (~3,342 lines) into 3-layer architecture with ~25% reduction through deduplication and modern tooling.

   **Prerequisites**:
   - ✅ Task 1 must be complete (remove redundant pages)
   - ⚠️ Task 2 must be complete (all BEM conversions done)
   - All HTML files must use consistent BEM naming

   **⚠️ MANDATORY BackstopJS Testing ⚠️**:
   - **BEFORE STARTING**: Capture baseline with `pnpm dlx backstopjs reference --config=backstop.json`
   - **AFTER EACH CSS LAYER**: Test with `pnpm dlx backstopjs test --config=backstop.json`
   - **🛑 STOP if ANY visual changes detected** - CSS consolidation must be invisible
   - **🛑 STOP if regression > 0.1%** - Investigate immediately
   - **Critical**: Test interactive states (toggles, tabs, hovers) for each component
   - **Expected**: 100% visual parity throughout consolidation

   **BEM Methodology Reference**:
   ```css
   .button { }              /* Block - standalone component */
   .button__icon { }        /* Element - part of block */
   .button--primary { }     /* Modifier - variant */
   .button__icon--spinning { } /* Element with modifier */
   ```

   a. [ ] Inventory existing CSS (Phase 1 - Complete inventory doc)
      - Install tooling: `pnpm add -D postcss cssstats stylelint purgecss`
      - Run `pnpm dlx cssstats css/**/*.css > analysis.json` for metrics
      - Run stylelint with duplicate detection config
      - Document ~25% duplication in resets, buttons, forms, animations
      - Tag selectors: reset styles → base.css, .grid-*/.flex-* → layout.css, .button/.card/.modal → components.css
   b. [ ] Create base.css (Phase 2 - Base layer consolidation)
      - Normalize/reset styles
      - CSS custom properties for design tokens:
        ```css
        /* Spacing (8pt Grid) */
        --space-1: 0.25rem;  /* 4px */
        --space-2: 0.5rem;   /* 8px */
        --space-3: 0.75rem;  /* 12px */
        --space-4: 1rem;     /* 16px */
        --space-5: 1.5rem;   /* 24px */
        --space-6: 2rem;     /* 32px */
        --space-8: 3rem;     /* 48px */
        --space-10: 4rem;    /* 64px */

        /* Color Tokens */
        --c-primary-400: #818cf8;
        --c-primary-500: #6366f1;
        --c-primary-600: #4f46e5;
        --c-surface-50: #fafafa;
        --c-surface-100: #f4f4f5;
        --c-surface-900: #18181b;
        ```
      - Base element styles
      - Motion-curve variables
   c. [ ] Create layout.css (Phase 3 - Layout helpers & utilities)
      - Grid/flexbox systems
      - Responsive breakpoints
      - Spacing utilities using 8pt scale variables
      - Container rules
   d. [ ] Create components.css (Phase 4 - Component core set)
      - All UI components using BEM methodology
      - Deduplicate using CSS nesting:
        ```css
        /* Example: Consolidate button variants */
        .button {
          /* base styles */
          &--primary { }
          &--secondary { }
          &:disabled { }
        }
        ```
      - Components: buttons, forms, cards, modals, navigation
      - Component-specific animations
      - Extract hardcoded values to CSS custom properties
   e. [ ] Purge unused CSS
      - Configure PurgeCSS/Lightning CSS integration
      - Scan HTML templates for used selectors
      - Remove orphaned rules (target ~25% reduction)
      - Verify no essential styles removed
      - Inline critical CSS for performance
   f. [ ] Refactor HTML to use new class names
      - Replace legacy class names with BEM conventions
      - Remove all inline styles
      - Update all HTML files to unified naming scheme
      - Ensure self-documenting component names
   g. [ ] Set up PostCSS pipeline
      ```javascript
      // postcss.config.cjs
      module.exports = {
        plugins: [
          'postcss-import',      // Inline @imports
          'postcss-nesting',     // Native CSS nesting
          'autoprefixer',        // Browser compatibility
          'cssnano'             // Minification
        ]
      }
      ```
   h. [ ] CI build integration (Phase 5)
      - Bundle base.css + layout.css + components.css
      - Minify into app.min.css for production
      - Fast hot-reloading for development
      - Run Lighthouse tests for performance metrics
      - Ensure CLS/FCP/TTI delta ≤ 5%
   i. [ ] Visual regression testing & Documentation
      - Final BackstopJS test: `pnpm dlx backstopjs test --config=backstop.json`
      - Verify no unintended visual changes
      - Update reference images if changes are intentional
      - Document benefits achieved:
        * Clear file organization (3 layers vs 10 files)
        * Consistent BEM naming
        * ~25% smaller bundle size
        * Single source of truth for design tokens
        * Self-documenting components
        * Theme switching ready via CSS properties

## Notes & Reminders

- **CSS Files**: Currently 10 files in `css/` directory totaling ~3,342 lines
- **HTML Files**: 6 main pages (popup, settings, onboarding, sync-history, design-system, index)
- **BackstopJS**: Test configuration in `backstop.json` with 11 scenarios
- **Component Count**: 22 total component families identified
- **BEM Progress**: 13/22 complete (59%), 9/22 remaining (41%)
- **Commit Pattern**: One commit per component/subtask, descriptive messages
- **NO DUAL SELECTORS**: This is a prototype - replace classes directly!
