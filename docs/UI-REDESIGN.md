# Tanaka Extension UI Redesign with Mantine

**Purpose**: Redesign the Tanaka Firefox extension UI using Mantine, inspired by v3 prototype  
**Audience**: Developer (personal project)  
**Approach**: Iterative - build components as needed

## Navigation

- [🏠 Home](../README.md)
- [🚀 Getting Started](GETTING-STARTED.md)
- [💻 Development](DEVELOPMENT.md)
- [🏗️ Architecture](ARCHITECTURE.md)
- [🔧 Troubleshooting](TROUBLESHOOTING.md)
- [📝 Git Guidelines](GIT.md)
- [🎨 UI Redesign](UI-REDESIGN.md)

---

## Overview

Complete UI redesign of the Tanaka extension using Mantine components, taking inspiration from the v3 prototype's aesthetic while adding modern features like theme switching.

### Design Philosophy

- **Iterative Development**: Build components as needed for each page
- **No Premature Abstraction**: Create reusable components only when patterns emerge
- **Visual First**: Focus on achieving the desired look, refactor later
- **Rapid Prototyping**: Use Mantine's pre-built components to move fast

### Why Mantine?

- **Fast Development**: Pre-built components save time
- **Theme System**: Easy light/dark mode switching
- **Modern Look**: Clean, contemporary design out of the box
- **Good Defaults**: Less custom CSS needed

---

## Redesign Approach

### Phase 1: Setup Mantine
**Branch**: `feat/mantine-setup`

- Install Mantine and dependencies
- Basic theme configuration (colors from v3)
- Set up provider in extension entry points
- Get one page working end-to-end

### Phase 2: Popup Redesign
**Branch**: `feat/popup-redesign`

Start with the most used interface:
- Window list with tracking toggles
- Sync status indicator
- Quick action buttons
- Build components inline as needed

### Phase 3: Settings Redesign
**Branch**: `feat/settings-redesign`

- Tabbed interface for different sections
- Theme toggle in header
- Server configuration form
- Extract shared components if patterns emerge

### Phase 4: Additional Pages
**Branch**: `feat/remaining-pages`

- Onboarding flow (if needed)
- Error states
- Empty states
- Continue building components as required

### Phase 5: Polish & Refactor
**Branch**: `feat/ui-polish`

- Extract truly reusable components
- Optimize bundle size
- Performance improvements
- Visual consistency pass

---

## Design Inspiration from v3

### Colors to Preserve
- **Primary**: #6366f1 (indigo gradient)
- **Secondary**: #8b5cf6 (purple accent)
- **Dark Background**: #0a0a0b
- **Surface**: #0f0f10

### Elements to Recreate
- Purple gradient buttons for primary actions
- Glowing effects on interactive elements
- Card-based layout for window list
- Smooth animations and transitions

### New Additions
- Light theme option
- Improved visual feedback
- Modern form inputs
- Better loading states

---

## Implementation Strategy

### Start Simple
```
1. Install Mantine
2. Wrap app with MantineProvider
3. Start building Popup page
4. Use Mantine components directly
5. Add custom styling as needed
```

### Component Evolution
```
Inline styles → Styled components → Reusable components
(only when needed)
```

### Example Flow
1. Need a button? Use `<Button>` directly
2. Need custom styling? Add inline styles
3. Using similar button 3+ times? Extract component
4. Keep moving forward

---

## Success Metrics

1. **Visual Appeal**: Looks modern and polished
2. **Performance**: No noticeable slowdown
3. **User Experience**: Intuitive and smooth
4. **Development Speed**: Faster than custom CSS

---

## Technical Notes

### Bundle Size
- Monitor size as we add components
- Tree-shaking should keep it reasonable
- Lazy load if needed

### Theme Switching
- Store preference in browser storage
- No flash on reload
- Smooth transition between themes

### Firefox Compatibility
- Test in Firefox Developer Edition
- Ensure extensions APIs work properly
- Check popup sizing constraints

---

## Next Steps

1. Create feature branch
2. Install Mantine
3. Start with Popup page
4. Build iteratively
5. Ship when it looks good

No over-engineering. Just make it work, make it pretty, then make it better.
