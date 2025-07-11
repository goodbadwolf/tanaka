# Component Template

This template provides the standard structure for creating new components in the Tanaka extension.

## File Structure

```
components/
└── [component-name]/          # kebab-case folder name
    ├── [component-name].tsx   # Component implementation
    ├── [component-name].scss  # Component styles
    └── index.ts               # Barrel export
```

## Component Implementation Template

### `[component-name].tsx`

```tsx
import { forwardRef } from 'react';
import { clsx } from 'clsx';
import './[component-name].scss';

export interface [ComponentName]Props {
  /** Visual style variant */
  variant?: 'default' | 'primary' | 'secondary';
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Additional CSS classes */
  className?: string;
  /** Child elements */
  children?: React.ReactNode;
  // Add more props as needed
}

export const [ComponentName] = forwardRef<HTMLDivElement, [ComponentName]Props>(
  ({ variant = 'default', size = 'medium', className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'tnk-[component-name]',
          `tnk-[component-name]--${variant}`,
          `tnk-[component-name]--${size}`,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

[ComponentName].displayName = '[ComponentName]';
```

### `[component-name].scss`

```scss
@use '../../styles/core' as *;

.tnk-[component-name] {
  // Base styles
  position: relative;
  display: block;
  font-family: $font-family-base;
  transition: all var(--transition);

  // Theme-aware styles
  background: var(--background-surface);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: radius(md);

  // Interactive states
  @include hover-style {
    background: var(--background-surface-light);
    box-shadow: var(--shadow-sm);
  }

  @include focus-style;

  &:active {
    transform: scale(0.98);
  }

  // Size variants
  &--small {
    padding: spacing(xs) spacing(sm);
    font-size: font-size(sm);
  }

  &--medium {
    padding: spacing(sm) spacing(md);
    font-size: font-size(base);
  }

  &--large {
    padding: spacing(md) spacing(lg);
    font-size: font-size(lg);
  }

  // Style variants
  &--primary {
    background: var(--primary);
    color: var(--text-on-primary);
    border-color: var(--primary-dark);

    @include hover-style {
      background: var(--primary-dark);
    }
  }

  &--secondary {
    background: var(--secondary);
    color: var(--text-on-secondary);
    border-color: var(--secondary-dark);

    @include hover-style {
      background: var(--secondary-dark);
    }
  }

  // State modifiers
  &.is-loading {
    opacity: 0.7;
    pointer-events: none;

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 20px;
      height: 20px;
      margin: -10px 0 0 -10px;
      border: 2px solid var(--primary);
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  }

  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  // Child elements (BEM)
  &__header {
    margin-bottom: spacing(sm);
    font-weight: font-weight(semibold);
    @include text-truncate;
  }

  &__content {
    line-height: 1.6;
  }

  &__footer {
    margin-top: spacing(sm);
    padding-top: spacing(sm);
    border-top: 1px solid var(--border-light);
  }

  // Responsive
  @include respond-to(sm) {
    &--large {
      padding: spacing(lg) spacing(xl);
    }
  }
}

// Animation keyframes
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

### `index.ts`

```ts
export { [ComponentName] } from './[component-name]';
export type { [ComponentName]Props } from './[component-name]';
```

## Usage Example

```tsx
import { [ComponentName] } from '../components/[component-name]';

function App() {
  return (
    <[ComponentName] variant="primary" size="large">
      Content goes here
    </[ComponentName]>
  );
}
```

## Checklist

When creating a new component, ensure:

- [ ] Component folder uses kebab-case naming
- [ ] All files follow the naming convention
- [ ] Component has TypeScript props interface
- [ ] SCSS file uses `.tnk-` prefix for all classes
- [ ] BEM methodology is followed for child elements
- [ ] Theme-aware CSS variables are used for colors
- [ ] SCSS mixins are used for layout and interactions
- [ ] Responsive behavior is considered
- [ ] Component is exported from index.ts
- [ ] Props are documented with JSDoc comments
- [ ] DisplayName is set for debugging
- [ ] Component works in both light and dark themes

## Common Patterns

### Icon Support

```tsx
interface Props {
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

// In component
{icon && (
  <span className={clsx(
    'tnk-[component-name]__icon',
    `tnk-[component-name]__icon--${iconPosition}`
  )}>
    {icon}
  </span>
)}
```

```scss
&__icon {
  @include flex-center;
  width: 20px;
  height: 20px;

  &--left {
    margin-right: spacing(xs);
  }

  &--right {
    margin-left: spacing(xs);
    order: 1;
  }
}
```

### Loading State

```tsx
interface Props {
  loading?: boolean;
}

// In component
<div className={clsx(
  'tnk-[component-name]',
  { 'is-loading': loading }
)}>
```

### Compound Components

```tsx
// Parent component
export const Card = ({ children }) => (
  <div className="tnk-card">{children}</div>
);

// Child components
Card.Header = ({ children }) => (
  <div className="tnk-card__header">{children}</div>
);

Card.Body = ({ children }) => (
  <div className="tnk-card__body">{children}</div>
);

// Usage
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
</Card>
```
