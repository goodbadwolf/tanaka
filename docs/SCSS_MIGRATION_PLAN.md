# SCSS Migration Plan for Tanaka Extension

## Executive Summary

This document outlines a comprehensive plan to migrate the Tanaka extension's styling from duplicated CSS files to a modular SCSS architecture. The migration will reduce code duplication by 70-90%, improve maintainability, and enable proper BEM methodology while maintaining compatibility with Mantine's component system.

## Architecture Overview

### SCSS Folder Structure

```
extension/src/styles/
├── _shared.scss                 # Variables, base styles, animations
├── _mixins.scss                 # All mixins and functions
│
├── components/
│   ├── _buttons.scss           # Button component & variants
│   ├── _cards.scss             # Card component & modifiers
│   ├── _forms.scss             # Input, select, etc.
│   ├── _gradients.scss         # Gradient text & backgrounds
│   ├── _layout.scss            # Container + grid + sections
│   └── _index.scss             # Component barrel export
│
├── themes/
│   ├── _base.scss              # Shared theme structure
│   ├── _v3.scss                # V3 variables + component overrides
│   └── _cyberpunk.scss         # Cyberpunk variables + overrides
│
├── webapp/
│   ├── _navigation.scss         # Route navigation UI
│   └── _mock-ui.scss            # Mock API indicators
│
├── extension/
│   └── _compact.scss            # Extension-specific optimizations
│
├── _utilities.scss              # All utilities (spacing, text, colors, display)
├── playground.scss              # Dev/testing bundle
├── webapp.scss                  # Webapp bundle (full features)
└── extension.scss               # Production extension bundle
```

### Bundle Entry Points

The project has three distinct bundle entry points for different use cases:

#### 1. **playground.scss** - Component Development & Testing

```scss
// For testing all components and themes
@use "shared";
@use "mixins" as m;

@use "utilities";
@use "components"; // via components/_index.scss (includes layout)

@use "themes/base";
@use "themes/v3";
@use "themes/cyberpunk";
```

#### 2. **webapp.scss** - Full Extension as Web Application

```scss
// Full extension experience with mocked browser APIs
@use "shared";
@use "mixins" as m;

@use "utilities";
@use "components";

@use "themes/base";
@use "themes/v3";
@use "themes/cyberpunk";

@use "webapp/navigation"; // Route navigation between pages
@use "webapp/mock-ui"; // Visual indicators for mocked APIs
```

#### 3. **extension.scss** - Production Firefox Extension

```scss
// Optimized for extension popup and settings
@use "shared";
@use "mixins" as m;

@use "utilities";
@use "components";

@use "themes/base";
@use "themes/v3";
@use "themes/cyberpunk";

@use "extension/compact"; // Space-efficient layouts
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

// Theme variant helper
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
// components/_cards.scss
@use "../mixins" as m;
@use "../shared";

.card {
  padding: m.spacing("lg");
  border-radius: shared.$border-radius-base * 2;
  transition: all shared.$transition-base;

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
    @include m.glow-effect(var(--glow-color));
  }
}
```

#### Theme Implementation

```scss
// themes/_v3.scss
@use "base" as base;

$v3-colors: (
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
);

.theme-style-v3 {
  @include base.apply-theme($v3-colors);

  // V3-specific component overrides
  .custom-button {
    background: linear-gradient(45deg, #fc466b 0%, #3f5efb 100%);
  }
}

// themes/_cyberpunk.scss
@use "base" as base;

$cyberpunk-colors: (
  "primary": #ff006e,
  "primary-light": #ff4494,
  "primary-dark": #d6005a,
  "secondary": #8338ec,
  "secondary-light": #a364ff,
  "secondary-dark": #6b1fd8,
  "background": #0a0a0f,
  "surface": #1a1a2e,
  "text": #ffffff,
  "text-muted": rgba(255, 255, 255, 0.7),
  "neon-green": #39ff14,
  "neon-blue": #00d4ff,
);

.theme-style-cyberpunk {
  @include base.apply-theme($cyberpunk-colors);

  // Cyberpunk-specific component overrides
  .custom-button {
    background: linear-gradient(45deg, var(--neon-pink), var(--neon-blue));
    text-transform: uppercase;
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

### Phase 2: Component Migration (IN PROGRESS)

#### Completed Steps ✅

- ✅ Minimal Playground Setup
- ✅ Theme Switching (partial - see Outstanding Tasks)
- ✅ StyledExample Component
- ✅ StylingUtilsExample Component
- ✅ DebugStylesExample Component

#### Remaining Steps

- [ ] Add Toggle Button
- [ ] Add Dividers
- [ ] Extract and organize common patterns
- [ ] Apply to extension popup and settings

### Phase 3: Consolidation & Optimization (PENDING)

- [ ] Extract common patterns into mixins
- [ ] Consolidate duplicate styles
- [ ] Create proper file organization
- [ ] Remove unused styles
- [ ] Minimize bundle size
- [ ] Performance testing

### Phase 4: Production Rollout (PENDING)

- [ ] Apply patterns to popup
- [ ] Migrate settings page styles
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
- [ ] Override CSS variables under `.theme-style-v3` and `.theme-style-cyberpunk` scopes
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
  primary-v3: #6366f1;
  primary-cyberpunk: #ff006e;
  spacing-unit: 8px;
}
```

```typescript
// Import in TypeScript
import scssVars from "./styles/_export-variables.scss";

// Use in styling utilities
const primaryColor = scssVars["primary-v3"];
```

### Migration Patterns

#### Inline Styles Migration

```tsx
// Current pattern
<Title
  style={{
    textShadow: themeStyle === ThemeStyle.CYBERPUNK
      ? '0 0 20px var(--mantine-color-neonPink-5)'
      : '2px 2px 4px rgba(0, 0, 0, 0.3)',
  }}
>

// Migration approach: Use CSS classes
<Title className={cn.component('title', themeStyle)}>

// In SCSS
.tanaka-title {
  @include theme-variant("v3") {
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  }

  @include theme-variant("cyberpunk") {
    text-shadow: 0 0 20px var(--mantine-color-neonPink-5);
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
