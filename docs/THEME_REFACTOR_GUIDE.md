# Theme System Refactoring Guide

## Implementation Plan

> **Philosophy**: This guide implements a lean approach with just ~22 essential variables that cover 90% of theming needs. Only add more variables if you actually use them.

### Phase 1: Create Bridge Variables System

1. Rename `themes/` → `themes_old/` for reference
2. Create new `themes/` folder with:
   - `_base.scss` - TNK bridge variable system
   - `_twilight.scss` - Professional dark theme
   - `_neon.scss` - Cyberpunk theme
   - `_midnight.scss` - OLED black theme
   - `_all.scss` - Theme orchestrator

### Phase 2: Define Essential TNK Variables

Focus on commonly-used Mantine variables that themes are likely to customize:

```scss
$tnk-defaults: (
  // Core Colors (most important)
  'color-body': var(--mantine-color-body),
  'color-text': var(--mantine-color-text),
  'color-anchor': var(--mantine-color-anchor),
  'color-default': var(--mantine-color-default),
  'color-default-hover': var(--mantine-color-default-hover),
  'color-default-border': var(--mantine-color-default-border),
  'color-dimmed': var(--mantine-color-dimmed),
  'color-error': var(--mantine-color-error),
  'color-success': var(--mantine-color-green-6),  // Added for state completeness
  'color-placeholder': var(--mantine-color-placeholder),
  'color-white': var(--mantine-color-white),
  'color-black': var(--mantine-color-black),

  // Typography
  'font-family': var(--mantine-font-family),
  'font-family-monospace': var(--mantine-font-family-monospace),
  'font-family-headings': var(--mantine-font-family-headings),
  'font-size-md': var(--mantine-font-size-md),  // Added - was referenced but missing
  'line-height': var(--mantine-line-height),

  // Key Heading Properties (h1-h3 most used)
  'h1-font-size': var(--mantine-h1-font-size),
  'h2-font-size': var(--mantine-h2-font-size),
  'h3-font-size': var(--mantine-h3-font-size),

  // Layout & Spacing
  'radius-default': var(--mantine-radius-default),
  'spacing-sm': var(--mantine-spacing-sm),  // Added - commonly used
  'spacing-md': var(--mantine-spacing-md),
  'spacing-lg': var(--mantine-spacing-lg),  // Added - commonly used

  // Shadows (essential for depth)
  'shadow-xs': var(--mantine-shadow-xs),
  'shadow-sm': var(--mantine-shadow-sm),
  'shadow-md': var(--mantine-shadow-md),

  // Primary Color
  'primary-color': var(--mantine-primary-color),
  'primary-color-filled': var(--mantine-primary-color-filled),
  'primary-color-light': var(--mantine-primary-color-light),

  // Transitions
  'transition-duration-md': var(--mantine-transition-duration-md),
  'transition-timing-function': var(--mantine-transition-timing-function)
);
```

### Phase 3: Implement Bridge System Mixins

```scss
// Initialize TNK variables from Mantine defaults
@mixin apply-tnk-defaults() {
  @each $key, $value in $tnk-defaults {
    --tnk-#{$key}: #{$value};
  }
}

// Apply theme overrides to TNK variables
@mixin apply-tnk-overrides($overrides) {
  @each $key, $value in $overrides {
    --tnk-#{$key}: #{$value};
  }
}

// Validate theme structure
@mixin validate-theme($theme) {
  // Check required properties
  @if not map.has-key($theme, name) {
    @error "Theme missing required 'name' property";
  }

  @if not map.has-key($theme, colors) {
    @error "Theme '#{map.get($theme, name)}' missing required 'colors' property";
  }

  // Validate color scale references
  @if map.has-key($theme, scales) {
    $colors: map.get($theme, colors);
    @each $scale-name, $scale-color in map.get($theme, scales) {
      @if type-of($scale-color) == 'string' {
        @if not map.has-key($colors, $scale-color) {
          @warn "Scale '#{$scale-name}' references undefined color '#{$scale-color}' in theme '#{map.get($theme, name)}'";
        }
      }
    }
  }
}

// Map TNK variables back to Mantine
@mixin map-tnk-to-mantine() {
  @each $key, $value in $tnk-defaults {
    --mantine-#{$key}: var(--tnk-#{$key});
  }
}

// Debug helper for development
@mixin debug-tnk-variables() {
  @debug "=== TNK Variable State ===";
  @each $key, $value in $tnk-defaults {
    @debug "#{$key}: #{$value}";
  }
}

// Complete theme application
@mixin apply-complete-theme($theme) {
  // Validate theme structure first
  @include validate-theme($theme);

  // 1. Set up TNK bridge variables
  @include apply-tnk-defaults();

  // 2. Apply theme's custom colors (our semantic variables)
  @include apply-theme-colors(map.get($theme, colors));

  // 3. Generate Mantine color scales for theme colors
  @include generate-color-scales(map.get($theme, scales));

  // 4. Apply theme's TNK overrides
  @if map.has-key($theme, tnk) {
    @include apply-tnk-overrides(map.get($theme, tnk));
  }

  // 5. Map TNK back to Mantine
  @include map-tnk-to-mantine();

  // 6. Handle light mode
  &[data-mantine-color-scheme="light"] {
    @if map.has-key($theme, colors-light) {
      @include apply-theme-colors(map.get($theme, colors-light));
    }
    @if map.has-key($theme, tnk-light) {
      @include apply-tnk-overrides(map.get($theme, tnk-light));
      @include map-tnk-to-mantine();
    }
  }
}
```

### Phase 4: Theme Structure

Each theme follows this structure:

```scss
$theme-name: (
  name: 'theme-name',

  // Custom semantic colors
  colors: (
    // Backgrounds
    background: #color,
    'background-surface': #color,
    'background-surface-light': #color,

    // Text hierarchy
    text: #color,
    'text-muted': #color,
    'text-dim': #color,

    // Interactive elements
    primary: #color,
    secondary: #color,
    accent: #color,

    // States
    error: #color,
    success: #color,
    warning: #color,

    // Structure
    border: #color
  ),

  // Color scales to generate
  scales: (
    'primary-name': $primary,
    'secondary-name': $secondary
  ),

  // TNK overrides - map our colors to Mantine
  tnk: (
    'color-body': var(--background),
    'color-text': var(--text),
    'color-anchor': var(--primary),
    'color-default': var(--background-surface),
    'color-default-hover': var(--background-surface-light),
    'color-default-border': var(--border),
    'color-dimmed': var(--text-muted),
    'color-error': var(--error),
    'color-success': var(--success),
    'primary-color': 'primary-name',
    'font-family': 'Font Name, system-ui',
    'font-family-headings': 'Heading Font, system-ui',
    'radius-default': '8px',
    'shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.1)',
    'shadow-md': '0 4px 16px rgba(0, 0, 0, 0.15)'
  ),

  // Light mode variants (optional)
  colors-light: (
    // Light mode color overrides
  ),

  tnk-light: (
    // Light mode TNK overrides
  )
);
```

### Phase 5: Component Migration

- All component SCSS files continue using `--mantine-*` variables
- No changes needed to existing components
- New components follow the same pattern

## Overview

This guide documents the refactoring of the Tanaka theme system to use a bridge pattern between our themes and Mantine's CSS variables.

## Architecture

### Core Concept

```text
Mantine Defaults → TNK Bridge Variables → Theme Overrides → Back to Mantine
```

1. **TNK Variables**: Mirror important Mantine variables with `--tnk-` prefix
2. **Initialization**: TNK variables inherit from Mantine defaults
3. **Theme Override**: Themes modify TNK variables
4. **Application**: TNK variables are mapped back to Mantine variables

### Why This Approach?

- **Future-proof**: Automatically inherits Mantine updates
- **Selective**: Themes only override what they need
- **Clean**: Clear separation between framework and theme variables
- **Compatible**: Components use standard Mantine variables

## Implementation Details

### 1. Base Structure (_base.scss)

```scss
// Define bridge variables map - just the essentials
$tnk-defaults: (
  // Core colors (8)
  'color-body': var(--mantine-color-body),
  'color-text': var(--mantine-color-text),
  'color-anchor': var(--mantine-color-anchor),
  'color-default': var(--mantine-color-default),
  'color-default-hover': var(--mantine-color-default-hover),
  'color-default-border': var(--mantine-color-default-border),
  'color-dimmed': var(--mantine-color-dimmed),
  'color-error': var(--mantine-color-error),
  'color-success': var(--mantine-color-green-6),
  'color-white': var(--mantine-color-white),
  'color-black': var(--mantine-color-black),

  // Typography (5)
  'font-family': var(--mantine-font-family),
  'font-family-headings': var(--mantine-font-family-headings),
  'font-size-md': var(--mantine-font-size-md),
  'h1-font-size': var(--mantine-h1-font-size),
  'h2-font-size': var(--mantine-h2-font-size),

  // Layout (4)
  'radius-default': var(--mantine-radius-default),
  'spacing-sm': var(--mantine-spacing-sm),
  'spacing-md': var(--mantine-spacing-md),
  'spacing-lg': var(--mantine-spacing-lg),

  // Shadows (2)
  'shadow-sm': var(--mantine-shadow-sm),
  'shadow-md': var(--mantine-shadow-md),

  // Primary color (3)
  'primary-color': var(--mantine-primary-color),
  'primary-color-filled': var(--mantine-primary-color-filled),
  'primary-color-light': var(--mantine-primary-color-light)
);
```

### 2. Theme Structure

Each theme provides:

- **colors**: Theme-specific color palette
- **colors-light**: Light mode variant
- **scales**: Color scales to generate (e.g., 'indigo', 'violet')
- **tnk**: TNK variable overrides

```scss
$twilight-theme: (
  name: 'twilight',
  colors: $twilight-colors,
  colors-light: $twilight-colors-light,
  scales: (
    'indigo': $primary,
    'violet': $secondary,
    'amber': $accent
  ),
  tnk: (
    'color-body': var(--background),
    'color-text': var(--text),
    'color-anchor': var(--primary),
    'color-default': var(--background-surface),
    'color-default-hover': var(--background-surface-light),
    'color-default-border': var(--border),
    'color-dimmed': var(--text-muted),
    'color-error': var(--error),
    'color-placeholder': var(--text-dim),
    'primary-color': 'indigo',
    'radius-default': '8px'
  )
);
```

### 3. Application Process

```scss
@mixin apply-complete-theme($theme) {
  // 1. Initialize TNK variables from Mantine defaults
  @include apply-tnk-defaults();

  // 2. Apply theme colors
  @include apply-theme-colors(map.get($theme, colors));

  // 3. Generate color scales
  @include generate-color-scales(map.get($theme, scales));

  // 4. Apply TNK overrides from theme
  @include apply-tnk-overrides(map.get($theme, tnk));

  // 5. Map TNK variables back to Mantine
  @include map-tnk-to-mantine();

  // 6. Apply light mode if applicable
  &[data-mantine-color-scheme="light"] {
    // Apply light colors and re-map
  }
}
```

## Variable Reference

### Essential TNK Variables

#### Colors

- `--tnk-color-body`: Page background
- `--tnk-color-text`: Default text color
- `--tnk-color-anchor`: Link color
- `--tnk-color-default`: Default component background
- `--tnk-color-default-hover`: Default component hover
- `--tnk-color-default-border`: Default border color
- `--tnk-color-dimmed`: Muted text
- `--tnk-color-error`: Error state color
- `--tnk-color-success`: Success state color
- `--tnk-color-placeholder`: Input placeholder

#### Typography

- `--tnk-font-family`: Base font family
- `--tnk-font-family-monospace`: Monospace font
- `--tnk-font-family-headings`: Heading font
- `--tnk-font-size-md`: Base font size

#### Layout & Spacing

- `--tnk-radius-default`: Default border radius
- `--tnk-spacing-sm`: Small spacing
- `--tnk-spacing-md`: Medium spacing
- `--tnk-spacing-lg`: Large spacing

#### Shadows

- `--tnk-shadow-xs`: Extra small shadow
- `--tnk-shadow-sm`: Small shadow
- `--tnk-shadow-md`: Medium shadow

#### Primary Color

- `--tnk-primary-color`: Name of primary color scale
- `--tnk-primary-color-filled`: Filled variant background
- `--tnk-primary-color-light`: Light variant background

## Migration Guide

### For Component Files

No changes needed! Continue using `--mantine-*` variables:

```scss
.component {
  background: var(--mantine-color-body);
  color: var(--mantine-color-text);
  border: 1px solid var(--mantine-color-default-border);
}
```

### For Theme Authors

1. Define your color palette
2. Map colors to TNK variables in the `tnk` section
3. Specify which color scales to generate

## Implementation Guide

### Using These Themes

1. **Import the theme** in your `_all.scss`:

   ```scss
   @import 'theme-name';
   ```

2. **Apply the theme** to your root element:

   ```scss
   [data-theme="theme-name"] {
     @include apply-complete-theme($theme-name);
   }
   ```

3. **Switch themes** via JavaScript:

   ```javascript
   document.documentElement.setAttribute('data-theme', 'theme-name');
   ```

### Customizing Themes

To create your own theme:

1. Copy the theme structure template
2. Define your 14 semantic colors
3. Choose which Mantine color scales to generate
4. Map your colors to TNK variables
5. Optionally add light mode variants
6. Override any of the 22 TNK variables as needed

### Debug Mode

For development, you can enable debug output to see TNK variable state:

```scss
// In your theme file or _base.scss
$debug-mode: true;

// This will output all TNK variables to the console during compilation
@if $debug-mode {
  @include debug-tnk-variables();
}
```

### DevTools Workflow

Since every TNK variable maps to a Mantine variable, you can iterate quickly:

1. Open your app in Firefox DevTools
2. Find the CSS variables on the `<html>` element
3. Live-edit values to see instant changes
4. Copy final values back to your theme file

This is especially useful for:

- Fine-tuning colors
- Adjusting spacing
- Testing shadow depths
- Finding the perfect radius

## Benefits

1. **Mantine Updates**: We automatically get new Mantine features
2. **Theme Isolation**: Themes don't need to know about Mantine internals
3. **Lean & Focused**: Just ~22 variables cover 90% of theming needs
4. **Maintainability**: Clear contract between themes and framework
5. **Performance**: No runtime overhead, all resolved at build time
6. **Practical**: Based on real-world theme requirements, not theoretical completeness

## Performance Tips

- Only import themes you actually use
- Consider lazy-loading theme CSS for faster initial load
- Use CSS custom properties for dynamic theme switching
- Keep custom shadows simple for better performance
- Consider using CSS custom properties for animations to enable GPU acceleration

## Accessibility Considerations

- Ensure sufficient contrast ratios (WCAG AA minimum)
- Test themes with color blindness simulators
- Provide a high contrast theme option
- Consider reduced motion preferences for animated themes
- Provide a "reduce motion" option for users who prefer less animation
- Align spacing tokens to a common 4px grid (e.g., 4/8/12/16) for consistent rhythm
- Every primary/secondary palette needs the full 10 Mantine shades
- Audit all state colors for color-blind safety: use red/teal instead of red/green

## Implementation Notes

- Define each `theme.colors.{name}` with **ten shades**—Mantine derives `--mantine-color-{name}-{shade}` and primary variables automatically.
- Once `primaryColor` is set, Mantine exposes `--mantine-primary-color-*` for filled/light/outline variants, hover states, etc.
- For quick prototyping, override only the scale indices you use most: 4‑6 for filled variants, 0‑2 for subtle backgrounds.

## Future Enhancements

### Medium Priority

- **Hover States**: Add primary color hover states (`primary-color-filled-hover`, `primary-color-light-hover`)
- **Additional Font Sizes**: Include full font size scale (xs, sm, lg, xl)
- **Warning Color**: Add `color-warning` for completeness
- **Border Styles**: Add border width and style variables
- **Focus States**: Add focus ring color and style variables

### Low Priority

- **Component-Specific Variables**:
  - Card padding and shadows
  - Input heights and borders
  - Modal overlay opacity
- **Theme Composition**: Helper functions for extending themes
- **Debug Tools**: Development helpers for inspecting TNK variables
- **Performance Optimization**: Lazy-loading individual themes
- **Theme Variants**: Create dim/bright variants of existing themes
