# SCSS Roadmap for Tanaka Extension

> **Note**: This document contains the technical roadmap for remaining SCSS work.  
> For completed phases, see [archive/SCSS_MIGRATION_PHASES_1-2.5.md](./archive/SCSS_MIGRATION_PHASES_1-2.5.md).  
> For task tracking, see [TODOS.md](./TODOS.md).

## Current Status

- **Phase 1-2.5**: ✅ **COMPLETED** - Foundation, component migration, and architecture cleanup
- **Phase 3**: 🚧 **IN PROGRESS** - Consolidation & Optimization
- **Phase 4**: ⏳ **PENDING** - Production Pages

## Architecture Overview

### SCSS Folder Structure

```text
extension/src/
├── styles/
│   ├── _variables.scss          # Design tokens (spacing, breakpoints, z-index)
│   ├── _mixins.scss             # Reusable mixins and functions
│   ├── _animations.scss         # Keyframe animations
│   ├── _shared.scss             # Base styles and resets
│   └── themes/
│       ├── _base.scss           # Theme structure and mixins
│       ├── _twilight.scss       # Twilight theme CSS variables
│       └── _all.scss            # Theme orchestrator
│
├── components/                  # Shared components (kebab-case)
│   ├── button/
│   │   ├── button.tsx
│   │   └── button.scss          # BEM: .tnk-button
│   └── [component]/
│       ├── [component].tsx
│       └── [component].scss
│
└── [app]/                       # App-specific structure
    ├── components/              # App-specific components
    └── [app].scss               # App entry point styles
```

### Core Principles

1. **Mantine components** - Use built-in props only (no styles/sx props)
2. **Custom components** - Use SCSS files with BEM methodology
3. **Theme values** - Reference Mantine CSS variables exclusively
4. **No inline styles** - All styles in SCSS files
5. **No CSS-in-JS** - Remove all runtime style generation
6. **Global CSS classes** - Use `.tnk-` prefix for all custom components
7. **Explicit naming** - Direct class names for searchability

## Phase 3: Consolidation & Optimization

### Goals
- Polish the twilight theme for production use
- Extract reusable patterns into mixins
- Optimize bundle size further
- Ensure consistent patterns across all components

### Technical Tasks

See [TODOS.md](./TODOS.md#branch-featscss-phase-3) for current task list.

### Key Deliverables

1. **Finalized Twilight Theme**
   - Production-ready color palette
   - Consistent shadow and gradient system
   - Proper dark/light mode support

2. **Shared Mixins Library**
   - Button variants
   - Card styles
   - Form elements
   - Animation utilities

3. **Performance Metrics**
   - Bundle size < 100KB for styles
   - Zero runtime style generation
   - Optimized critical path CSS

## Phase 4: Production Pages

### Goals
- Implement popup and settings pages with new SCSS architecture
- Apply consistent theme across all UI surfaces
- Ensure accessibility and performance

### Implementation Plan

#### Popup Page
- Lightweight bundle (target: < 50KB total)
- Window tracking interface
- Real-time sync status
- Quick actions

#### Settings Page
- Full-featured configuration
- Server connection management
- Theme preferences
- Device management

### Component Guidelines

```scss
// Component Structure
.tnk-[component] {
  // Base styles using CSS variables

  &__[element] {
    // Element styles
  }

  &--[modifier] {
    // Modifier styles
  }
}
```

```tsx
// TypeScript Component
import "./[component].scss";

export function Component({ variant = "default" }) {
  return (
    <div className={`tnk-component tnk-component--${variant}`}>
      {/* content */}
    </div>
  );
}
```

## Technical Patterns

### Theme Variables

```scss
// Use Mantine CSS variables
.tnk-component {
  color: var(--mantine-color-text);
  background: var(--mantine-color-body);
  padding: var(--mantine-spacing-md);
}

// Custom theme variables
.theme-style-twilight {
  --twilight-gradient-primary: linear-gradient(135deg, #6366f1, #8b5cf6);
  --twilight-shadow-glow: 0 0 20px rgba(139, 92, 246, 0.3);
}
```

### Responsive Design

```scss
@use "../styles/mixins" as m;

.tnk-component {
  @include m.respond-to("md") {
    // Tablet and up styles
  }

  @include m.respond-to("lg") {
    // Desktop styles
  }
}
```

### Animation Patterns

```scss
@use "../styles/animations";

.tnk-component {
  animation: fadeIn 0.3s ease-out;

  &--loading {
    animation: pulse 1.5s infinite;
  }
}
```

## Build Configuration

The build system is already configured for:
- SCSS compilation with source maps
- PostCSS with autoprefixer
- PurgeCSS for production builds
- CSS extraction and minification
- Stylelint for code quality

See the technical configuration details in [archive/SCSS_MIGRATION_PHASES_1-2.5.md](./archive/SCSS_MIGRATION_PHASES_1-2.5.md#build-configuration).

## References

- [STYLING_GUIDE.md](./STYLING_GUIDE.md) - Developer styling reference
- [COMPONENT_TEMPLATE.md](./COMPONENT_TEMPLATE.md) - Component boilerplate
- [TODOS.md](./TODOS.md) - Task tracking
- [Archive](./archive/) - Completed work documentation
