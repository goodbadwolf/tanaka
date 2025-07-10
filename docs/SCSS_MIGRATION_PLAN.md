# SCSS Migration Plan for Tanaka Extension

## Executive Summary

This document outlines a comprehensive plan to migrate the Tanaka extension's styling from duplicated CSS files to a modular SCSS architecture. The migration will reduce code duplication by 70-90%, improve maintainability, and enable proper BEM methodology while maintaining compatibility with Mantine's component system.

**Theme Strategy**: The initial migration will implement a single theme called "twilight" (working name). Additional themes will be added in later stages once the core architecture is established.

## Architecture Overview

### SCSS Folder Structure

```
extension/src/
├── styles/
│   ├── _variables.scss          # Design tokens (spacing, breakpoints, z-index)
│   ├── _mixins.scss             # Reusable mixins and functions
│   ├── _animations.scss         # Keyframe animations
│   ├── _shared.scss             # Base styles and resets
│   └── themes/
│       ├── _base.scss           # Theme structure and mixins
│       ├── _twilight.scss       # Twilight theme CSS variables
│       └── _all.scss            # Theme orchestrator - applies themes based on attributes
│
├── components/                  # Shared components (kebab-case)
│   ├── button/
│   │   ├── button.tsx
│   │   └── button.scss          # BEM: .tanaka-button
│   ├── card/
│   │   ├── card.tsx
│   │   └── card.scss            # BEM: .tanaka-card
│   ├── page-header/             # Existing component
│   ├── theme-toggle/            # Existing component
│   └── toggle/                  # Existing component
│
└── [app]/                       # App-specific structure
    ├── components/              # App-specific components
    │   └── [component]/
    │       ├── component.tsx
    │       └── component.scss
    └── [app].scss               # App entry point styles
```

Examples:
- `playground/playground.scss` imports what it needs
- `popup/popup.scss` will be lightweight
- `settings/settings.scss` will be full-featured

### Entry Point Strategy

Each app imports only what it needs, no central bundles:

#### Playground (Development Environment)
```scss
// playground/playground.scss
@use "../styles/themes/all";  // Imports all themes and applies based on data attribute
@use "../styles/animations";
// Import specific components as needed
```

#### Popup (Lightweight)
```scss
// popup/popup.scss (future)
@use "../styles/themes/all";  // Even lightweight apps need theme
// Minimal imports for performance
```

#### Settings (Full Featured)
```scss
// settings/settings.scss (future)
@use "../styles/themes/all";
@use "../styles/animations";
// More components and features
```

### SCSS Architecture Patterns

#### Shared Foundation Files

```scss
// _shared.scss - Variables, base styles, and animations

// ===== Variables =====
// Global design tokens
$base-spacing: 8px;
$border-radius-base: 4px;
$transition-base: 0.3s ease;
$font-family-base: system-ui, -apple-system, sans-serif;

// Spacing scale
$spacing-scale: (
  "xs": $base-spacing * 0.5,
  // 4px
  "sm": $base-spacing,
  // 8px
  "md": $base-spacing * 2,
  // 16px
  "lg": $base-spacing * 3,
  // 24px
  "xl": $base-spacing * 4,
  // 32px
  "xxl": $base-spacing * 6 // 48px,,,,,
);

// Z-index scale
$z-index: (
  "dropdown": 1000,
  "modal": 1050,
  "popover": 1060,
  "tooltip": 1070,
);

// Breakpoints
$breakpoints: (
  "sm": 640px,
  "md": 768px,
  "lg": 1024px,
  "xl": 1280px,
);

// ===== Base Styles =====
// Reset
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: $font-family-base;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

// Typography
h1,
h2,
h3,
h4,
h5,
h6 {
  margin: 0 0 map-get($spacing-scale, "md");
  font-weight: 600;
  line-height: 1.2;
}

// Root CSS variables
:root {
  --spacing-unit: #{$base-spacing};
  --border-radius: #{$border-radius-base};
  --transition: #{$transition-base};
}

// ===== Animations =====
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 currentColor;
  }
  70% {
    box-shadow: 0 0 0 10px transparent;
  }
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

```scss
// _mixins.scss - All mixins and functions

// ===== Functions =====
@function spacing($key) {
  @return map-get($spacing-scale, $key);
}

@function z($key) {
  @return map-get($z-index, $key);
}

// ===== Mixins =====
// Responsive mixin
@mixin respond-to($breakpoint) {
  @if map-has-key($breakpoints, $breakpoint) {
    @media (min-width: map-get($breakpoints, $breakpoint)) {
      @content;
    }
  }
}

// Button base
@mixin button-base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: spacing("md") spacing("lg");
  border: none;
  border-radius: $border-radius-base;
  font-family: $font-family-base;
  font-weight: 500;
  cursor: pointer;
  transition: all $transition-base;
  position: relative;
  overflow: hidden;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// Glow effect
@mixin glow-effect($color, $intensity: 8px) {
  box-shadow: 0 0 $intensity $color, 0 0 $intensity * 2 $color, inset 0 0 $intensity * 0.5 $color;
}

// Gradient text
@mixin gradient-text($gradient) {
  background: $gradient;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

// Theme variant helper (for future theme additions)
@mixin theme-variant($theme-name) {
  .theme-#{$theme-name} & {
    @content;
  }
}

// Glass morphism
@mixin glass-morphism($bg-opacity: 0.1, $blur: 10px) {
  background: rgba(255, 255, 255, $bg-opacity);
  backdrop-filter: blur($blur);
  -webkit-backdrop-filter: blur($blur);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

// Debug mode
@mixin debug-mode {
  .debug-mode & {
    position: relative;

    &::after {
      content: attr(data-component);
      position: absolute;
      top: 0;
      right: 0;
      background: rgba(255, 0, 0, 0.8);
      color: white;
      padding: 2px 8px;
      font-size: 11px;
      pointer-events: none;
    }
  }
}

// Pulse effect
@mixin pulse-effect($color) {
  &.pulse-effect {
    animation: pulse 2s infinite;
    color: $color;
  }
}
```

#### Component Structure Example

```scss
// components/card/card.scss
@use "../../styles/mixins" as m;
@use "../../styles/variables" as *;

.tanaka-card {
  padding: m.spacing("lg");
  border-radius: $border-radius-base * 2;
  transition: all $transition-base;

  // BEM elements
  &__header {
    margin-bottom: m.spacing("md");
  }

  &__content {
    line-height: 1.6;
  }

  // BEM modifiers
  &--glass {
    @include m.glass-morphism();
  }

  &--glowing {
    @include m.glow-effect(var(--twilight-glow-color));
  }
}
```

#### Theme Implementation

```scss
// themes/_twilight.scss
@use "base" as base;

$twilight-colors: (
  "primary": #6366f1,
  "primary-light": #818cf8,
  "primary-dark": #4f46e5,
  "secondary": #8b5cf6,
  "secondary-light": #a78bfa,
  "secondary-dark": #7c3aed,
  "background": #0a0a0b,
  "surface": #0f0f10,
  "text": #ffffff,
  "text-muted": rgba(255, 255, 255, 0.7),
  "accent": #a78bfa,
  "accent-dark": #7c3aed,
);

.theme-style-twilight {
  @include base.apply-theme($twilight-colors);

  // Twilight-specific component overrides
  .custom-button {
    background: linear-gradient(45deg, var(--color-primary), var(--color-secondary));
  }
}

// themes/_base.scss
@mixin apply-theme($colors) {
  // Set CSS custom properties for the theme
  @each $key, $value in $colors {
    --color-#{$key}: #{$value};
  }

  // Component-specific variables
  --button-bg: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  --card-bg: var(--color-surface);
  --glow-color: var(--color-primary-light);
}
```

## Migration Strategy

### Phase 1: Foundation ✅ (COMPLETED)

- ✅ Install dependencies: `sass`, `sass-loader`, `postcss`, `autoprefixer`
- ✅ Configure Rspack for SCSS
- ✅ Set up source maps for debugging
- ✅ Configure PostCSS with modern CSS features
- ✅ Install and configure Stylelint for SCSS linting
- ✅ Test SCSS compilation successfully

### Phase 2: Component Migration ✅ (COMPLETED)

#### Completed Steps

- ✅ Minimal Playground Setup
- ✅ Theme Switching (partial - see Outstanding Tasks)
- ✅ StyledExample Component
- ✅ StylingUtilsExample Component
- ✅ DebugStylesExample Component
- ✅ Add Toggle Button
- ✅ Extract and organize common patterns

### Phase 2.5: Styling Architecture Cleanup (IN PROGRESS - Steps 4-8 NEXT)

The current codebase has a jumbled mix of styling approaches:
- SCSS files with imports and mixins
- Plain CSS files
- CSS Modules (in deprecated folder)
- Inline styles
- CSS-in-JS (Mantine styles prop)
- Utility functions generating styles

This phase will establish a clean, consistent styling architecture using **SCSS + Mantine CSS Variables**.

#### Step 0: Clean Slate - Remove Old Implementations ✅ COMPLETED

Since we are redesigning a huge chunk of the UI, start by removing old code:

- [x] Delete webapp implementation (old routing system)
- [x] Delete settings page implementation
- [x] Delete popup page implementation  
- [x] Delete all deprecated components folder
- [x] Remove all imports of deprecated components
- [x] Clean up orphaned CSS/SCSS files

This gives us a clean slate to rebuild with consistent patterns.

#### Step 1: Audit and Document Current State ✅ COMPLETED

- [x] Create comprehensive list of all styling approaches currently in use ✅
- [x] Document which components use which styling method ✅
- [x] Identify style duplication across different systems ✅
- [x] Map all hardcoded colors/values that should use theme tokens ✅
- [x] List all deprecated components still being imported ✅

**Output**: Created comprehensive audit document at `docs/SCSS_AUDIT.md`

#### Step 2: Establish New Architecture Principles

**Core Principles:**
1. **Mantine components** - Use built-in props only (no styles/sx props)
2. **Custom components** - Use SCSS files with BEM methodology
3. **Theme values** - Reference Mantine CSS variables exclusively
4. **No inline styles** - All styles in SCSS files
5. **No CSS-in-JS** - Remove all runtime style generation
6. **Global CSS classes** - Use `.tanaka-` prefix for all custom components (no CSS modules)
7. **Explicit naming** - Direct class names for searchability and clarity

**File Structure:**
```
src/
├── styles/
│   ├── _variables.scss      # Design tokens
│   ├── _mixins.scss         # Reusable mixins
│   ├── _animations.scss     # Keyframes
│   └── themes/
│       ├── _base.scss       # Theme structure
│       └── _twilight.scss   # Twilight theme
│
└── components/              # Flat structure, kebab-case
    ├── button/
    │   ├── button.tsx
    │   └── button.scss      # Contains .tanaka-button class
    └── [component]/
        ├── [component].tsx
        └── [component].scss # Contains .tanaka-[component] class
```

**CSS Class Naming Convention:**
```scss
// ALWAYS use .tanaka- prefix for custom components
.tanaka-button {
  // Component styles

  // BEM elements
  &__icon { }        // .tanaka-button__icon
  &__label { }       // .tanaka-button__label

  // BEM modifiers  
  &--primary { }     // .tanaka-button--primary
  &--large { }       // .tanaka-button--large
}

// Why this approach:
// ✅ Prevents conflicts with Mantine or third-party styles
// ✅ Searchable - find "tanaka-button" across entire codebase
// ✅ Explicit - what you write is what you get in DevTools
// ✅ No CSS modules complexity or generated class names
```

#### Step 3: Create Twilight Theme with CSS Variables ✅ COMPLETED

**3.1 Implementation Tasks:**

- [x] Create `styles/themes/_base.scss` with theme application mixin ✅
- [x] Create `styles/themes/_twilight.scss` with theme variable definitions ✅
- [x] Create `styles/themes/_all.scss` to orchestrate theme application ✅
- [x] Define Mantine color scale overrides (primary, secondary, gray scales) ✅
- [x] Create custom theme variables for gradients, shadows, and effects ✅
- [x] Update playground/playground.scss to import themes/all ✅
- [x] Update playground index.html to include theme attribute ✅
- [x] Test theme application and CSS variable cascade ✅

**3.2 Theme Structure:**

```scss
// themes/_base.scss
@mixin apply-theme($theme-map) {
  @each $key, $value in $theme-map {
    --#{$key}: #{$value};
  }
}

// themes/_twilight.scss
$twilight-theme: (
  // Mantine color overrides
  "mantine-color-primary-0": #f5f3ff,
  "mantine-color-primary-6": #7c3aed,
  // ... all color scales

  // Custom theme variables
  "twilight-gradient-primary": linear-gradient(135deg, #6366f1, #8b5cf6),
  "twilight-shadow-glow": 0 0 20px rgba(139, 92, 246, 0.3),
);

// themes/_all.scss - The orchestrator
@use "base";
@use "twilight";

// Set default theme on root
:root {
  @include base.apply-theme(twilight.$twilight-theme);
}

// Apply theme based on data attribute
[data-theme-style="twilight"] {
  @include base.apply-theme(twilight.$twilight-theme);
}

// Future themes will be added here
// [data-theme-style="midnight"] {
//   @include base.apply-theme(midnight.$midnight-theme);
// }
```

This ensures:
- Default theme is always applied to `:root`
- Theme can be explicitly set via data attribute
- All CSS variables are properly cascaded
- Easy to add new themes later

#### Step 4: Migrate Playground Components to New System ✅ COMPLETED

**Completed Tasks:**

- [x] Remove all inline styles from major playground components ✅
- [x] Create dedicated SCSS file using BEM methodology ✅
- [x] Replace hardcoded values with CSS variables ✅
- [x] Use Mantine's built-in props for variants/sizes ✅
- [x] Keep truly dynamic values as inline styles (colors, spacing) ✅

**Components Migrated:**
1. **PlaygroundHeader** - `playground-header.scss`
2. **ThemeTest** - `theme-test.scss`
3. **Overview Section** - `overview.scss`
4. **Typography Section** - `typography.scss`
5. **Spacing Section** - `spacing.scss`
6. **Colors Section** - `colors.scss`
7. **PlaygroundApp** - `playground-app.scss`

**Additional Components Migrated (Styles Props Removed):**
8. **PlaygroundNav** - `playground-nav.scss` ✅
9. **PlaygroundSearch** - `playground-search.scss` ✅
10. **ThemeStyleSwitcher** - `theme-style-switcher.scss` ✅

**Still TODO:**
- [ ] Test in both light/dark modes thoroughly

**Component Structure Fix (Additional work completed):**
- [x] Reorganized all playground components from flat structure to folder structure ✅
- [x] Created kebab-case folders for each component ✅
- [x] Moved component files into their respective folders ✅
- [x] Created missing SCSS files for ComponentExample and PlaygroundSection ✅
- [x] Added index.ts barrel exports per user preference (deviation from original plan) ✅
- [x] Updated all import statements to use new paths ✅

**Migration Pattern Used:**
```scss
// Before (inline styles)
<Box style={{ padding: 16, background: '#6366f1' }} />

// After (SCSS + CSS variables)
<Box className="tanaka-component__element" />

// component.scss
.tanaka-component {
  &__element {
    padding: var(--mantine-spacing-md);
    background: var(--mantine-color-primary-6);
  }
}
```

#### Step 5: Update Component Library ✅ COMPLETED

**Note**: This step was completed as part of Step 0 cleanup:
- [x] Deprecated components were deleted entirely (not migrated) ✅
- [x] CSS Modules removed with deprecated components ✅
- [x] Imports cleaned up after deletion ✅
- [x] Component API consistency will be ensured when building new components ✅
- [x] Playground already serves as component documentation ✅

#### Step 6: Consolidate Styling Utilities

- [ ] Remove `styling-utils.ts` programmatic style generation
- [ ] Convert useful utilities to SCSS mixins
- [ ] Delete redundant gradient/shadow definitions
- [ ] Create single source of truth for each style pattern
- [ ] Document when to use mixins vs CSS variables

#### Step 7: Optimize Bundle Size

- [ ] Remove all unused CSS/SCSS files
- [ ] Set up PurgeCSS for production builds
- [ ] Eliminate duplicate style definitions
- [ ] Tree-shake Mantine components not in use
- [ ] Measure before/after bundle sizes

#### Step 8: Documentation and Guidelines

- [ ] Create comprehensive styling guide
- [ ] Document CSS variable naming conventions
- [ ] Provide migration examples for common patterns
- [ ] Set up linting rules for style consistency
- [ ] Create component styling template

#### Success Criteria

- ✅ Zero inline styles in components
- ✅ No CSS-in-JS usage
- ✅ All colors/spacing use CSS variables
- ✅ Consistent BEM methodology with `.tanaka-` prefix
- ✅ Global CSS classes (no CSS modules)
- ✅ Single styling approach per component
- ✅ Theme switches without flicker
- ✅ Reduced bundle size by 30%+
- ✅ All custom classes searchable with `.tanaka-` prefix

#### Estimated Timeline: 2-3 days

This cleanup is critical before proceeding with Phase 3, as it will establish the foundation for all future component development.

### Phase 3: Consolidation & Optimization (PENDING - After Phase 2.5)

- [ ] Polish and finalize twilight and neon themes (remove test aspects from neon)
- [ ] Add Dividers component
- [ ] Extract common patterns into mixins
- [ ] Consolidate duplicate styles
- [ ] Create proper file organization
- [ ] Remove unused styles
- [ ] Minimize bundle size
- [ ] Performance testing

### Phase 4: Production Pages (PENDING)

#### Popup Page
- [ ] Create new popup structure
- [ ] Build components as needed following guidelines
- [ ] Apply twilight theme
- [ ] Implement window tracking UI
- [ ] Test with real extension data

#### Settings Page  
- [ ] Create new settings structure
- [ ] Build components as needed following guidelines
- [ ] Apply twilight theme
- [ ] Implement server configuration UI
- [ ] Test all settings functionality

#### Component Guidelines (When Building)
- Each component gets its own folder in `components/[component-name]/` (kebab-case)
- Component folder contains `[component-name].tsx` and `[component-name].scss`
- **CRITICAL**: Use `.tanaka-` prefix for ALL component classes (global CSS, no modules)
- Use BEM naming: `.tanaka-button`, `.tanaka-button__icon`, `.tanaka-button--primary`
- Reference only CSS variables, no hardcoded colors
- No inline styles or CSS-in-JS
- Export from component file directly (no index.ts barrel exports) *[Updated per user preference: index.ts files added for easier imports]*

**Example Component Structure:**
```tsx
// button/button.tsx
import './button.scss';

export function Button({ variant = 'default', children }) {
  return (
    <button className={`tanaka-button tanaka-button--${variant}`}>
      {children}
    </button>
  );
}
```

```scss
// button/button.scss
.tanaka-button {
  // Base styles using CSS variables
  padding: var(--mantine-spacing-sm) var(--mantine-spacing-md);

  &--primary {
    background: var(--twilight-gradient-primary);
  }
}
```

#### Final Cleanup
- [ ] Remove all old CSS files
- [ ] Update imports throughout codebase
- [ ] Final testing

## Outstanding Tasks

### Design System Foundation

- [ ] Create `_tokens.scss` with maps for colors, spacing, radii, shadows
- [ ] Implement `token($map, $key)` helper function for accessing design tokens
- [ ] Set up CSS variables generation at build time for design tokens
- [ ] Move spacing utilities into `_spacing.scss`
- [ ] Extract shared keyframes to `_animations.scss`

### Theme System

- [ ] Replace DOM classList manipulation with CSS variables approach
- [ ] Add validation for theme settings loaded from localStorage
- [ ] Implement error handling for corrupted theme data
- [ ] Create migration strategy for theme schema changes
- [ ] Add memoization for theme-related calculations
- [ ] Prevent unnecessary reflows during theme changes
- [ ] Override CSS variables under `.theme-style-twilight` scope
- [ ] Implement theme inheritance and composition patterns
- [ ] Use CSS custom properties for theming instead of class-based approach
- [ ] Create centralized theme configuration with TypeScript validation

### CSS Architecture

- [ ] Adopt consistent CSS methodology (BEM or SMACSS)
- [ ] Establish consistent naming convention across all styles
- [ ] Eliminate theme-specific selectors that create tight coupling
- [ ] Remove styles that depend on specific DOM structure
- [ ] Extract common theme utilities into shared modules
- [ ] Extract shared base styles from theme-specific styles
- [ ] Implement proper style inheritance between themes
- [ ] Remove duplicate selectors and properties across themes

### Component Patterns

- [ ] Create gradient-bg mixin: `@mixin gradient-bg($start, $end)`
- [ ] Convert custom-button and glowing-card to parameterized mixins
- [ ] Refactor custom button styles to use parameterized mixin
- [ ] Replace duplicated .custom-button rules with color-parameterized mixin
- [ ] Ensure theme-agnostic component styles stay out of `themes/` directory
- [ ] Build shared component library with documentation
- [ ] Create proper folder structure with clear module boundaries

### Performance & Optimization

- [ ] Add React.memo to components that receive theme props
- [ ] Use useMemo for expensive theme calculations
- [ ] Implement useCallback for theme-related event handlers
- [ ] Add lazy loading for theme-specific assets
- [ ] Memoize themedGradients and themedShadows calculations
- [ ] Enable PurgeCSS on playground & webapp targets
- [ ] Add code splitting and performance optimizations

### Build Pipeline

- [ ] Enable CSS Modules only for component-scoped files
- [ ] Keep global utilities in non-module path
- [ ] Implement CSS modules or scoping strategy for playground styles
- [ ] Replace global CSS imports with scoped alternatives
- [ ] Add stylelint-order plugin for consistent property ordering
- [ ] Add stylelint-scss plugin for SCSS-specific linting rules

### Browser Compatibility

- [ ] Replace color-mix CSS with proper color manipulation library
- [ ] Add fallbacks for older browser support
- [ ] Ensure Firefox compatibility for all color utilities

### TypeScript Integration

- [ ] Generate SCSS token JSON for importing into TypeScript
- [ ] Create typed ThemeToken enum for autocomplete support
- [ ] Replace Record<string, unknown> with proper typed interfaces
- [ ] Add runtime validation for theme configurations
- [ ] Implement type guards for theme-related types
- [ ] Add type assertions where necessary
- [ ] Define strict types for styles parameter in createDebugComponent

### Module Organization

- [ ] Remove dynamic imports from styling-utils.ts themed function
- [ ] Restructure modules to eliminate circular dependencies
- [ ] Use proper ES6 imports instead of require() for tree-shaking
- [ ] Consolidate utility helper files into single module
- [ ] Split stylingUtils into separate modules by responsibility
- [ ] Apply single responsibility principle to each utility module
- [ ] Merge debug helpers into single debug module
- [ ] Separate debug utilities from production code
- [ ] Create clear dev/production utility separation

### Code Cleanup

- [ ] Delete deprecated gradient/shadow helpers in styling-utils.ts
- [ ] Delete deprecated gradients._ and shadows._ helpers
- [ ] Delete deprecated helpers (already marked @deprecated)
- [ ] Create single source of truth for gradients/shadows
- [ ] Convert components.css and utilities.css to SCSS files

### Isolation & Production

- [ ] Prevent style leakage between playground and main extension
- [ ] Ensure playground styles are isolated from production code
- [ ] Separate playground/example code from production utilities
- [ ] Migrate existing styles to new structure incrementally
- [ ] Create migration checklist for each duplicated utility

## Technical Details

### Build Configuration

#### Rspack/Webpack Configuration

```javascript
// rspack.config.js additions
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';

const isDev = process.env.NODE_ENV === 'development';

{
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          isDev ? "style-loader" : MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              modules: {
                auto: true,
                localIdentName: isDev
                  ? "[name]__[local]--[hash:base64:5]"
                  : "[hash:base64:8]",
              },
              sourceMap: isDev,
            },
          },
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [
                  "autoprefixer",
                  "postcss-preset-env",
                  !isDev && ["cssnano", { preset: "default" }],
                ].filter(Boolean),
              },
              sourceMap: isDev,
            },
          },
          {
            loader: "sass-loader",
            options: {
              implementation: require("sass"),
              sourceMap: isDev,
              sassOptions: {
                includePaths: ["src/playground/styles"],
              },
            },
          },
        ],
      },
    ],
  },
  plugins: [
    !isDev && new MiniCssExtractPlugin({
      filename: "[name].[contenthash].css",
      chunkFilename: "[id].[contenthash].css",
    }),
  ].filter(Boolean),
  optimization: {
    minimizer: [
      `...`, // Extend existing minimizers
      new CssMinimizerPlugin(),
    ],
    splitChunks: {
      cacheGroups: {
        styles: {
          name: "styles",
          type: "css/mini-extract",
          chunks: "all",
          enforce: true,
        },
      },
    },
  },
  devServer: {
    hot: true,
    liveReload: true,
    watchFiles: ["src/**/*.scss"],
  },
  devtool: isDev ? "source-map" : false,
}
```

### TypeScript Integration

#### Current TypeScript Utilities

The codebase includes extensive TypeScript styling utilities that need to remain functional:

1. **styling-utils.ts** provides:

   - BEM class name generators (`cn.bem`, `cn.component`)
   - Gradient generators (linear, radial, themed)
   - Shadow generators (box, glow, layered)
   - Animation helpers
   - Responsive utilities
   - Color manipulation functions

2. **debug-styles.ts** provides:
   - Component styling helpers
   - Theme-aware gradient functions
   - Styled component factory

#### SCSS-TypeScript Bridge

For utilities that need to work in both SCSS and TypeScript:

```scss
// _export-variables.scss
:export {
  primary-twilight: #6366f1;
  secondary-twilight: #8b5cf6;
  spacing-unit: 8px;
}
```

```typescript
// Import in TypeScript
import scssVars from "./styles/_export-variables.scss";

// Use in styling utilities
const primaryColor = scssVars["primary-twilight"];
```

### Migration Patterns

#### Inline Styles Migration

```tsx
// Current pattern
<Title
  style={{
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
  }}
>

// Migration approach: Use CSS classes
<Title className={cn.component('title')}>

// In SCSS
.tanaka-title {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);

  // Future theme variant example
  @include theme-variant("twilight") {
    text-shadow: 0 0 10px var(--color-primary-light);
  }
}
```

#### Styled Components Migration

```tsx
// Keep this pattern for dynamic styling
const DynamicButton = styled(Button)<{ intensity: number }>`
  box-shadow: 0 0 ${props => props.intensity}px currentColor;
`;

// Convert this to SCSS
export const GradientButton = debugStyles.createStyledComponent(Button, 'GradientButton', {
  root: { background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)' }
});

// Becomes
.gradient-button {
  background: linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%);
}
```

## Supporting Documentation

### VS Code Extensions (Recommended)

1. **Stylelint** - Real-time SCSS linting

   - Install: `dbaeumer.vscode-stylelint`

2. **SCSS IntelliSense** - Autocomplete for variables/mixins

   - Install: `mrmlnc.vscode-scss`

3. **SCSS Formatter** - Consistent code formatting

   - Install: `sibiraj-s.vscode-scss-formatter`

4. **CSS Peek** - Navigate to style definitions
   - Install: `pranaygp.vscode-css-peek`

### Stylelint Configuration

```json
// .stylelintrc.json
{
  "extends": ["stylelint-config-standard-scss"],
  "rules": {
    "scss/dollar-variable-pattern": "^[a-z][a-z0-9]*(-[a-z0-9]+)*$",
    "scss/at-mixin-pattern": "^[a-z][a-z0-9]*(-[a-z0-9]+)*$",
    "selector-class-pattern": "^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$",
    "max-nesting-depth": 3
  }
}
```

---

_This plan is a living document and will be updated as we progress through the migration._
