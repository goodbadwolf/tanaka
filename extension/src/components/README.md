# Tanaka UI Components

A collection of reusable UI components for the Tanaka browser extension.

## Components

### Button

A versatile button component with multiple variants and states.

```tsx
import { Button } from '../components';

<Button variant="primary" onClick={handleClick}>
  Click me
</Button>

<Button variant="danger" loading>
  Deleting...
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'danger'
- `size`: 'small' | 'medium' | 'large'
- `loading`: boolean
- `disabled`: boolean
- `fullWidth`: boolean

### Input

Form input component with built-in validation and error handling.

```tsx
import { Input } from '../components';

<Input
  label="Email"
  type="email"
  required
  validate={(value) => !value.includes('@') ? 'Invalid email' : undefined}
  onChange={handleChange}
/>
```

**Props:**
- `type`: 'text' | 'email' | 'password' | 'url' | 'number'
- `label`: string
- `error`: string | boolean
- `validate`: (value: string) => string | undefined
- `required`: boolean

### LoadingSpinner

Animated loading indicator with size and color variants.

```tsx
import { LoadingSpinner } from '../components';

<LoadingSpinner size="large" color="primary" />
```

**Props:**
- `size`: 'small' | 'medium' | 'large'
- `color`: 'primary' | 'secondary' | 'white'
- `ariaLabel`: string

### ErrorMessage

Display error, warning, or info messages with optional dismiss functionality.

```tsx
import { ErrorMessage } from '../components';

<ErrorMessage
  type="error"
  title="Connection Failed"
  message="Unable to connect to the server"
  onDismiss={() => setError(null)}
/>
```

**Props:**
- `type`: 'error' | 'warning' | 'info'
- `title`: string (optional)
- `message`: string
- `dismissible`: boolean
- `onDismiss`: () => void

### Card

Container component with optional header and footer sections.

```tsx
import { Card } from '../components';

<Card
  variant="elevated"
  header="Settings"
  footer={<Button>Save Changes</Button>}
>
  <p>Card content goes here</p>
</Card>
```

**Props:**
- `variant`: 'default' | 'outlined' | 'elevated'
- `padding`: 'none' | 'small' | 'medium' | 'large'
- `header`: ReactNode
- `footer`: ReactNode
- `interactive`: boolean
- `onClick`: () => void

## Testing

All components include comprehensive test suites. Run tests with:

```bash
pnpm test
```

## Styling

Components use CSS Modules for scoped styling. Each component has its own `.module.css` file that defines all styles.

### Theming

Components use CSS variables for consistent theming:

- Primary color: `#3b82f6`
- Error color: `#ef4444`
- Text color: `#111827`
- Border color: `#e5e7eb`

## Accessibility

All components follow accessibility best practices:

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly
- Focus indicators
- Color contrast compliance
