# Practical SCSS Refactor Plan

## Core Principle
Start with what you need today, add complexity only when required.

## File Structure

```
styles/
├── core/
│   ├── _variables.scss      # Design tokens you actually use
│   ├── _mixins.scss         # Proven utility mixins
│   ├── _animations.scss     # Animation keyframes
│   ├── _gradients.scss      # Gradient definitions
│   ├── _base.scss           # Module aggregator
│   └── _shared.scss         # Resets and base styles
│
├── themes/
│   ├── _base.scss          # Theme application logic
│   ├── _twilight.scss      # Twilight theme
│   ├── _neon.scss          # Neon theme
│   └── _all.scss           # Theme orchestrator
│
└── _index.scss             # Main entry point
```

---

## Core Foundation Files

### core/_variables.scss
```scss
@use 'sass:map';

// =====================================================================
// Design Tokens - Only What We Use
// =====================================================================

// Spacing
$spacing-base: 8px;
$spacing-scale: (
  xs: $spacing-base * 0.5,  // 4px
  sm: $spacing-base,        // 8px
  md: $spacing-base * 2,   // 16px
  lg: $spacing-base * 3,   // 24px
  xl: $spacing-base * 4,   // 32px
  xxl: $spacing-base * 6   // 48px
);

// Typography
$font-family-base: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
$font-family-mono: 'SF Mono', Monaco, Inconsolata, monospace;

$font-weights: (
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700
);

$line-heights: (
  tight: 1.2,
  base: 1.6,
  relaxed: 1.8
);

// Font sizes aligned with your usage
$font-sizes: (
  xs: 0.75rem,   // 12px
  sm: 0.875rem,  // 14px
  base: 1rem,    // 16px
  lg: 1.125rem,  // 18px
  xl: 1.25rem    // 20px
);

// Border radius
$radius-scale: (
  xs: 2px,
  sm: 4px,
  md: 8px,
  lg: 12px,
  xl: 16px,
  pill: 9999px
);

// Z-index layers
$z-layers: (
  base: 0,
  raised: 10,
  dropdown: 1000,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080
);

// Breakpoints (Mantine defaults)
$breakpoints: (
  xs: 36em,  // 576px
  sm: 48em,  // 768px
  md: 62em,  // 992px
  lg: 75em,  // 1200px
  xl: 88em   // 1408px
);

// Shadows
$shadows: (
  sm: (0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)),
  md: (0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)),
  lg: (0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05))
);

// Transitions
$transitions: (
  fast: 150ms ease,
  base: 300ms ease,
  slow: 600ms ease
);
```

### core/_mixins.scss
```scss
@use 'sass:map';
@use 'variables' as *;

// =====================================================================
// Practical Mixins - Battle-tested utilities
// =====================================================================

// Layout
@mixin flex($direction: row, $align: stretch, $justify: flex-start, $gap: null) {
  display: flex;
  flex-direction: $direction;
  align-items: $align;
  justify-content: $justify;
  @if $gap {
    gap: $gap;
  }
}

@mixin flex-center {
  @include flex($align: center, $justify: center);
}

// Responsive
@mixin respond-to($breakpoint) {
  @if map.has-key($breakpoints, $breakpoint) {
    @media (min-width: map.get($breakpoints, $breakpoint)) {
      @content;
    }
  } @else {
    @warn "Breakpoint '#{$breakpoint}' not found";
  }
}

// Interaction states
@mixin hover-style {
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      @content;
    }
  }
}

@mixin focus-style {
  &:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
    @content;
  }
}

@mixin touch-feedback {
  @media (pointer: coarse) {
    transition: transform map.get($transitions, fast);
    &:active {
      transform: scale(0.96);
    }
  }
}

// Typography
@mixin text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@mixin line-clamp($lines: 2) {
  display: -webkit-box;
  -webkit-line-clamp: $lines;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

// Visual effects
@mixin gradient-text($gradient-var: --gradient-primary) {
  background: var($gradient-var);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

@mixin glass($blur: 10px, $opacity: 0.1) {
  background: rgba(255, 255, 255, $opacity);
  backdrop-filter: blur($blur);
  -webkit-backdrop-filter: blur($blur);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

// Utility functions
@function spacing($key) {
  @return map.get($spacing-scale, $key);
}

@function radius($key) {
  @return map.get($radius-scale, $key);
}

@function z($key) {
  @return map.get($z-layers, $key);
}

@function font-size($key) {
  @return map.get($font-sizes, $key);
}

@function font-weight($key) {
  @return map.get($font-weights, $key);
}

// Color manipulation
@function tint($color, $percentage) {
  @return mix(white, $color, $percentage);
}

@function shade($color, $percentage) {
  @return mix(black, $color, $percentage);
}

@function alpha($color, $alpha) {
  @return rgba($color, $alpha);
}
```

### core/_animations.scss
```scss
// =====================================================================
// Animation Keyframes - Only what's actually used
// =====================================================================

// Fade
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

// Slide
@keyframes slide-up {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slide-down {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

// Scale
@keyframes scale-in {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

// Effects
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 currentColor; }
  70% { box-shadow: 0 0 0 10px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}

@keyframes shimmer {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}

// Gradient animation (for your themes)
@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

// Simple rotation
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### core/_gradients.scss
```scss
// =====================================================================
// Gradient System - Theme-aware gradients
// =====================================================================

:root {
  // Brand gradients
  --gradient-primary: linear-gradient(135deg, var(--primary), var(--secondary));
  --gradient-secondary: linear-gradient(135deg, var(--secondary), var(--accent));
  --gradient-accent: linear-gradient(135deg, var(--accent), var(--accent-light));

  // State gradients
  --gradient-success: linear-gradient(135deg, var(--success), var(--success-light));
  --gradient-warning: linear-gradient(135deg, var(--warning), var(--warning-light));
  --gradient-error: linear-gradient(135deg, var(--error), var(--error-light));
  --gradient-info: linear-gradient(135deg, var(--info), var(--info-light));

  // Surface gradients
  --gradient-surface: linear-gradient(180deg, var(--background-surface), var(--background));
  --gradient-surface-subtle: linear-gradient(180deg, var(--background), var(--background-surface));

  // Special effects
  --gradient-shimmer: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1) 50%,
    transparent
  );

  // Header gradient (responsive to theme)
  --gradient-header: linear-gradient(
    135deg,
    var(--background-surface),
    var(--background-surface-light)
  );
}
```

### core/_shared.scss
```scss
@use 'sass:map';
@use 'variables' as *;

// =====================================================================
// Base Resets & Global Styles
// =====================================================================

*, *::before, *::after {
  box-sizing: border-box;
}

html {
  font-size: 16px;
  -webkit-text-size-adjust: 100%;

  @media (prefers-reduced-motion: no-preference) {
    scroll-behavior: smooth;
  }
}

body {
  margin: 0;
  font-family: $font-family-base;
  font-size: map.get($font-sizes, base);
  font-weight: map.get($font-weights, regular);
  line-height: map.get($line-heights, base);
  color: var(--text);
  background-color: var(--background);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

// Typography
h1, h2, h3, h4, h5, h6 {
  margin: 0 0 map.get($spacing-scale, md);
  font-weight: map.get($font-weights, semibold);
  line-height: map.get($line-heights, tight);
}

p {
  margin: 0 0 map.get($spacing-scale, md);
}

a {
  color: var(--primary);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

// Code
code {
  font-family: $font-family-mono;
  font-size: 0.875em;
  padding: 0.125em 0.25em;
  background-color: var(--background-surface);
  border-radius: map.get($radius-scale, xs);
}

// Forms
button, input, select, textarea {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}

// Media
img, picture, video, canvas, svg {
  display: block;
  max-width: 100%;
  height: auto;
}

// Focus
:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

// Selection
::selection {
  background-color: var(--primary);
  color: white;
}

// Expose tokens as CSS variables
:root {
  // Spacing
  @each $key, $value in $spacing-scale {
    --spacing-#{$key}: #{$value};
  }

  // Radius
  @each $key, $value in $radius-scale {
    --radius-#{$key}: #{$value};
  }

  // Z-index
  @each $key, $value in $z-layers {
    --z-#{$key}: #{$value};
  }

  // Transitions
  @each $key, $value in $transitions {
    --transition-#{$key}: #{$value};
  }
}

// Reduced motion
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### core/_base.scss
```scss
// Core module aggregator
@forward 'variables';
@forward 'mixins';
@forward 'animations';
@forward 'gradients';
@forward 'shared';
```

---

## Theme System Files

### themes/_base.scss
```scss
@use 'sass:map';
@use '../core' as core;

// =====================================================================
// Theme Application System
// =====================================================================

// Apply theme colors as CSS properties
@mixin apply-theme($theme-map) {
  @each $key, $value in $theme-map {
    --#{$key}: #{$value};
  }
}

// Generate Mantine color scale
@mixin generate-mantine-scale($name, $base-color) {
  // 0-4: Tints
  @for $i from 0 through 4 {
    $amount: (5 - $i) * 18%;
    --mantine-color-#{$name}-#{$i}: #{core.tint($base-color, $amount)};
  }

  // 5: Base
  --mantine-color-#{$name}-5: #{$base-color};

  // 6-9: Shades
  @for $i from 6 through 9 {
    $amount: ($i - 5) * 15%;
    --mantine-color-#{$name}-#{$i}: #{core.shade($base-color, $amount)};
  }
}

// Map theme to Mantine variables
@mixin map-to-mantine($theme-map) {
  // Core color mappings
  --mantine-color-body: var(--background);
  --mantine-color-text: var(--text);
  --mantine-color-anchor: var(--primary);
  --mantine-color-default: var(--background-surface);
  --mantine-color-default-hover: var(--background-surface-light);
  --mantine-color-default-border: var(--border);
  --mantine-color-dimmed: var(--text-muted);

  // Primary color
  --mantine-color-primary-filled: var(--primary);
  --mantine-color-primary-filled-hover: var(--primary-dark);
  --mantine-color-primary-light: var(--primary-light);
  --mantine-color-primary-light-hover: var(--primary);

  // Typography
  --mantine-font-family: #{core.$font-family-base};
  --mantine-font-family-monospace: #{core.$font-family-mono};

  // Font sizes
  @each $key, $value in core.$font-sizes {
    --mantine-font-size-#{$key}: #{$value};
  }

  // Radius
  --mantine-radius-default: #{map.get(core.$radius-scale, md)};
  @each $key, $value in core.$radius-scale {
    --mantine-radius-#{$key}: #{$value};
  }

  // Spacing
  @each $key, $value in core.$spacing-scale {
    --mantine-spacing-#{$key}: #{$value};
  }

  // Shadows (use theme shadows if available)
  @if map.has-key($theme-map, shadow-glow) {
    --mantine-shadow-sm: var(--shadow-glow);
    --mantine-shadow-md: var(--shadow-glow);
    --mantine-shadow-lg: var(--shadow-glow-strong);
  } @else {
    @each $key, $value in core.$shadows {
      --mantine-shadow-#{$key}: #{$value};
    }
  }
}

// Complete theme application
@mixin apply-complete-theme($config) {
  $colors: map.get($config, colors);
  $scales: map.get($config, scales);

  // Apply colors
  @include apply-theme($colors);

  // Generate color scales
  @each $name, $scale in $scales {
    @if type-of($scale) == 'color' {
      @include generate-mantine-scale($name, $scale);
    }
  }

  // Map to Mantine
  @include map-to-mantine($colors);

  // Apply overrides
  @if map.has-key($config, overrides) {
    @include apply-theme(map.get($config, overrides));
  }
}
```

### themes/_twilight.scss
```scss
@use 'sass:map';
@use '../core' as core;

// Twilight brand colors
$primary: #6366f1;
$secondary: #8b5cf6;
$accent: #ec4899;

// Dark mode colors
$twilight-dark: (
  // Primary colors
  primary: $primary,
  primary-light: core.tint($primary, 15%),
  primary-dark: core.shade($primary, 15%),

  // Secondary colors
  secondary: $secondary,
  secondary-light: core.tint($secondary, 15%),
  secondary-dark: core.shade($secondary, 15%),

  // Accent colors
  accent: $accent,
  accent-light: core.tint($accent, 15%),
  accent-dark: core.shade($accent, 15%),

  // Backgrounds
  background: #0a0a0b,
  background-surface: #0f0f10,
  background-surface-light: #1a1a1c,

  // Text
  text: #ffffff,
  text-muted: core.alpha(#ffffff, 0.7),
  text-dim: core.alpha(#ffffff, 0.5),

  // Borders
  border: core.alpha(#ffffff, 0.1),
  border-light: core.alpha(#ffffff, 0.05),
  border-dark: core.alpha(#ffffff, 0.2),

  // States
  success: #10b981,
  success-light: #34d399,
  success-dark: #059669,

  warning: #f59e0b,
  warning-light: #fbbf24,
  warning-dark: #d97706,

  error: #ef4444,
  error-light: #f87171,
  error-dark: #dc2626,

  info: #3b82f6,
  info-light: #60a5fa,
  info-dark: #2563eb,

  // Effects
  shadow-glow: 0 0 20px core.alpha($secondary, 0.3),
  shadow-glow-strong: 0 0 40px core.alpha($secondary, 0.5)
);

// Light mode colors
$twilight-light: map.merge($twilight-dark, (
  // Backgrounds
  background: #f8f9fa,
  background-surface: #ffffff,
  background-surface-light: #f3f4f6,

  // Text
  text: #1f2937,
  text-muted: core.alpha(#1f2937, 0.7),
  text-dim: core.alpha(#1f2937, 0.5),

  // Borders
  border: core.alpha(#000000, 0.1),
  border-light: core.alpha(#000000, 0.05),
  border-dark: core.alpha(#000000, 0.2),

  // Effects
  shadow-glow: 0 0 20px core.alpha($primary, 0.2),
  shadow-glow-strong: 0 0 40px core.alpha($primary, 0.3)
));

// Export theme
$twilight-theme: (
  name: twilight,
  colors: $twilight-dark,
  colors-light: $twilight-light,
  scales: (
    indigo: $primary,
    violet: $secondary,
    pink: $accent
  ),
  overrides: (
    mantine-primary-color: indigo
  )
);
```

### themes/_neon.scss
```scss
@use '../core' as core;

// Neon colors
$cyan: #00ffff;
$magenta: #ff00ff;
$lime: #00ff00;

$neon-colors: (
  // Primary colors
  primary: $cyan,
  primary-light: core.tint($cyan, 20%),
  primary-dark: core.shade($cyan, 20%),

  // Secondary colors
  secondary: $magenta,
  secondary-light: core.tint($magenta, 20%),
  secondary-dark: core.shade($magenta, 20%),

  // Accent colors
  accent: $lime,
  accent-light: core.tint($lime, 20%),
  accent-dark: core.shade($lime, 20%),

  // Backgrounds (intentionally garish)
  background: #ffff00,
  background-surface: #ff9900,
  background-surface-light: #ffcc00,

  // Text
  text: #000000,
  text-muted: core.alpha(#000000, 0.8),
  text-dim: core.alpha(#000000, 0.6),

  // Borders
  border: core.alpha(#000000, 0.2),
  border-light: core.alpha(#000000, 0.1),
  border-dark: core.alpha(#000000, 0.3),

  // States
  success: #00ff00,
  success-light: #66ff66,
  success-dark: #00cc00,

  warning: #ffcc00,
  warning-light: #ffdd33,
  warning-dark: #ff9900,

  error: #ff0033,
  error-light: #ff3366,
  error-dark: #cc0029,

  info: #00ccff,
  info-light: #33ddff,
  info-dark: #0099cc,

  // Effects
  shadow-glow: 0 0 30px $magenta,
  shadow-glow-strong: 0 0 50px $cyan
);

// Export theme
$neon-theme: (
  name: neon,
  colors: $neon-colors,
  scales: (
    cyan: $cyan,
    pink: $magenta,
    lime: $lime
  ),
  overrides: (
    mantine-primary-color: cyan,
    mantine-radius-default: 24px
  )
);
```

### themes/_all.scss
```scss
@use 'sass:map';
@use './base' as base;
@use './twilight';
@use './neon';

// Theme registry
$themes: (
  twilight: twilight.$twilight-theme,
  neon: neon.$neon-theme
);

// Default theme
$default-theme: twilight;

// Apply default theme
:root {
  @include base.apply-complete-theme(map.get($themes, $default-theme));
}

// Theme switching
@each $name, $config in $themes {
  [data-theme-style="#{$name}"] {
    @include base.apply-complete-theme($config);

    // Light mode variant
    &[data-mantine-color-scheme="light"] {
      $light-colors: map.get($config, colors-light);
      @if $light-colors {
        @include base.apply-theme($light-colors);
      }
    }
  }
}
```

---

## Main Entry Point

### _index.scss
```scss
// =====================================================================
// Main Entry Point
// =====================================================================

// Core foundation
@use 'core' as *;

// Theme system
@use 'themes/all';

// App-specific globals
:root {
  // Layout
  --app-header-height: 64px;
  --app-sidebar-width: 280px;

  // Z-index shortcuts
  --z-dropdown: #{map.get($z-layers, dropdown)};
  --z-modal: #{map.get($z-layers, modal)};
  --z-tooltip: #{map.get($z-layers, tooltip)};
}

// Ensure theme colors are applied
body {
  color: var(--text);
  background-color: var(--background);
  font-family: var(--mantine-font-family);
}
```

---

## Migration Strategy

### Phase 1: Setup (Day 1)
1. Create file structure
2. Copy existing variables to new structure
3. Add missing mixins and functions
4. Test imports work

### Phase 2: Theme Migration (Day 2)
1. Update theme files to new structure
2. Test theme switching
3. Verify Mantine integration
4. Check all CSS variables generate correctly

### Phase 3: Component Updates (Day 3-4)
1. Update imports one component at a time
2. Replace hardcoded values with tokens
3. Use mixins for interactions
4. Test each component thoroughly

### Phase 4: Cleanup (Few hours)
1. Remove old style files
2. Run bundle analyzer
3. Update documentation
4. Celebrate! 🎉

---

## What This Gives You

✅ **Clean separation** - Core utilities vs theme-specific code  
✅ **Maintainable** - Add themes without touching core  
✅ **Performance** - No unnecessary CSS  
✅ **Developer friendly** - Clear import paths and patterns  
✅ **Future proof** - Easy to extend when needed  

## What We Skip (Until Needed)

❌ Complex validation  
❌ Utility classes  
❌ Print styles  
❌ Excessive animations  
❌ Over-abstraction  

## Total Time: 3-4 days of focused work
