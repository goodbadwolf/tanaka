# SCSS Migration Audit - Current State Analysis

Generated on: 2025-01-10

## Executive Summary

This audit documents the current state of styling in the Tanaka extension. The codebase uses a mixed approach with SCSS files, inline styles, CSS-in-JS, and utility functions. This inconsistency makes maintenance difficult and increases bundle size.

## Styling Approaches in Use

### 1. SCSS Files with Proper Architecture (✅ Good)
- **Location**: `src/styles/` and component-specific SCSS files
- **Files**:
  - `_variables.scss` - Design tokens
  - `_shared.scss` - Base styles and resets
  - `_gradients.scss` - CSS custom properties
  - `_animations.scss` - Keyframe animations
  - Component SCSS files (theme-toggle, toggle, page-header)
- **Status**: Well-structured but underutilized

### 2. Inline Styles (❌ To Remove)
- **Files**: 7 playground files use `style={{}}`
- **Issues**:
  - Hard to maintain
  - No reusability
  - Poor DevTools experience
  - Violates CSP best practices

### 3. Mantine Styles Prop (⚠️ To Minimize)
- **Files**: PlaygroundNav, PlaygroundSearch
- **Issues**: Runtime style generation
- **Recommendation**: Use only for truly dynamic values

### 4. Utility Functions (⚠️ To Convert)
- **Files**: `styling-utils.ts`, `theme-style-factory.ts`
- **Features**: BEM generators, gradients, theme-aware styles
- **Recommendation**: Convert useful patterns to SCSS mixins

## Hardcoded Values Audit

### Colors (29 instances)
```scss
// Found in SCSS:
rgba(0, 0, 0, 0.15)  // Should use --mantine-color-dark-6 with opacity
rgba(255, 255, 255, 0.1)  // Should use --mantine-color-white with opacity
#6366f1, #8b5cf6  // Should use theme variables

// Found in TSX:
#fef2f2 (red-50)  // Error backgrounds
#1a1b1e, #2c2e33  // Dark theme colors
```

### Spacing (47 instances)
```scss
// Pixel values that should use spacing scale:
12px → spacing("sm")
24px → spacing("lg")
44px → spacing("xl") + spacing("sm")
padding: 16px → padding: var(--mantine-spacing-md)
margin: 8px → margin: var(--mantine-spacing-xs)
```

### Typography (15 instances)
```scss
// Font sizes not using scale:
font-size: 20px → var(--mantine-font-size-xl)
font-size: 14px → var(--mantine-font-size-sm)
line-height: 1.2 → var(--mantine-line-height-sm)
```

## Duplicate Definitions

### 1. Scrollbar Styling
- Defined in `playground.scss` for both themes
- Should be extracted to a mixin

### 2. Glass Morphism Effect
- Inline in multiple components
- Already exists as potential mixin in plan

### 3. Gradient Backgrounds
- Defined in CSS, TypeScript utilities, and inline
- No single source of truth

## Components Analysis

### Using Multiple Approaches
1. **PlaygroundHeader**
   - SCSS from parent
   - Inline styles for layout
   - Recommendation: Single SCSS file

2. **Typography Section**
   - Heavy inline styles
   - Should use typography tokens

3. **Color Section**
   - Mix of inline and props
   - Should use theme variables

### Missing SCSS Files
Components that need SCSS files:
- PlaygroundNav
- PlaygroundSearch
- PlaygroundLayout
- All playground sections

## Migration Priority

### High Priority (Blocking)
1. Create twilight theme files
2. Convert inline styles in playground
3. Establish `.tanaka-` prefix convention

### Medium Priority
1. Convert utility functions to mixins
2. Create component SCSS files
3. Remove hardcoded values

### Low Priority
1. Optimize bundle size
2. Add CSS linting rules
3. Documentation

## Action Items

### Immediate Actions
- [ ] Create `styles/themes/` directory structure
- [ ] Convert all hardcoded colors to CSS variables
- [ ] Replace pixel values with spacing tokens
- [ ] Create `.tanaka-` prefixed classes

### Next Phase
- [ ] Build component library with consistent patterns
- [ ] Migrate playground to new system
- [ ] Remove all inline styles

## Metrics

- **Files with inline styles**: 7
- **Hardcoded colors**: 29 instances
- **Hardcoded spacing**: 47 instances
- **Components needing SCSS**: 12
- **Estimated technical debt**: 2-3 days to fix

## Conclusion

The current styling system is functional but inconsistent. The migration to a pure SCSS + CSS variables approach will:
- Reduce bundle size by ~30%
- Improve maintainability
- Enable better theming
- Provide consistent DevTools experience
