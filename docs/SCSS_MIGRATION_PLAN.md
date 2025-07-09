# SCSS Migration Plan for Tanaka Extension

## Executive Summary

This document outlines a comprehensive plan to migrate the Tanaka extension's styling from duplicated CSS files to a modular SCSS architecture. The migration will reduce code duplication by 70-90%, improve maintainability, and enable proper BEM methodology while maintaining compatibility with Mantine's component system.

## Current State Analysis

### Duplication Metrics

- **Lines of CSS**: ~500 per theme (v3 and cyberpunk)
- **Duplicate selectors**: 100% between themes
- **Shared patterns**: Utilities, animations, component structures
- **Unique elements**: Only color values and some theme-specific effects

### Pain Points

1. Every utility class is duplicated with different theme prefixes
2. Component changes must be made in multiple files
3. No variable sharing for consistent spacing/sizing
4. Manual BEM implementation without nesting support
5. Difficult to add new themes without massive duplication

## Goals

1. **Reduce code duplication by >70%**
2. **Maintain visual parity** with current themes
3. **Enable easy theme addition** (future themes in <100 lines)
4. **Improve build performance** and bundle size
5. **Maintain Mantine compatibility** for component styling

## Technical Architecture

### Folder Structure

```
extension/src/playground/styles/
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
  "xxl": $base-spacing * 6 // 48px,,,,,,,,,,,,,,
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

.theme-v3 {
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

.theme-cyberpunk {
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

### Phase 1: Foundation

1. ✅ Set up build pipeline (COMPLETED)

   - ✅ Install dependencies: `sass`, `sass-loader`, `postcss`, `autoprefixer`
   - ✅ Configure Rspack for SCSS
   - ✅ Set up source maps for debugging
   - ✅ Configure PostCSS with modern CSS features
   - ✅ Install and configure Stylelint for SCSS linting
   - ✅ Test SCSS compilation successfully

2. Create base architecture

   - Create folder structure
   - Write global variables and mixins
   - Set up CSS custom properties system
   - Create reset and typography base

3. Utility migration
   - Convert spacing utilities to SCSS loops
   - Create text and color utilities
   - Set up responsive utilities with mixins

### Phase 2: Component Migration

1. Button components

   - Extract button base mixin
   - Create theme-specific variants
   - Ensure all states work (hover, active, disabled)

2. Card components

   - Migrate glass morphism effects
   - Create BEM structure
   - Add theme-specific glow effects

3. Remaining components
   - Forms and inputs
   - Gradient text components
   - Any custom components

### Phase 3: Theme Integration

1. Theme compilation

   - Create separate theme bundles
   - Optimize CSS output
   - Set up theme switching mechanism

2. Testing & optimization

   - Visual regression testing
   - Performance benchmarking
   - Bundle size analysis

3. Documentation & cleanup
   - Update component documentation
   - Remove old CSS files
   - Create theme addition guide

## Technical Considerations

### Performance Optimizations

1. **CSS Modules** for component isolation
2. **PurgeCSS** for removing unused utilities
3. **CSS containment** for render performance
4. **Critical CSS** extraction for initial load

### Browser Support

- Use `postcss-preset-env` for modern CSS features
- Autoprefixer for vendor prefixes
- CSS custom properties with fallbacks

### Development Experience

#### VS Code Extensions (Recommended)

1. **Stylelint** - Real-time SCSS linting

   - Install: `dbaeumer.vscode-stylelint`
   - Catches errors and enforces conventions

2. **SCSS IntelliSense** - Autocomplete for variables/mixins

   - Install: `mrmlnc.vscode-scss`
   - Shows variable values on hover

3. **SCSS Formatter** - Consistent code formatting

   - Install: `sibiraj-s.vscode-scss-formatter`
   - Formats on save

4. **CSS Peek** - Navigate to style definitions
   - Install: `pranaygp.vscode-css-peek`
   - Ctrl+click to jump to CSS

#### Stylelint Configuration

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

#### Hot Reload & Source Maps

- **HMR**: Configured in devServer, style-loader handles automatically
- **Source Maps**: Enabled in development for easy debugging
- **Browser DevTools**: Shows original SCSS file locations

## TypeScript Integration & Migration Strategy

### Current TypeScript Utilities

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

### Migration Approach for Existing Patterns

#### Inline Styles in Components

Current code has many inline styles that need migration:

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

For components using `createStyledComponent`:

1. **Keep as-is** for highly dynamic styles that change based on props
2. **Convert to SCSS classes** for static theme-based styles
3. **Use CSS Modules** for component-specific isolated styles

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

### SCSS-TypeScript Bridge

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

### Migration of Current CSS Structure

#### Current Files to Migrate

1. **Theme-specific files** (found in analysis):

   - `v3/playground.css` → `themes/_v3.scss` (theme-specific parts)
   - `v3/components.css` → `components/_buttons.scss`, `_cards.scss`
   - `v3/utilities.css` → `_utilities.scss`
   - `cyberpunk/*` → Similar structure

2. **Shared files**:
   - `hover-effects.css` → `_mixins.scss` (as mixins)

#### Specific Patterns to Extract

1. **Debug Mode Styles** (duplicated in both themes):

   - Will be added to `_mixins.scss` as a mixin

2. **Pulse Animation** (color differences only):

   - Animation keyframe in `_shared.scss`
   - Mixin in `_mixins.scss` with color parameter

3. **Glass Morphism** (repeated pattern):
   - Already included in `_mixins.scss` as a mixin

### Import Strategy

#### Current Import Pattern

```typescript
// playground-app.tsx currently imports:
import "./styles/v3/playground.css";
import "./styles/cyberpunk/playground.css";
import "./styles/hover-effects.css";
```

#### New Import Pattern

```typescript
// For development/testing:
import "./styles/playground.scss";

// For webapp mode:
import "./styles/webapp.scss";

// For extension:
import "./styles/extension.scss";
```

### Build Pipeline Updates

#### Package Dependencies

```json
{
  "devDependencies": {
    "sass": "^1.70.0",
    "sass-loader": "^14.0.0",
    "css-loader": "^6.9.0",
    "style-loader": "^3.3.0",
    "postcss": "^8.4.0",
    "postcss-loader": "^8.0.0",
    "postcss-preset-env": "^9.3.0",
    "autoprefixer": "^10.4.0",
    "stylelint": "^16.0.0",
    "stylelint-config-standard-scss": "^13.0.0",
    "typed-css-modules": "^0.7.0"
  }
}
```

#### Type Generation for CSS Modules

```bash
# Generate TypeScript definitions for CSS modules
pnpm run tcm src/playground/styles -p '**/*.module.scss'
```

## Testing Strategy

### Visual Testing

```javascript
// tests/visual/themes.test.js
describe("Theme Visual Tests", () => {
  themes.forEach((theme) => {
    it(`renders ${theme} theme correctly`, async () => {
      await page.setTheme(theme);
      await page.screenshot({ path: `./screenshots/${theme}.png` });
      expect(await page.compareSnapshot()).toBeLessThan(0.01);
    });
  });
});
```

### Unit Testing

- Test mixin outputs
- Verify CSS variable generation
- Check utility class generation

### Integration Testing

- Theme switching functionality
- Mantine component compatibility
- Build process validation

## Adding a New Theme

Creating a new theme requires only defining colors and specific overrides:

```scss
// themes/_neon.scss
@use "base" as base;
@use "../mixins" as m;

$neon-colors: (
  "primary": #00ff88,
  "primary-light": #33ffaa,
  "primary-dark": #00cc66,
  "secondary": #ff00ff,
  "secondary-light": #ff33ff,
  "secondary-dark": #cc00cc,
  "background": #0a0a0a,
  "surface": #1a1a1a,
  "text": #ffffff,
  "text-muted": rgba(255, 255, 255, 0.7),
  "accent-green": #00ff00,
  "accent-blue": #00ffff,
);

.theme-neon {
  @include base.apply-theme($neon-colors);

  // Theme-specific overrides
  .custom-button {
    @include m.glow-effect(var(--color-primary), 12px);
    text-transform: uppercase;
    letter-spacing: 2px;

    &:hover {
      @include m.glow-effect(var(--color-secondary), 16px);
    }
  }

  .glowing-card {
    @include m.glass-morphism(0.05, 20px);
    border-color: var(--accent-green);
  }
}

// Add to bundle entry points
@use "themes/neon";
```

That's it! The new theme inherits all shared components and utilities automatically.

## Theme-Specific Features to Preserve

### V3 Theme Unique Elements

1. **Purple gradient background**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
2. **Glass morphism cards**: `backdrop-filter: blur(10px)` with white/opacity
3. **Subtle shadows**: Soft shadows for depth
4. **Gradient text effects**: `-webkit-background-clip: text`

### Cyberpunk Theme Unique Elements

1. **Animated grid background**: CSS grid pattern with keyframe animation
2. **Neon glow effects**: Multiple box-shadows for neon appearance
3. **Glitch animations**: Text distortion effects
4. **Matrix-style gradients**: Dark backgrounds with bright neon accents
5. **Animated pseudo-elements**: `::before` and `::after` for dynamic effects

### Shared Features Needing Abstraction

1. **Responsive padding**: Same breakpoints, different values
2. **Debug mode overlays**: Identical functionality, different styling
3. **Utility classes**: Same names, theme-scoped application
4. **Hover transitions**: Same timing, different visual effects

## Critical Migration Checkpoints

### Pre-Migration Checklist

- [ ] Backup all current CSS files
- [ ] Document current class usage in components
- [ ] Screenshot all current UI states
- [ ] List all dynamic style dependencies
- [ ] Verify TypeScript utility usage

### Post-Migration Verification

- [ ] All components render identically
- [ ] Theme switching works without flicker
- [ ] No console errors or warnings
- [ ] Bundle size is reduced
- [ ] Hot reload works for SCSS changes
- [ ] TypeScript utilities still function
- [ ] Dynamic styles work correctly

## Rollback Plan

If issues arise:

1. **Keep old CSS files** during migration

## Mantine Integration

Mantine components will continue to work alongside SCSS styles:

```scss
// Mantine CSS variables are accessible in SCSS
.custom-component {
  color: var(--mantine-color-primary-6);

  @include theme-variant("cyberpunk") {
    color: var(--mantine-color-neonPink-6);
  }
}

// Override Mantine components with SCSS
.mantine-Button-root {
  &.pulse-effect {
    @include m.pulse-effect(var(--color-primary));
  }
}
```

## Next Steps

1. Review and approve this plan
2. Set up development branch
3. Install dependencies
4. Begin Phase 1 implementation
5. Daily progress updates

---

_This plan is a living document and will be updated as we progress through the migration._
