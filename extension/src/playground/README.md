# Tanaka UI Playground

A comprehensive component showcase and testing environment for the Tanaka extension UI components.

## Overview

The playground serves as:
- 📚 **Component Library** - Browse all UI components with examples
- 🔍 **Searchable Documentation** - Find components quickly
- 💻 **Code Examples** - Copy-paste ready code snippets
- 🎨 **Theme Testing** - See components in different themes
- 🧪 **Development Environment** - Test new components

## Architecture

### Current Implementation (playground-app.tsx)

The original playground is a monolithic component with 890+ lines that showcases Mantine components. While functional, it has several limitations:

- **Monolithic Structure**: Everything in one large file
- **Poor Discoverability**: Hard to find specific components
- **No Code Examples**: Can't see or copy the source code
- **Limited Interactivity**: Static examples only

### Improved Architecture (playground-app-v2.tsx)

The new modular architecture addresses these issues:

```
playground/
├── components/           # Reusable playground components
│   ├── ComponentExample.tsx    # Wrapper for each example
│   ├── PlaygroundSection.tsx   # Section container
│   └── PlaygroundSearch.tsx    # Search functionality
├── sections/            # Component examples by category
│   ├── buttons.tsx      # Button & action components
│   ├── inputs.tsx       # Form input components
│   ├── selection.tsx    # Checkboxes, radios, toggles
│   └── index.ts         # Section exports
├── types.ts             # TypeScript interfaces
├── playground.scss      # Playground styles
├── playground-app.tsx   # Original implementation
└── playground-app-v2.tsx # New modular implementation
```

## Key Features

### 🔍 Search Functionality
- Real-time filtering across all components
- Searches in titles, descriptions, and code
- Auto-expands matching sections
- Clear search with one click

### 💻 Code Preview
- Toggle code view for each example
- Copy code to clipboard
- Syntax highlighting ready
- Clean, formatted code examples

### 📦 Modular Sections
- Each category in its own file
- Easy to add new components
- Consistent structure
- Type-safe with TypeScript

### 🎨 Theme Support
- Components adapt to theme changes
- Twilight theme (additional themes coming soon)
- Dark/light mode support
- Live theme switching

## Usage

### Adding a New Section

1. Create a new file in `sections/`:

```tsx
// sections/my-section.tsx
import { IconStar } from '@tabler/icons-preact';
import type { PlaygroundSection } from '../types';

export const mySection: PlaygroundSection = {
  id: 'my-section',
  title: 'My Components',
  icon: <IconStar size={20} />,
  description: 'Description of this section',
  examples: [
    {
      id: 'example-1',
      title: 'Example Component',
      description: 'What this example shows',
      component: <MyComponent />,
      code: `<MyComponent />`
    }
  ]
};
```

2. Export from `sections/index.ts`:

```tsx
export { mySection } from './my-section';
```

3. Add to `playground-app-v2.tsx`:

```tsx
const ALL_SECTIONS: PlaygroundSectionType[] = [
  inputsSection,
  buttonsSection,
  selectionSection,
  mySection, // Add here
];
```

### Adding a New Example

Add to an existing section's examples array:

```tsx
{
  id: 'unique-id',
  title: 'Example Title',
  description: 'Optional description',
  component: <YourComponent prop="value" />,
  code: `<YourComponent prop="value" />`
}
```

## Component Structure

### PlaygroundSection
Container for a group of related components:
- Accordion-based expansion
- Icon and description support
- Contains multiple examples

### ComponentExample
Individual example wrapper:
- Title and description
- Live component preview
- Collapsible code view
- Copy code functionality

### PlaygroundSearch
Search input with clear button:
- Sticky positioning
- Real-time filtering
- Keyboard accessible

## Development

### Running the Playground

```bash
# Development mode with hot reload
pnpm run dev

# Open in browser
pnpm run webapp
```

### Testing New Components

1. Create your component
2. Add to appropriate section
3. Include usage examples
4. Test in both themes

### Best Practices

- **Keep examples focused**: Show one concept per example
- **Provide context**: Add descriptions explaining the use case
- **Include variations**: Show different props/states
- **Make code copyable**: Ensure code examples work standalone
- **Test accessibility**: Verify keyboard navigation and screen readers

## Future Enhancements

### Phase 1: Complete Migration
- [ ] Migrate remaining sections from original playground
- [ ] Add display components (badges, alerts, progress)
- [ ] Add typography examples
- [ ] Add layout components
- [ ] Add navigation components
- [ ] Add data display components

### Phase 2: Enhanced Features
- [ ] Live prop editing with controls
- [ ] Export examples to CodeSandbox
- [ ] Component API documentation
- [ ] Performance metrics display
- [ ] Accessibility audit results

### Phase 3: Advanced Tools
- [ ] Visual regression testing
- [ ] Component dependency graph
- [ ] Bundle size analysis
- [ ] Theme customization tools
- [ ] Component generator

## Benefits

### For Developers
- 🚀 Faster component discovery
- 📋 Copy-paste ready examples
- 🔧 Easy to test changes
- 📚 Living documentation

### For Designers
- 🎨 See all components in one place
- 🌈 Test theme variations
- 📱 Check responsive behavior
- ✨ Explore interactions

### For the Project
- 🏗️ Maintainable architecture
- 📈 Scalable structure
- 🧪 Better testing environment
- 📖 Self-documenting

## Contributing

When adding new components:

1. Follow the existing structure
2. Include multiple examples showing different use cases
3. Write clean, copyable code examples
4. Test in both themes
5. Ensure accessibility
6. Update this README if needed

## Related Documentation

- [Component Development](../components/README.md)
- [Theme System](../themes/README.md)
- [SCSS Migration](../../docs/SCSS_MIGRATION_PLAN.md)
