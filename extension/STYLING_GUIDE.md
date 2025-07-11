# Tanaka Extension Styling Guide

This guide documents the styling architecture, conventions, and best practices for the Tanaka extension.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [CSS Variables vs SCSS Mixins](#css-variables-vs-scss-mixins)
3. [Naming Conventions](#naming-conventions)
4. [Component Styling](#component-styling)
5. [Theme System](#theme-system)
6. [Migration Examples](#migration-examples)
7. [Performance Guidelines](#performance-guidelines)

## Architecture Overview

The Tanaka extension uses a modular SCSS architecture with the following structure:

```text
src/styles/
├── core/
│   ├── _variables.scss    # Design tokens (spacing, typography, breakpoints)
│   ├── _mixins.scss       # Reusable mixins and functions
│   ├── _animations.scss   # Keyframe animations
│   ├── _gradients.scss    # Gradient definitions
│   ├── _shadows.scss      # Shadow system
│   └── _shared.scss       # Base styles and resets
└── themes/
    ├── _base.scss         # Theme application system
    ├── _twilight.scss     # Twilight theme
    └── _neon.scss         # Neon theme
```

### Core Principles

1. **CSS Variables for Dynamic Values** - Use CSS custom properties for values that change with themes
2. **SCSS Variables for Static Values** - Use SCSS variables for compile-time constants
3. **BEM Methodology** - Use `.tnk-` prefix with BEM naming for all custom components
4. **No Inline Styles** - All styles belong in SCSS files
5. **No CSS-in-JS** - Avoid runtime style generation

## CSS Variables vs SCSS Mixins

### When to Use CSS Variables

Use CSS custom properties (CSS variables) for:

- **Theme-dependent values** that change based on user preferences
- **Dynamic colors** that adapt to light/dark mode
- **Runtime values** that might be modified by JavaScript
- **Cascading values** that child components should inherit

```scss
// Good - Theme-aware colors
.tnk-button {
  background: var(--primary);
  color: var(--text);
  box-shadow: var(--shadow-sm);
}

// Good - Responsive to theme changes
.tnk-card {
  background: var(--background-surface);
  border: 1px solid var(--border);
}
```

### When to Use SCSS Mixins

Use SCSS mixins for:

- **Compile-time logic** and calculations
- **Vendor prefixes** and browser compatibility
- **Complex patterns** that require parameters
- **Static utilities** that don't change at runtime

```scss
// Good - Layout utilities
.tnk-header {
  @include flex-center;
  @include respond-to(md) {
    padding: spacing(lg);
  }
}

// Good - Interaction patterns
.tnk-button {
  @include hover-style {
    transform: scale(1.02);
  }
  @include focus-style;
  @include touch-feedback;
}
```

### Quick Reference

| Use Case | CSS Variables | SCSS Mixins |
|----------|--------------|-------------|
| Colors | ✅ `var(--primary)` | ❌ |
| Shadows | ✅ `var(--shadow-md)` | ❌ |
| Gradients | ✅ `var(--gradient-primary)` | ❌ |
| Spacing | ❌ | ✅ `spacing(md)` |
| Media Queries | ❌ | ✅ `@include respond-to(lg)` |
| Animations | ✅ `var(--transition)` | ✅ `@keyframes` |
| Complex Layouts | ❌ | ✅ `@include flex()` |

## Naming Conventions

### CSS Variables

CSS variables follow a hierarchical naming pattern:

```scss
// Format: --[category]-[element]-[modifier]

// Colors
--primary              // Base primary color
--primary-light        // Lighter variant
--primary-dark         // Darker variant

// Shadows
--shadow-sm            // Small shadow
--shadow-md            // Medium shadow
--shadow-glow          // Glow effect

// Gradients
--gradient-primary     // Primary gradient
--gradient-surface     // Surface gradient

// Theme-specific
--twilight-gradient-primary
--neon-shadow-glow
```

### Component Classes

All custom components use the `.tnk-` prefix with BEM methodology:

```scss
// Block
.tnk-button { }

// Element
.tnk-button__icon { }
.tnk-button__label { }

// Modifier
.tnk-button--primary { }
.tnk-button--large { }

// State
.tnk-button.is-loading { }
.tnk-button.is-disabled { }
```

### SCSS Variables and Mixins

SCSS variables use kebab-case with semantic prefixes:

```scss
// Variables
$spacing-base: 8px;
$font-family-base: system-ui;
$radius-scale: (...);

// Mixins
@mixin flex-center { }
@mixin hover-style { }
@mixin gradient-text { }

// Functions
@function spacing($key) { }
@function radius($key) { }
```

## Component Styling

### Basic Component Template

```scss
// components/button/button.scss
@use '../../styles/core' as *;

.tnk-button {
  // Base styles
  display: inline-flex;
  align-items: center;
  padding: spacing(sm) spacing(md);
  border-radius: radius(md);
  font-family: $font-family-base;
  font-weight: font-weight(medium);
  transition: all var(--transition);
  cursor: pointer;

  // Theme-aware styles
  background: var(--primary);
  color: var(--text-on-primary);
  border: 1px solid var(--border);

  // States
  @include hover-style {
    background: var(--primary-dark);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  @include focus-style;

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  // Elements
  &__icon {
    @include flex-center;
    width: 20px;
    height: 20px;

    & + .tnk-button__label {
      margin-left: spacing(xs);
    }
  }

  &__label {
    @include text-truncate;
  }

  // Modifiers
  &--secondary {
    background: var(--background-surface);
    color: var(--text);

    @include hover-style {
      background: var(--background-surface-light);
    }
  }

  &--small {
    padding: spacing(xs) spacing(sm);
    font-size: font-size(sm);
  }

  &--large {
    padding: spacing(md) spacing(lg);
    font-size: font-size(lg);
  }

  &--full-width {
    width: 100%;
    justify-content: center;
  }
}
```

### Component File Structure

Each component should have:

```text
components/
└── button/
    ├── button.tsx       # Component implementation
    ├── button.scss      # Component styles
    └── index.ts         # Barrel export
```

## Theme System

### Theme Structure

Themes define color palettes and visual properties:

```scss
// themes/_twilight.scss
$twilight-theme: (
  name: 'twilight',
  colors: (
    primary: #6366f1,
    secondary: #8b5cf6,
    // ... more colors
  ),
  scales: (
    'indigo': $primary,
    'violet': $secondary,
  ),
  overrides: (
    mantine-primary-color: 'indigo'
  )
);
```

### Creating a New Theme

1. Create a new theme file in `styles/themes/`
2. Define the theme map with required properties
3. Import and register in `_all.scss`

```scss
// themes/_midnight.scss
@use '../core' as core;

$midnight-theme: (
  name: 'midnight',
  colors: (
    primary: #3b82f6,
    // ... define all required colors
  ),
  scales: (
    'blue': #3b82f6,
  )
);

// themes/_all.scss
@use './midnight';

$themes: (
  twilight: twilight.$twilight-theme,
  neon: neon.$neon-theme,
  midnight: midnight.$midnight-theme  // Add here
);
```

## Migration Examples

### Migrating Inline Styles

```tsx
// ❌ Before - Inline styles
<Box style={{
  padding: 16,
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
}} />

// ✅ After - SCSS with CSS variables
<Box className="tnk-feature-box" />
```

```scss
.tnk-feature-box {
  padding: spacing(md);
  background: var(--gradient-primary);
  box-shadow: var(--shadow-md);
}
```

### Migrating Hardcoded Values

```scss
// ❌ Before - Hardcoded values
.component {
  margin-bottom: 16px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

// ✅ After - Using design tokens
.component {
  margin-bottom: spacing(md);
  border-radius: radius(md);
  font-weight: font-weight(semibold);
  transition: all var(--transition);
}
```

### Migrating CSS-in-JS

```tsx
// ❌ Before - Runtime styles
const getButtonStyles = (variant: string) => ({
  background: variant === 'primary' ? '#6366f1' : '#8b5cf6',
  padding: '8px 16px',
  '&:hover': {
    transform: 'scale(1.05)'
  }
});

// ✅ After - Static SCSS classes
<Button className={`tnk-button tnk-button--${variant}`} />
```

```scss
.tnk-button {
  padding: spacing(sm) spacing(md);

  &--primary {
    background: var(--primary);
  }

  &--secondary {
    background: var(--secondary);
  }

  @include hover-style {
    transform: scale(1.05);
  }
}
```

## Performance Guidelines

### 1. Minimize Specificity

```scss
// ❌ Avoid deep nesting
.tnk-app {
  .tnk-header {
    .tnk-nav {
      .tnk-nav-item {
        // Too specific!
      }
    }
  }
}

// ✅ Keep it flat
.tnk-nav-item {
  // Direct targeting
}
```

### 2. Use CSS Variables for Dynamic Values

```scss
// ❌ Generating multiple classes
@each $color in $colors {
  .text-#{$color} {
    color: $color;
  }
}

// ✅ Use CSS variables
.tnk-text {
  color: var(--text-color);
}
```

### 3. Leverage Mixins for Repeated Patterns

```scss
// ❌ Repeating code
.tnk-card {
  display: flex;
  align-items: center;
  justify-content: center;
}

.tnk-modal {
  display: flex;
  align-items: center;
  justify-content: center;
}

// ✅ Use mixins
.tnk-card {
  @include flex-center;
}

.tnk-modal {
  @include flex-center;
}
```

### 4. Optimize Animations

```scss
// ❌ Animating expensive properties
@keyframes slide {
  from { left: 0; }
  to { left: 100px; }
}

// ✅ Use transforms
@keyframes slide {
  from { transform: translateX(0); }
  to { transform: translateX(100px); }
}
```

## Summary

1. **Always use `.tnk-` prefix** for custom component classes
2. **Never use inline styles** - keep all styles in SCSS files
3. **Use CSS variables** for theme-dependent values
4. **Use SCSS mixins** for compile-time utilities
5. **Follow BEM methodology** for component structure
6. **Keep specificity low** - avoid deep nesting
7. **Document complex styles** with comments when necessary
8. **Test in both themes** - ensure styles work in light and dark modes
9. **Use semantic names** - describe purpose, not appearance
10. **Optimize for performance** - use transforms over position changes

## Quick Reference

### Available Mixins

```scss
// Layout
@include flex($direction, $align, $justify, $gap);
@include flex-center;

// Responsive
@include respond-to($breakpoint);  // sm, md, lg, xl

// Interactions
@include hover-style { }
@include focus-style;
@include touch-feedback;

// Typography
@include text-truncate;
@include line-clamp($lines);
@include gradient-text($gradient-var);

// Effects
@include glass($blur, $opacity);
@include shadow($size);
@include shadow-hover-lift;
@include shadow-glow($color-var, $intensity);
@include shadow-pulse($color-var);
```

### Available Functions

```scss
spacing($key)     // xs, sm, md, lg, xl, xxl
radius($key)      // xs, sm, md, lg, xl, pill
z($key)           // base, raised, dropdown, modal, tooltip
font-size($key)   // xs, sm, base, lg, xl
font-weight($key) // regular, medium, semibold, bold
```

### CSS Variable Categories

- **Colors**: `--primary`, `--secondary`, `--background`, `--text`
- **Shadows**: `--shadow-xs` through `--shadow-2xl`, `--shadow-glow`
- **Gradients**: `--gradient-primary`, `--gradient-surface`
- **Spacing**: Use SCSS `spacing()` function instead
- **Typography**: Mixed (sizes use functions, line-height uses vars)
- **Transitions**: `--transition` (base timing)
