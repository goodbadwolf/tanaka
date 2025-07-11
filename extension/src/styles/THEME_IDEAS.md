# Theme Concepts for Tanaka

This document presents theme ideas. Each includes both the creative design concept and how to implement it using the theme system supported by Tanaka.

## Table of Contents

- [Synthwave Circuit](#synthwave-circuit)
- [Solarpunk Meadow](#solarpunk-meadow)
- [Midnight Jellyfish](#midnight-jellyfish)
- [Bioluminescent Depths](#bioluminescent-depths---deep-ocean-theme)
- [Vapor Dream](#vapor-dream---vaporwave-aesthetic)
- [Enchanted Grove](#enchanted-grove---fantasy-forest-theme)
- [Twilight](#twilight---professional-dark-theme)
- [Neon](#neon---cyberpunk-high-contrast)
- [Midnight](#midnight---ultra-dark-oled)
- [Theme Combinations](#theme-combinations)

## Synthwave Circuit

### Overview

| Aspect              | Suggestions                                                                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Mood**            | Neon arcades, late‑80s vector grids, high contrast.                                                                                       |
| **Primary color**   | `circuitMagenta` – shades from `#FFE2FF` → `#5B0066` (0‑9).                                                                               |
| **Accent**          | Cyan glow `#00E5FF`. Yellow accent reserved for call-to-action elements only.                                                             |
| **Background**      | `#0D0D1A` deep dark purple.                                                                                                               |
| **Typography**      | `Space Grotesk`, monospace code in `JetBrains Mono`.                                                                                      |
| **Radius & Shadow** | `radius-md: 4px`; custom glow shadow: `0 0 12px rgba(255, 0, 229, 0.4)` on interactive items.                                            |

### Design Concept

A retro-futuristic theme inspired by 1980s synthwave culture and neon arcade aesthetics. Dark backgrounds make the electric colors pop while maintaining excellent readability.

### Color Palette & Special Effects

```scss
$synthwave: (
  // Base colors
  background: #0D0D1A,        // Deep dark purple
  surface: #1A1A2E,           // Purple surface
  surface-light: #252542,     // Lighter purple

  // Text hierarchy
  text: #FF33F1,              // Lighter magenta
  text-muted: #CC99CC,        // Muted pink
  text-dim: #996699,          // Dimmed purple

  // Accent colors
  primary: #FF00E5,           // Circuit magenta
  secondary: #00E5FF,         // Cyan glow
  accent: #FFDD00,            // Electric yellow

  // States
  error: #FF3366,             // Neon red
  success: #00FF88,           // Electric green
  warning: #FFAA00,           // Amber warning

  // Special effects
  glow-magenta: 0 0 12px rgba(255, 0, 229, 0.4),
  glow-cyan: 0 0 12px rgba(0, 229, 255, 0.4),
  border-glow: rgba(255, 0, 229, 0.6)
);
```

### Typography & Features

- Headers: "Space Grotesk" (geometric, futuristic)
- Body: "Space Grotesk" (consistent with headers)
- Code: "JetBrains Mono" (monospace for tech flavor)

### Special CSS Effects

```scss
.synthwave-circuit-theme {
  // Neon glow on interactive elements
  button:hover {
    box-shadow: var(--glow-magenta);
    transform: translateY(-1px);
  }

  // Glowing borders
  .card {
    border: 1px solid var(--border-glow);
    box-shadow: var(--glow-magenta);
  }

  // Electric text shadows
  h1, h2 {
    text-shadow: 0 0 8px currentColor;
  }

  // Circuit-inspired focus states
  :focus {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(255, 0, 229, 0.3);
  }
}
```

### TNK Implementation

```scss
$synthwave-circuit-theme: (
  name: 'synthwave-circuit',

  colors: (
    // Backgrounds
    background: #0D0D1A,
    'background-surface': #1A1A2E,
    'background-surface-light': #252542,

    // Text hierarchy
    text: #FF33F1,        // Lighter magenta for better contrast
    'text-muted': #CC99CC,
    'text-dim': #996699,

    // Interactive elements
    primary: #FF00E5,      // Circuit magenta
    secondary: #00E5FF,    // Cyan glow
    accent: #FFDD00,       // Electric yellow (reserved for CTAs)

    // States
    error: #FF3366,
    success: #00FF88,
    warning: #FFAA00,

    // Structure
    border: #5B0066
  ),

  scales: (
    'magenta': primary,
    'cyan': secondary,
    'yellow': accent
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
    'color-success': var(--success),
    'primary-color': 'magenta',
    'font-family': '"Space Grotesk", -apple-system, BlinkMacSystemFont, sans-serif',
    'font-family-headings': '"Space Grotesk", -apple-system, BlinkMacSystemFont, sans-serif',
    'h1-font-size': '2.5rem',
    'h2-font-size': '2rem',
    'radius-default': '4px',
    'spacing-sm': '0.5rem',
    'spacing-md': '1rem',
    'spacing-lg': '1.5rem',
    'shadow-sm': '0 0 12px rgba(255, 0, 229, 0.4)',
    'shadow-md': '0 0 24px rgba(255, 0, 229, 0.6)'
  )
);
```

## Solarpunk Meadow

### Overview

| Aspect              | Suggestions                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------- |
| **Mood**            | Bright handmade UI, recycled paper textures, optimism.                                      |
| **Primary color**   | `meadowGreen` – `#E7FBEF` → `#104D2C`.                                                      |
| **Accent**          | Sunflower `#FFD93D`; secondary sky `#7BB8E0` (darkened for AA contrast).                    |
| **Background**      | Parchment tint `#FBFBEE`.                                                                    |
| **Typography**      | Headings **Poppins**, body **Open Sans**.                                                   |
| **Radius & Shadow** | Soft radius (`md: 8px`), shadow‑xs only—tiny offset + pastel RGBA.                          |
| **Spacing bump**    | `spacing-sm: 1rem`, `spacing-md: 1.5rem` for breathable cards (4px grid aligned).           |

### Design Concept

A sustainable, optimistic theme inspired by solarpunk aesthetics and handcrafted design. Light, airy colors evoke recycled paper and natural materials with a focus on readability and comfort.

### Color Palette & Special Effects

```scss
$solarpunk: (
  // Base colors
  background: #FBFBEE,        // Parchment tint
  surface: #F0F0DC,           // Recycled paper
  surface-light: #E8E8D0,     // Lighter paper

  // Text hierarchy
  text: #104D2C,              // Deep forest green
  text-muted: #3A6B4C,        // Forest muted
  text-dim: #5A8B6C,          // Sage green

  // Accent colors
  primary: #2D7A2D,           // Meadow green
  secondary: #FFD93D,         // Sunflower yellow
  accent: #7BB8E0,            // Sky blue

  // States
  error: #D93D3D,             // Natural red
  success: #2D7A2D,           // Growth green
  warning: #FF9F1C,           // Sunset orange

  // Natural textures
  paper-texture: rgba(139, 69, 19, 0.05),
  soft-shadow: rgba(0, 0, 0, 0.06)
);
```

### Typography & Features

- Headers: "Poppins" (friendly, rounded)
- Body: "Open Sans" (highly readable, optimized)
- Accent: "Inter" for technical content

### Special CSS Effects

```scss
.solarpunk-meadow-theme {
  // Soft paper texture overlay
  body::before {
    content: "";
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--paper-texture);
    pointer-events: none;
    z-index: -1;
  }

  // Gentle hover effects
  button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px var(--soft-shadow);
  }

  // Organic focus rings
  :focus {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
    border-radius: 4px;
  }

  // Breathing space animations
  .card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: scale(1.02);
    }
  }
}
```

### TNK Implementation

```scss
$solarpunk-meadow-theme: (
  name: 'solarpunk-meadow',

  colors: (
    // Backgrounds - Light and airy
    background: #FBFBEE,
    'background-surface': #F0F0DC,
    'background-surface-light': #E8E8D0,

    // Text hierarchy
    text: #104D2C,
    'text-muted': #3A6B4C,
    'text-dim': #5A8B6C,

    // Interactive elements
    primary: #2D7A2D,      // Meadow green
    secondary: #FFD93D,    // Sunflower
    accent: #7BB8E0,       // Sky blue (darkened for contrast)

    // States
    error: #D93D3D,
    success: #2D7A2D,
    warning: #FF9F1C,

    // Structure
    border: #C5D4C5
  ),

  scales: (
    'green': primary,
    'yellow': secondary,
    'sky': accent
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
    'color-success': var(--success),
    'primary-color': 'green',
    'font-family': '"Open Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    'font-family-headings': '"Poppins", -apple-system, BlinkMacSystemFont, sans-serif',
    'h1-font-size': '2.25rem',
    'h2-font-size': '1.875rem',
    'radius-default': '8px',
    'spacing-sm': '1rem',
    'spacing-md': '1.5rem',
    'spacing-lg': '2rem',
    'shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.06)',
    'shadow-md': '0 4px 16px rgba(0, 0, 0, 0.08)'
  ),

  colors-light: (
    background: #2D3E2D,
    'background-surface': #445544,     // Lightened for better contrast
    'background-surface-light': #556655,
    text: #F0F0DC,
    'text-muted': #C5D4C5,
    'text-dim': #9BAA9B,
    border: #5A6B5A
  ),

  tnk-light: (
    'shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.3)',
    'shadow-md': '0 4px 16px rgba(0, 0, 0, 0.4)'
  )
);
```

## Midnight Jellyfish

### Overview

| Aspect              | Suggestions                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| **Mood**            | Deep‑sea dark UI, bioluminescent highlights, glassmorphism.                                             |
| **Primary color**   | `abyssBlue` – `#E3F4FF` → `#05182C`.                                                                    |
| **Accent**          | Neon aqua `#20F6FF` (primary), dimmed aqua `#0FB8CF` (secondary buttons), and coral pink `#FF6B9C`.    |
| **Background**      | Nearly‑black `#050912`.                                                                                  |
| **Typography**      | `Fira Sans` with `Fira Code` for tech flavour.                                                          |
| **Radius & Shadow** | Medium radius (`md: 8px`); colored drop shadow: `0 0 24px rgba(32, 246, 255, 0.2)`.                     |

### Design Concept

A mysterious deep-sea theme inspired by bioluminescent jellyfish and ocean depths. Glassmorphism effects and aqua glows create an underwater ambiance perfect for immersive work sessions.

### Color Palette & Special Effects

```scss
$midnight-jellyfish: (
  // Base colors
  background: #050912,        // Nearly black abyss
  surface: #0A1424,           // Deep water
  surface-light: #0F1F36,     // Lighter depth

  // Text hierarchy
  text: #E3F4FF,              // Phosphorescent blue
  text-muted: #A0C4E0,        // Dim luminescence
  text-dim: #6090B0,          // Deep blue

  // Accent colors
  primary: #20F6FF,           // Neon aqua jellyfish
  secondary: #0FB8CF,         // Dimmed aqua
  accent: #FF6B9C,            // Coral pink

  // States
  error: #FF4757,             // Warning coral
  success: #00D9A3,           // Aqua success
  warning: #FFB800,           // Amber glow

  // Special effects
  jellyfish-glow: 0 0 24px rgba(32, 246, 255, 0.2),
  coral-glow: 0 0 20px rgba(255, 107, 156, 0.3),
  glassmorphism: rgba(163, 230, 255, 0.1)
);
```

### Typography & Features

- Headers: "Fira Sans" (clean, technical)
- Body: "Fira Sans" (consistent readability)
- Code: "Fira Code" (programming ligatures)

### Special CSS Effects

```scss
.midnight-jellyfish-theme {
  // Glassmorphism effect
  .card {
    background: var(--glassmorphism);
    backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(32, 246, 255, 0.2);
  }

  // Jellyfish glow animation
  @keyframes jellyfish-pulse {
    0%, 100% {
      box-shadow: var(--jellyfish-glow);
      opacity: 0.8;
    }
    50% {
      box-shadow: 0 0 40px rgba(32, 246, 255, 0.4);
      opacity: 1;
    }
  }

  // Interactive elements with aqua glow
  button:hover {
    animation: jellyfish-pulse 2s ease-in-out infinite;
    transform: translateY(-2px);
  }

  // Flowing focus states
  :focus {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(32, 246, 255, 0.3);
  }

  // Coral accent highlights
  .accent {
    box-shadow: var(--coral-glow);
  }
}
```

### TNK Implementation

```scss
$midnight-jellyfish-theme: (
  name: 'midnight-jellyfish',

  colors: (
    // Backgrounds - Deep sea
    background: #050912,
    'background-surface': #0A1424,
    'background-surface-light': #0F1F36,

    // Text hierarchy
    text: #E3F4FF,
    'text-muted': #A0C4E0,
    'text-dim': #6090B0,

    // Interactive elements
    primary: #20F6FF,      // Neon aqua
    secondary: #0FB8CF,    // Dimmed aqua for secondary buttons
    accent: #FF6B9C,       // Coral pink

    // States
    error: #FF4757,
    success: #00D9A3,
    warning: #FFB800,

    // Structure
    border: #1A2B48
  ),

  scales: (
    'aqua': primary,
    'aqua-dim': secondary,
    'pink': accent
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
    'color-success': var(--success),
    'primary-color': 'aqua',
    'font-family': '"Fira Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    'font-family-headings': '"Fira Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    'h1-font-size': '2.25rem',
    'h2-font-size': '1.875rem',
    'radius-default': '8px',
    'spacing-sm': '0.75rem',
    'spacing-md': '1rem',
    'spacing-lg': '1.5rem',
    'shadow-sm': '0 0 24px rgba(32, 246, 255, 0.2)',
    'shadow-md': '0 0 48px rgba(32, 246, 255, 0.3)'
  )
);
```

## **"Bioluminescent Depths"** - Deep Ocean Theme

### Overview

| Aspect              | Suggestions                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| **Mood**            | Deep-sea bioluminescence, glowing organisms, underwater ambiance.                                |
| **Primary color**   | `aquaNeon` – `#00FFCC` (jellyfish glow).                                                        |
| **Accent**          | Hot pink `#FF00E5` (coral), electric lime `#7FFF00` (algae) - use one per component layer.      |
| **Background**      | `#030B1A` with gradient overlays, deep ocean floor darkness.                                     |
| **Typography**      | `Oxanium` headers (futuristic), `Inter` body with increased letter-spacing, font-weight: 600.   |
| **Radius & Shadow** | `radius-default: 6px`; glowing shadows `0 0 20px rgba(0, 255, 204, 0.3)`.                       |

### Design Concept

Inspired by deep-sea creatures and bioluminescent organisms. Dark as the ocean floor with glowing accents that pulse like jellyfish.

### Color Palette & Special Effects

```scss
$bioluminescent: (
  // Base colors
  background: #030B1A,        // Midnight abyss
  surface: #051426,           // Deep trench
  surface-light: #0A1F3B,     // Continental shelf

  // Text hierarchy
  text: #B8E3FF,              // Phosphorescent blue
  text-muted: #6FA9D4,        // Dim bioluminescence
  text-dim: #426B8C,          // Deep water

  // Accent colors
  primary: #00FFCC,           // Neon aqua (jellyfish)
  secondary: #FF00E5,         // Hot pink (coral)
  accent: #7FFF00,            // Electric lime (algae)

  // States
  error: #FF3366,             // Warning red (poisonous)
  success: #00FF88,           // Bioluminescent green
  warning: #FFB700,           // Anglerfish lure

);
```

### Typography & Features

- Headers: "Oxanium" (futuristic, geometric)
- Body: "Inter" with increased letter-spacing, font-weight: 600
- Code: "Fira Code" with ligatures

### Special CSS Effects

```scss
.bioluminescent-theme {
  // Glowing buttons on hover
  button:hover {
    box-shadow: var(--glow-primary);
    transform: translateY(-2px);
  }

  // Animated gradient borders (gated)
  @media (prefers-reduced-motion: no-preference) {
    .card {
      background-image: var(--gradient-surface), var(--border-gradient);
      background-origin: border-box;
      background-clip: padding-box, border-box;
    }
  }

  // Pulsing animation for primary elements
  @keyframes bioluminescent-pulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; filter: brightness(1.2); }
  }

  @media (prefers-reduced-motion: no-preference) {
    .primary-glow {
      animation: bioluminescent-pulse 3s ease-in-out infinite;
    }
  }
}
```

### TNK Implementation

```scss
$bioluminescent-depths-theme: (
  name: 'bioluminescent-depths',

  colors: (
    background: #030B1A,
    'background-surface': #051426,
    'background-surface-light': #0A1F3B,
    text: #B8E3FF,
    'text-muted': #6FA9D4,
    'text-dim': #426B8C,
    primary: #00FFCC,
    secondary: #FF00E5,
    accent: #7FFF00,
    error: #FF3366,
    success: #00FF88,
    warning: #FFB700,
    border: #1A3A5A
  ),

  scales: (
    'aqua': primary,
    'magenta': secondary,
    'lime': accent
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
    'color-success': var(--success),
    'primary-color': 'aqua',
    'font-family': '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    'font-family-headings': '"Oxanium", -apple-system, BlinkMacSystemFont, sans-serif',
    'font-weight': '600',
    'h1-font-size': '2.5rem',
    'h2-font-size': '2rem',
    'radius-default': '6px',
    'spacing-sm': '0.75rem',
    'spacing-md': '1rem',
    'spacing-lg': '1.5rem',
    'shadow-sm': '0 0 20px rgba(0, 255, 204, 0.3)',
    'shadow-md': '0 0 40px rgba(0, 255, 204, 0.4)'
  )
);
```

## **"Vapor Dream"** - Vaporwave Aesthetic

### Overview

| Aspect              | Suggestions                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| **Mood**            | 90s nostalgia, Miami sunset, CRT monitors, Japanese city pop vibes.                               |
| **Primary color**   | `hotPink` – `#FF1A7E` (lightened for better contrast).                                           |
| **Accent**          | Cyan blue `#00F5FF`, VHS yellow `#FFDD00`.                                                       |
| **Background**      | `#1A0033` deep purple night with scan line overlays (≤ 5% opacity).                               |
| **Typography**      | `Righteous` headers (retro), `Space Mono` body (monospace).                                       |
| **Radius & Shadow** | `radius-default: 0px` (sharp edges); retro shadows `4px 4px 0 #000`. Squared focus outlines.      |
| **Extras**          | CRT scan lines effect, chrome text gradients, retro button styles with inset shadows.             |

### Design Concept

90s nostalgia meets cyberpunk. Think Miami sunset, CRT monitors, and Japanese city pop. Heavy on gradients and retro-futuristic vibes.

### Color Palette & Special Effects

```scss
$vapor-dream: (
  // Base colors
  background: #1A0033,        // Deep purple night
  surface: #2D1B69,           // VHS purple
  surface-light: #3D2B79,     // Lighter VHS

  // Text hierarchy
  text: #FFDEE9,              // Soft pink cream
  text-muted: #B8A3C8,        // Muted lavender
  text-dim: #8B7399,          // Dusty purple

  // Accent colors
  primary: #FF1A7E,           // Hot pink (lightened)
  secondary: #00F5FF,         // Cyan blue
  accent: #FFDD00,            // VHS yellow

  // States
  error: #FF10F0,             // Magenta alert
  success: #00FF41,           // Matrix green
  warning: #FF8C00,           // Sunset orange

  // Special effects
  gradient-primary: linear-gradient(135deg, #FF006E 0%, #8B00FF 100%),
  gradient-sunset: linear-gradient(180deg, #FF006E 0%, #FFDD00 50%, #00F5FF 100%),
  chrome-text: linear-gradient(180deg, #C0C0C0 0%, #FFFFFF 50%, #C0C0C0 100%),
  scan-lines: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.05),
    rgba(0, 0, 0, 0.05) 1px,
    transparent 1px,
    transparent 2px
  )
);
```

### Typography & Features

- Headers: "Righteous" (retro, bold)
- Body: "Space Mono" (monospace, techy)
- Accent: "Bungee" for special callouts

### Special CSS Effects

```scss
.vapor-dream-theme {
  // Chrome text effect for headers
  h1, h2 {
    background: var(--chrome-text);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  // CRT monitor effect
  &::before {
    content: "";
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--scan-lines);
    pointer-events: none;
    z-index: 1;
  }

  // Retro button style
  button {
    border: 2px solid currentColor;
    box-shadow:
      4px 4px 0 #000,
      inset -2px -2px 0 rgba(0, 0, 0, 0.5),
      inset 2px 2px 0 rgba(255, 255, 255, 0.3);

    &:active {
      transform: translate(2px, 2px);
      box-shadow:
        2px 2px 0 #000,
        inset -1px -1px 0 rgba(0, 0, 0, 0.5),
        inset 1px 1px 0 rgba(255, 255, 255, 0.3);
    }
  }

  // Squared focus outlines to match retro theme
  :focus {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
    border-radius: 0;
  }
}
```

### TNK Implementation

```scss
$vapor-dream-theme: (
  name: 'vapor-dream',

  colors: (
    background: #1A0033,
    'background-surface': #2D1B69,
    'background-surface-light': #3D2B79,
    text: #FFDEE9,
    'text-muted': #B8A3C8,
    'text-dim': #8B7399,
    primary: #FF1A7E,
    secondary: #00F5FF,
    accent: #FFDD00,
    error: #FF10F0,
    success: #00FF41,
    warning: #FF8C00,
    border: #4A3A7A
  ),

  scales: (
    'pink': primary,
    'cyan': secondary,
    'yellow': accent
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
    'color-success': var(--success),
    'primary-color': 'pink',
    'font-family': '"Space Mono", "Courier New", monospace',
    'font-family-headings': '"Righteous", -apple-system, BlinkMacSystemFont, sans-serif',
    'h1-font-size': '2.625rem',
    'h2-font-size': '2.125rem',
    'radius-default': '0px',
    'spacing-sm': '0.5rem',
    'spacing-md': '1rem',
    'spacing-lg': '1.5rem',
    'shadow-sm': '4px 4px 0 #000',
    'shadow-md': '8px 8px 0 #000'
  )
);
```

## **"Enchanted Grove"** - Fantasy Forest Theme

### Overview

| Aspect              | Suggestions                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Mood**            | Magical forest, Studio Ghibli inspired, organic and mystical.                                              |
| **Primary color**   | `fairyGreen` – `#6BCF7F` (more natural luminescent green).                                                |
| **Accent**          | Sunset mushroom `#FFB366`, magic purple `#E066FF`.                                                        |
| **Background**      | `#0A0F0A` forest floor darkness with nature textures.                                                      |
| **Typography**      | `Philosopher` headers (mystical serif), `Quattrocento Sans` body.                                          |
| **Radius & Shadow** | `radius-default: 12px`; organic shadows with green glow `0 4px 12px rgba(107, 207, 127, 0.15)`.           |
| **Animation**       | Floating spore particles (low z-index), magical glow pulses. Organic borders restricted to decorative containers. |

### Design Concept

Magical forest meets Studio Ghibli. Organic shapes, particle effects like floating spores, and colors that shift between day/twilight modes.

### Color Palette & Special Effects

```scss
$enchanted-grove: (
  // Base colors
  background: #0A0F0A,        // Forest floor
  surface: #1A2418,           // Moss covered stone
  surface-light: #2A3428,     // Lighter moss

  // Text hierarchy
  text: #E8F5E8,              // Moonlit leaves
  text-muted: #B8D4B8,        // Faded sage
  text-dim: #7A9A7A,          // Deep forest

  // Accent colors
  primary: #6BCF7F,           // Natural fairy light green
  secondary: #FFB366,         // Sunset mushroom
  accent: #E066FF,            // Magic purple

  // States
  error: #FF6B6B,             // Poison berry red
  success: #4ECDC4,           // Fresh spring water
  warning: #FFE66D,           // Firefly yellow

  // Nature elements
  bark: #4A3C28,              // Tree bark brown
  gold: #FFD700,              // Sunbeam gold
  mist: rgba(255, 255, 255, 0.1),

  // Special effects
  dappled-light: radial-gradient(
    ellipse at top,
    rgba(255, 215, 0, 0.2) 0%,
    transparent 70%
  ),
  leaf-shadow: url("data:image/svg+xml,%3Csvg...leaf-pattern...%3E")
);
```

### Typography & Features

- Headers: "Philosopher" (mystical serif)
- Body: "Quattrocento Sans" (readable, organic)
- Accent: "Kalam" for handwritten notes

### Special CSS Effects

```scss
.enchanted-grove-theme {
  // Organic border radius (only on decorative containers)
  .decorative-container {
    border-radius: 30% 70% 70% 30% / 30% 30% 70% 70% !important;
  }

  // Floating particle effect (low z-index)
  &::after {
    content: "";
    position: fixed;
    width: 100%;
    height: 100%;
    background-image: radial-gradient(circle, var(--gold) 1px, transparent 1px), radial-gradient(circle, var(--primary) 1px, transparent 1px);
    background-size: 50px 50px, 80px 80px;
    background-position: 0 0, 25px 25px;
    animation: float-spores 20s linear infinite;
    opacity: 0.3;
    pointer-events: none;
    z-index: 0; // Low z-index for tooltips/modals
  }

  @keyframes float-spores {
    from { transform: translateY(0) rotate(0deg); }
    to { transform: translateY(-100px) rotate(360deg); }
  }

  // Magical glow on interactive elements
  button, a, input:focus {
    position: relative;
    &::before {
      content: "";
      position: absolute;
      inset: -3px;
      background: var(--primary);
      filter: blur(10px);
      opacity: 0;
      transition: opacity 0.3s;
      z-index: -1;
    }

    &:hover::before {
      opacity: 0.5;
      animation: magic-pulse 2s ease-in-out infinite;
    }
  }

  // Nature-inspired transitions
  * {
    transition-timing-function: cubic-bezier(0.4, 0.0, 0.2, 1);
  }
}
```

### TNK Implementation

```scss
$enchanted-grove-theme: (
  name: 'enchanted-grove',

  colors: (
    background: #0A0F0A,
    'background-surface': #1A2418,
    'background-surface-light': #2A3428,
    text: #E8F5E8,
    'text-muted': #B8D4B8,
    'text-dim': #7A9A7A,
    primary: #6BCF7F,
    secondary: #FFB366,
    accent: #E066FF,
    error: #FF6B6B,
    success: #4ECDC4,
    warning: #FFE66D,
    border: #3A4438
  ),

  scales: (
    'green': primary,
    'orange': secondary,
    'purple': accent
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
    'color-success': var(--success),
    'primary-color': 'green',
    'font-family': '"Quattrocento Sans", Georgia, serif',
    'font-family-headings': '"Philosopher", Georgia, serif',
    'h1-font-size': '2.375rem',
    'h2-font-size': '1.875rem',
    'radius-default': '12px',
    'spacing-sm': '0.75rem',
    'spacing-md': '1rem',
    'spacing-lg': '1.5rem',
    'shadow-sm': '0 4px 12px rgba(107, 207, 127, 0.15)',
    'shadow-md': '0 8px 24px rgba(107, 207, 127, 0.2)'
  ),

  colors-light: (
    primary: #4A9B5A,      // Deeper moss green for light mode
    secondary: #E09A4F,    // Darker mushroom
    accent: #C550E0,       // Darker purple
  )
);
```

## **"Twilight"** - Professional Dark Theme

### Overview

| Aspect              | Suggestions                                                                         |
| ------------------- | ----------------------------------------------------------------------------------- |
| **Mood**            | Refined professional dark, extended coding sessions, clean and elegant.              |
| **Primary color**   | `indigo` – `#6366f1`.                                                               |
| **Accent**          | Violet `#8b5cf6`, amber `#D97706` (darkened for contrast).                         |
| **Background**      | `#0f0f17` deep twilight with subtle gradients.                                      |
| **Typography**      | System UI fonts for clean professional look.                                        |
| **Radius & Shadow** | `radius-default: 8px`; subtle shadows `0 2px 8px rgba(0, 0, 0, 0.4)`.              |
| **Transitions**     | Smooth transitions on specific properties: `color, transform, box-shadow 0.2s ease`. |

### Design Concept

A refined dark theme with indigo and violet accents, perfect for extended coding sessions. Clean, professional, and easy on the eyes.

### Color Palette & Special Effects

```scss
$twilight: (
  // Base colors
  background: #0f0f17,        // Deep twilight
  surface: #1a1a24,           // Dark surface
  surface-light: #252531,     // Elevated surface

  // Text hierarchy
  text: #e0e0e0,              // Light gray
  text-muted: #a0a0a0,        // Muted gray
  text-dim: #707070,          // Dimmed text

  // Accent colors
  primary: #6366f1,           // Indigo
  secondary: #8b5cf6,         // Violet
  accent: #D97706,            // Amber (darkened)

  // States
  error: #ef4444,             // Red
  success: #10b981,           // Emerald
  warning: #D97706,           // Amber

  // Special effects
  gradient-primary: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%),
  gradient-dark: linear-gradient(180deg, #1a1a24 0%, #0f0f17 100%),
  border-subtle: rgba(255, 255, 255, 0.1)
);
```

### Typography & Features

- Headers: System UI fonts for clean, professional look
- Body: System UI fonts with optimal readability
- Code: Native monospace fonts

### Special CSS Effects

```scss
.twilight-theme {
  // Subtle gradient backgrounds
  .card {
    background: var(--gradient-dark);
    border: 1px solid var(--border-subtle);
    backdrop-filter: saturate(180%) blur(20px);
  }

  // Smooth transitions (specific properties)
  * {
    transition: color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  }

  // Professional hover states
  button:hover {
    background: var(--gradient-primary);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }

  // Enhanced focus rings
  :focus {
    outline: 2px solid var(--primary);
    outline-offset: 1px;
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
  }

  // Light mode support
  &[data-mantine-color-scheme="light"] {
    background: #ffffff;
    color: #1a1a1a;

    .card {
      background: #f5f5f7;
      border-color: #d1d1d6;
    }
  }
}
```

### TNK Implementation

```scss
$twilight-theme: (
  name: 'twilight',

  colors: (
    background: #0f0f17,
    'background-surface': #1a1a24,
    'background-surface-light': #252531,
    text: #e0e0e0,
    'text-muted': #a0a0a0,
    'text-dim': #707070,
    primary: #6366f1,
    secondary: #8b5cf6,
    accent: #D97706,
    error: #ef4444,
    success: #10b981,
    warning: #D97706,
    border: #2d2d3d
  ),

  scales: (
    'indigo': primary,
    'violet': secondary,
    'amber': accent
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
    'color-success': var(--success),
    'primary-color': 'indigo',
    'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'font-family-headings': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'h1-font-size': '2.25rem',
    'h2-font-size': '1.875rem',
    'radius-default': '8px',
    'spacing-sm': '0.75rem',
    'spacing-md': '1rem',
    'spacing-lg': '1.5rem',
    'shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.4)',
    'shadow-md': '0 4px 16px rgba(0, 0, 0, 0.5)'
  ),

  colors-light: (
    background: #ffffff,
    'background-surface': #f5f5f7,
    'background-surface-light': #e8e8eb,
    text: #1a1a1a,
    'text-muted': #666666,
    'text-dim': #999999,
    border: #d1d1d6
  ),

  tnk-light: (
    'shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.08)',
    'shadow-md': '0 4px 16px rgba(0, 0, 0, 0.12)'
  )
);
```

## **"Neon"** - Cyberpunk High Contrast

### Overview

| Aspect              | Suggestions                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| **Mood**            | High-energy cyberpunk, true neon colors, electric atmosphere.                                    |
| **Primary color**   | `cyanNeon` – `#00ffff`.                                                                         |
| **Accent**          | Magenta neon `#ff00ff`, yellow neon `#ffff00` - one neon hue per interactive cluster.           |
| **Background**      | `#0a0a0a` near black (stays dark in light mode).                                                |
| **Typography**      | `Oxanium` headers (futuristic), `Space Grotesk` body (geometric).                               |
| **Radius & Shadow** | `radius-default: 4px`; neon glow shadows `0 0 12px rgba(0, 255, 255, 0.3)`.                     |
| **Effects**         | Text glow `0 0 10px currentColor` (soft blue on white headings), pulsing animations, glowing borders. Flat button style option. |

### Design Concept

A high-energy cyberpunk theme with true neon colors and glowing effects. Dark backgrounds make neon colors pop. Stays dark even in light mode.

### Color Palette & Special Effects

```scss
$neon: (
  // Base colors
  background: #0a0a0a,        // Near black
  surface: #1a1a1a,           // Dark gray
  surface-light: #252525,     // Lighter gray

  // Text hierarchy
  text: #ffffff,              // Pure white
  text-muted: #b0b0b0,        // Gray
  text-dim: #808080,          // Dimmed

  // Accent colors
  primary: #00ffff,           // Cyan neon
  secondary: #ff00ff,         // Magenta neon
  accent: #ffff00,            // Yellow neon

  // States
  error: #ff0066,             // Hot red
  success: #00ff88,           // Neon green
  warning: #ff8800,           // Orange

  // Special effects
  glow-cyan: 0 0 20px #00ffff,
  glow-magenta: 0 0 20px #ff00ff,
  glow-yellow: 0 0 20px #ffff00,
  text-glow: 0 0 10px currentColor,
  text-glow-blue: 0 0 10px #00b3ff
);
```

### Typography & Features

- Headers: "Oxanium" (futuristic, angular)
- Body: "Space Grotesk" (geometric, clean)
- Code: "Fira Code" with ligatures

### Special CSS Effects

```scss
.neon-theme {
  // Neon glow on all text
  h1, h2, h3 {
    text-shadow: var(--text-glow);

    // Soft blue glow on white headings
    &.light {
      text-shadow: var(--text-glow-blue);
    }
  }

  // Glowing borders
  .card {
    border: 1px solid var(--primary);
    box-shadow: var(--glow-cyan), inset var(--glow-cyan);
  }

  // Neon button effects
  button {
    background: transparent;
    border: 2px solid currentColor;
    color: var(--primary);
    text-shadow: var(--text-glow);
    box-shadow: inset 0 0 10px rgba(0, 255, 255, 0.3);

    &:hover {
      background: var(--primary);
      color: var(--background);
      box-shadow: var(--glow-cyan);
      text-shadow: none;
    }

    // Flat style for data tables
    &.flat {
      border: 1px solid var(--border);
      box-shadow: none;
      text-shadow: none;

      &:hover {
        background: var(--surface);
        box-shadow: none;
      }
    }
  }

  // Pulsing animation
  @keyframes neon-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }

  .primary {
    animation: neon-pulse 2s ease-in-out infinite;
  }
}
```

### TNK Implementation

```scss
$neon-theme: (
  name: 'neon',

  colors: (
    background: #0a0a0a,
    'background-surface': #1a1a1a,
    'background-surface-light': #252525,
    text: #ffffff,
    'text-muted': #b0b0b0,
    'text-dim': #808080,
    primary: #00ffff,
    secondary: #ff00ff,
    accent: #ffff00,
    error: #ff0066,
    success: #00ff88,
    warning: #ff8800,
    border: #333333
  ),

  scales: (
    'cyan': primary,
    'magenta': secondary,
    'yellow': accent
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
    'color-success': var(--success),
    'primary-color': 'cyan',
    'font-family': '"Space Grotesk", -apple-system, BlinkMacSystemFont, sans-serif',
    'font-family-headings': '"Oxanium", -apple-system, BlinkMacSystemFont, sans-serif',
    'h1-font-size': '2.5rem',
    'h2-font-size': '2rem',
    'radius-default': '4px',
    'spacing-sm': '0.75rem',
    'spacing-md': '1rem',
    'spacing-lg': '1.5rem',
    'shadow-sm': '0 0 12px rgba(0, 255, 255, 0.3)',
    'shadow-md': '0 0 24px rgba(0, 255, 255, 0.4)'
  ),

  colors-light: (
    background: #0a0a0a,
    'background-surface': #1a1a1a,
    'background-surface-light': #252525,
    text: #ffffff,
    'text-muted': #b0b0b0,
    'text-dim': #808080,
    border: #333333
  )
);
```

## **"Midnight"** - Ultra Dark OLED

### Overview

| Aspect              | Suggestions                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| **Mood**            | Ultra-dark OLED optimized, true blacks, high contrast, battery saving.                             |
| **Primary color**   | `brightBlue` – `#4a9eff`.                                                                         |
| **Accent**          | Soft purple `#a78bfa`, gold `#fbbf24`.                                                            |
| **Background**      | `#000000` true black for OLED efficiency (pure black variant option).                             |
| **Typography**      | System UI fonts with increased letter-spacing for clarity.                                         |
| **Radius & Shadow** | `radius-default: 12px`; deep shadows `0 2px 8px rgba(0, 0, 0, 0.8)`.                              |
| **Special**         | Minimal lit pixels, void gradient effects (optional), floating animations for depth. Border opacity raised to 8%. |

### Design Concept

An ultra-dark theme optimized for OLED displays with true blacks and high contrast. Designed to save battery on OLED screens while looking stunning.

### Color Palette & Special Effects

```scss
$midnight: (
  // Base colors
  background: #000000,        // True black (OLED)
  surface: #0a0a0a,           // Near black
  surface-light: #141414,     // Slightly lighter

  // Text hierarchy
  text: #E5E5E5,              // Softer white (reduced bloom)
  text-muted: #a8a8a8,        // Medium gray
  text-dim: #666666,          // Dark gray

  // Accent colors
  primary: #4a9eff,           // Bright blue
  secondary: #a78bfa,         // Soft purple
  accent: #fbbf24,            // Gold

  // States
  error: #f87171,             // Light red
  success: #00D499,           // Teal (color-blind safe)
  warning: #fbbf24,           // Gold

  // Special effects
  gradient-void: radial-gradient(circle at center, #141414 0%, #000000 100%),
  border-faint: rgba(255, 255, 255, 0.08),
  glow-subtle: 0 0 30px rgba(74, 158, 255, 0.2)
);
```

### Typography & Features

- Headers: System UI for clarity on OLED
- Body: System UI with increased letter-spacing
- Code: Native monospace fonts

### Special CSS Effects

```scss
.midnight-theme {
  // OLED optimization - minimize lit pixels
  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  // Void gradient effect (optional - user setting)
  &.gradient-mode body {
    background: var(--gradient-void);
  }

  // Pure black mode (default)
  &.pure-black body {
    background: #000000;
  }

  // Minimal borders for OLED
  .card {
    background: var(--surface);
    border: 1px solid var(--border-faint);

    &:hover {
      border-color: var(--primary);
      box-shadow: var(--glow-subtle);
    }
  }

  // High contrast focus states
  :focus {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }

  // Floating elements effect
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }

  .floating {
    animation: float 6s ease-in-out infinite;
  }
}
```

### TNK Implementation

```scss
$midnight-theme: (
  name: 'midnight',

  colors: (
    background: #000000,
    'background-surface': #0a0a0a,
    'background-surface-light': #141414,
    text: #E5E5E5,
    'text-muted': #a8a8a8,
    'text-dim': #666666,
    primary: #4a9eff,
    secondary: #a78bfa,
    accent: #fbbf24,
    error: #f87171,
    success: #00D499,
    warning: #fbbf24,
    border: #1f1f1f
  ),

  scales: (
    'blue': primary,
    'purple': secondary,
    'gold': accent
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
    'color-success': var(--success),
    'primary-color': 'blue',
    'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'font-family-headings': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'h1-font-size': '2.125rem',
    'h2-font-size': '1.75rem',
    'radius-default': '12px',
    'spacing-sm': '0.75rem',
    'spacing-md': '1rem',
    'spacing-lg': '1.5rem',
    'shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.8)',
    'shadow-md': '0 4px 16px rgba(0, 0, 0, 0.9)'
  )
);
```

## Theme Combinations

You can mix and match elements from different themes:

- Use Twilight's color scheme with Solarpunk's rounded corners
- Apply Neon's glow effects to Midnight's OLED blacks
- Combine Synthwave's retro fonts with Enchanted's organic shapes
- Combine Bioluminescent's glow effects with Vapor Dream's gradients
- Use Enchanted Grove's particle system with Bioluminescent's water animations
- Apply Vapor Dream's chrome text to Enchanted Grove for a "techno-druid" aesthetic

The TNK bridge system makes it easy to cherry-pick the best parts of each theme while maintaining consistency across your application.
