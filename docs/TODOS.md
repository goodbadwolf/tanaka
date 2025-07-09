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

**Note: v3 Design Elements to Preserve**

- Colors: #6366f1 (primary), #8b5cf6 (secondary), #0a0a0b (dark bg), #0f0f10 (surface)
- UI: Purple gradient buttons, glowing effects, card-based layout, smooth animations

### Branch: `docs/operational-basics`

**Basic Documentation**

- [ ] Write simple deployment steps
- [ ] Document backup/restore process
- [ ] List common issues and fixes

### Branch: `chore/update-cargo-test-references`

**Update cargo test to cargo nextest**

- [ ] Update .github/workflows/ci.yml to use cargo nextest run
- [ ] Check all documentation files for cargo test references
- [ ] Update any scripts that use cargo test
- [ ] Verify pre-commit hooks use nextest

### Branch: `docs/git-best-practices`

**Git Best Practices Documentation**

- [ ] Document that `git add -A` should never be used
- [ ] Explain why it stages unintended files
- [ ] Show alternatives: `git add <specific-files>` or `git add -p`
- [ ] Update CLAUDE.md with this guideline
- [ ] Add to contributor documentation

### Branch: `fix/memory-leaks`

**Fix Memory Leaks & Performance**

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

**Error Recovery**

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

### Branch: `feat/mantine-setup`

**Setup Mantine** (UI Redesign - build components iteratively as needed)
**NOTE**: Pick one item at a time when working, and commit it when finished after confirmation from the user. Only then move on to the next one

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
- [ ] Create styling utility functions for reusable patterns
- [x] Add full-page gradient background to playground:
  - CSS class: `.playground-container` with `min-height: 100vh`
  - Background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
  - Apply to Container with `size="lg"` and `padding: 2rem`
- [ ] Implement animated gradients with keyframes:
  - 4-color gradient: `#ee7752, #e73c7e, #23a6d5, #23d5ab`
  - Animation: `gradient 15s ease infinite` with `backgroundSize: 400% 400%`
  - Keyframes: 0% → 50% → 100% background position transitions
- [ ] Create debugStyles utilities:
  - `getClassName: (component, variant) => \`tanaka-${component}${variant ? \`--${variant}\` : ''}\``
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

# Mantine v8 Styling Implementation Report

## Overall Assessment

Your plan excellently follows the recommended hybrid styling approach. The combination of plain CSS for base styles and CSS-in-JS for dynamic behavior will provide optimal DevTools visibility while maintaining flexibility. Here's my detailed analysis with implementation guidance.

## File Structure Recommendation

```
extension/src/
├── playground/
│   ├── styles/
│   │   ├── playground.css          # Main playground styles
│   │   ├── animations.css          # Keyframe animations
│   │   ├── components.css          # Reusable component styles
│   │   └── utilities.css           # Utility classes
│   ├── utils/
│   │   └── debug-styles.ts         # Styling utility functions
│   ├── index.tsx
│   ├── playground-app.tsx
│   └── styled-example.tsx
└── themes/
    ├── theme-config.ts             # Enhanced with v3 colors
    └── index.ts
```

## Implementation Details

### 1. Enhanced Theme Configuration

**File: `extension/src/themes/theme-config.ts`**

```typescript
import { MantineThemeOverride } from '@mantine/core';

export const theme: MantineThemeOverride = {
  colors: {
    // V3-inspired purple shades
    indigo: [
      '#eef2ff',
      '#e0e7ff',
      '#c7d2fe',
      '#a5b4fc',
      '#818cf8',
      '#6366f1', // Primary v3 color
      '#4f46e5',
      '#4338ca',
      '#3730a3',
      '#312e81'
    ],
    violet: [
      '#f5f3ff',
      '#ede9fe',
      '#ddd6fe',
      '#c4b5fd',
      '#a78bfa',
      '#8b5cf6', // Secondary v3 color
      '#7c3aed',
      '#6d28d9',
      '#5b21b6',
      '#4c1d95'
    ]
  },
  primaryColor: 'indigo',
  primaryShade: { light: 5, dark: 6 },
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  defaultRadius: 'md',
  shadows: {
    xs: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
    sm: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  }
};
```

**Reasoning**: Using the exact v3 colors (#6366f1, #8b5cf6) as anchor points in the color arrays ensures consistency with the v3 design system while maintaining Mantine's 10-shade color system.

### 2. Base CSS Files

**File: `extension/src/playground/styles/playground.css`**

```css
/* Import other style modules */
@import './animations.css';
@import './components.css';
@import './utilities.css';

/* Container Styles */
.playground-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

/* Responsive padding adjustment */
@media (max-width: 768px) {
  .playground-container {
    padding: 1rem;
  }
}

/* Debug mode styles */
body.debug [data-component]::before {
  content: attr(data-component);
  position: absolute;
  top: -20px;
  left: 0;
  font-size: 10px;
  color: var(--mantine-color-gray-6);
  font-family: 'Monaco', 'Consolas', monospace;
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 6px;
  border-radius: 4px;
  z-index: 1000;
}
```

**File: `extension/src/playground/styles/components.css`**

```css
/* Button Components */
.custom-button {
  background: linear-gradient(45deg, #fc466b 0%, #3f5efb 100%);
  border: none;
  transition: all 0.3s ease;
  font-weight: 600;
  position: relative;
  overflow: hidden;
}

.custom-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.custom-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.custom-button:hover::before {
  left: 100%;
}

/* Card Components */
.glowing-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  transition: all 0.3s ease;
}

.glowing-card:hover {
  box-shadow:
    0 8px 32px 0 rgba(31, 38, 135, 0.37),
    0 0 30px rgba(255, 255, 255, 0.5);
  border-color: rgba(255, 255, 255, 0.4);
}

/* Gradient Text */
.gradient-text {
  background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold;
}
```

**File: `extension/src/playground/styles/animations.css`**

```css
/* Animated Gradient Background */
@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.animated-gradient {
  background: linear-gradient(45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
}

/* Pulse Animation for CTAs */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
  }
}

.pulse-effect {
  animation: pulse 2s infinite;
}
```

### 3. Styling Utilities

**File: `extension/src/playground/utils/debug-styles.ts`**

```typescript
import { MantineTheme } from '@mantine/core';
import React from 'react';

interface DebugStyles {
  getClassName: (component: string, variant?: string) => string;
  createStyledComponent: <P extends Record<string, any>>(
    Component: React.ComponentType<P>,
    displayName: string,
    styles: any
  ) => React.ComponentType<P>;
}

export const debugStyles: DebugStyles = {
  getClassName: (component: string, variant?: string) => {
    return `tanaka-${component}${variant ? `--${variant}` : ''}`;
  },

  createStyledComponent: <P extends Record<string, any>>(
    Component: React.ComponentType<P>,
    displayName: string,
    styles: any
  ) => {
    const StyledComponent = React.forwardRef<any, P>((props, ref) => {
      return React.createElement(Component, {
        ...props,
        ref,
        'data-styled-component': displayName,
        styles,
      });
    });

    StyledComponent.displayName = displayName;
    return StyledComponent as React.ComponentType<P>;
  },
};

// Reusable styled components
export const GradientButton = debugStyles.createStyledComponent(
  Button,
  'GradientButton',
  {
    root: {
      background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
      border: 0,
      borderRadius: 3,
      boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
      color: 'white',
      height: 48,
      padding: '0 30px',
      fontWeight: 600,
      transition: 'all 0.3s ease',

      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 10px 2px rgba(255, 105, 135, .4)',
      },

      '&:active': {
        transform: 'translateY(0)',
      }
    }
  }
);

// Theme-aware style helpers
export const getThemeAwareGradient = (theme: MantineTheme, colorScheme: 'light' | 'dark') => {
  return colorScheme === 'dark'
    ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
    : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)';
};
```

### 4. Component Implementation

**File: `extension/src/playground/styled-example.tsx`**

```typescript
import { Button, Box, Text, Paper, Stack } from '@mantine/core';
import { useComputedColorScheme, useMantineTheme } from '@mantine/core';
import { GradientButton, debugStyles, getThemeAwareGradient } from './utils/debug-styles';

export function StyledExample() {
  const { colorScheme } = useComputedColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';

  return (
    <Stack gap="xl" className={debugStyles.getClassName('example', 'container')}>
      {/* Glass morphism card with combined styling */}
      <Paper
        className="glowing-card"
        data-component="glowing-card"
        p="xl"
        styles={{
          root: {
            '&:hover': {
              transform: 'scale(1.02)',
              transition: 'transform 0.2s ease'
            }
          }
        }}
      >
        <Text size="lg" weight={600} mb="md">
          Glass Morphism Effect
        </Text>
        <Button className="custom-button">
          Hover for Shimmer Effect
        </Button>
      </Paper>

      {/* Animated gradient background */}
      <Paper
        className="animated-gradient"
        data-component="animated-gradient-card"
        p="xl"
        styles={{
          root: {
            color: 'white',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <Text size="lg" weight={600}>
          Animated 4-Color Gradient
        </Text>
      </Paper>

      {/* Theme-aware styling */}
      <Paper
        data-component="theme-aware-card"
        p="xl"
        style={{
          background: getThemeAwareGradient(theme, colorScheme),
          transition: 'background 0.3s ease'
        }}
      >
        <Text size="lg" weight={600} mb="md">
          Theme-Aware Gradient
        </Text>
        <Text size="sm" color="dimmed">
          Switches between light and dark gradients
        </Text>
      </Paper>

      {/* Pink outline button with dynamic hover */}
      <Button
        variant="outline"
        size="lg"
        data-component="pink-outline-button"
        style={{
          borderColor: 'var(--mantine-color-pink-6)',
          color: 'var(--mantine-color-pink-6)'
        }}
        styles={{
          root: {
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: 'var(--mantine-color-pink-6)',
              color: 'white',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)'
            }
          }
        }}
      >
        Pink Outline with Dynamic Hover
      </Button>

      {/* Gradient text example */}
      <Text
        size="xl"
        className="gradient-text"
        data-component="gradient-text"
      >
        Beautiful Gradient Text Effect
      </Text>

      {/* Using the GradientButton utility */}
      <GradientButton>
        Reusable Gradient Button
      </GradientButton>
    </Stack>
  );
}
```

### 5. Main Playground Component

**File: `extension/src/playground/playground-app.tsx`**

```typescript
import { Button, Container, Title, Text, Stack, Divider } from '@mantine/core';
import { ThemeProvider, useTheme } from '../themes';
import { StyledExample } from './styled-example';
import './styles/playground.css';

function PlaygroundContainer() {
  const { colorScheme, toggleTheme } = useTheme();

  return (
    <Container
      size="lg"
      className="playground-container"
      data-component="playground-container"
    >
      <Stack gap="xl">
        <div style={{ textAlign: 'center' }}>
          <Title
            order={1}
            style={{
              color: 'white',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
              marginBottom: '1rem'
            }}
          >
            Tanaka UI Playground
          </Title>
          <Text size="lg" c="white">
            Mantine v8 with Hybrid Styling
          </Text>
        </div>

        <Button
          onClick={toggleTheme}
          variant="white"
          size="lg"
          className="pulse-effect"
          data-component="theme-toggle"
          styles={{
            root: {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#764ba2',
              fontWeight: 600,
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              transition: 'all 0.3s ease',

              '&:hover': {
                backgroundColor: 'white',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)'
              }
            }
          }}
        >
          Toggle {colorScheme === 'light' ? 'Dark' : 'Light'} Mode
        </Button>

        <Divider
          color="rgba(255, 255, 255, 0.3)"
          size="md"
          styles={{
            root: {
              backdropFilter: 'blur(10px)'
            }
          }}
        />

        <StyledExample />
      </Stack>
    </Container>
  );
}

export function PlaygroundApp() {
  return (
    <ThemeProvider>
      <PlaygroundContainer />
    </ThemeProvider>
  );
}
```

## Key Benefits of This Implementation

### 1. **DevTools Visibility**
- All base styles are in CSS files with meaningful class names
- `data-component` attributes make components easily identifiable
- CSS custom properties allow live editing of theme values

### 2. **Performance**
- CSS classes are cached by the browser
- Dynamic styles only applied where necessary
- Animations use GPU-accelerated properties (transform, opacity)

### 3. **Maintainability**
- Clear separation between static and dynamic styles
- Reusable utility functions reduce code duplication
- Theme integration ensures consistency

### 4. **Developer Experience**
- IntelliSense support for CSS classes
- Type-safe style utilities
- Easy debugging with meaningful component names

## Best Practices Applied

1. **CSS-in-JS Usage**: Limited to interactive states and theme-dependent values
2. **Class Naming**: Semantic names that describe the component's purpose
3. **Performance**: Using `transform` and `opacity` for animations instead of layout properties
4. **Accessibility**: Maintaining proper contrast ratios and focus states
5. **Browser Compatibility**: Including vendor prefixes for backdrop-filter

## Debugging Tips

1. Add `body.debug` class to enable component name tooltips
2. Use Chrome DevTools' Rendering tab to visualize repaints
3. Check the Computed styles panel to see cascade resolution
4. Use the Coverage tab to identify unused CSS

This implementation provides the perfect balance between DevTools visibility, performance, and developer experience while maintaining the flexibility needed for complex UI interactions.


### Branch: `feat/popup-redesign`

**Popup Redesign**

- [ ] Set up MantineProvider in popup entry point
- [ ] Get popup page working end-to-end with Mantine
- [ ] Window list with tracking toggles
- [ ] Sync status indicator with live animation
- [ ] Quick action buttons (Track Window, Sync Now)
- [ ] Theme toggle in header
- [ ] Build components inline as needed

### Branch: `feat/settings-redesign`

**Settings Redesign**

- [ ] Set up MantineProvider in settings entry point
- [ ] Tabbed interface (General, Sync, Devices, Advanced, About)
- [ ] Theme toggle in header
- [ ] Server configuration form
- [ ] Device management list
- [ ] Extract shared components if patterns emerge

### Branch: `feat/remaining-pages`

**Additional Pages**

- [ ] Onboarding flow (if needed)
- [ ] Error states with troubleshooting
- [ ] Empty states for no windows/tabs
- [ ] Continue building components as required

### Branch: `feat/ui-polish`

**Polish & Refactor**

- [ ] Extract truly reusable components
- [ ] Optimize bundle size (target < 150KB)
- [ ] Performance improvements (TTI < 200ms, smooth 60fps)
- [ ] Visual consistency pass
- [ ] Firefox compatibility testing
- [ ] Improve error messages with better copy
- [ ] Add tooltips for complex features
- [ ] Add keyboard navigation support

### Branch: `chore/postcss-setup`

**PostCSS Configuration**

- [ ] Add PostCSS configuration for advanced CSS features
- [ ] Install postcss, postcss-loader, and autoprefixer
- [ ] Configure PostCSS for Mantine UI optimizations
- [ ] Test CSS modules and vendor prefixing

### Branch: `feat/code-cleanup`

**Code Quality**

- [ ] Fix TypeScript strict mode issues
- [ ] Increase test coverage to 80%
- [ ] Remove dead code
- [ ] Update dependencies

### Branch: `feat/v1-release`

**Release**

- [ ] Submit to Mozilla addon store
- [ ] Create signed release builds
- [ ] Write installation guide
- [ ] Test full user journey
- [ ] Tag v1.0 release

---
