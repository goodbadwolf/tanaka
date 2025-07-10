import { MantineTheme, CSSProperties } from '@mantine/core';
import { ThemeStyle } from '../../themes/theme-config';

/**
 * Utility functions for creating reusable styling patterns
 */

// Class name generators
export const cn = {
  /**
   * Generate BEM-style class names
   */
  bem: (block: string, element?: string, modifier?: string): string => {
    let className = block;
    if (element) className += `__${element}`;
    if (modifier) className += `--${modifier}`;
    return className;
  },

  /**
   * Generate component class names with optional variants
   */
  component: (name: string, variant?: string, state?: string): string => {
    let className = `tanaka-${name}`;
    if (variant) className += `-${variant}`;
    if (state) className += ` is-${state}`;
    return className;
  },

  /**
   * Combine multiple class names, filtering out falsy values
   */
  combine: (...classes: (string | undefined | null | false)[]): string => {
    return classes.filter(Boolean).join(' ');
  },
};

// Gradient generators
export const gradients = {
  /**
   * Create a linear gradient CSS string
   */
  linear: (angle: number, ...colors: string[]): string => {
    return `linear-gradient(${angle}deg, ${colors.join(', ')})`;
  },

  /**
   * Create a radial gradient CSS string
   */
  radial: (shape: 'circle' | 'ellipse', ...colors: string[]): string => {
    return `radial-gradient(${shape}, ${colors.join(', ')})`;
  },

  /**
   * Get theme-specific gradients
   * @deprecated Use createThemeStyles from theme-style-factory instead
   */
  themed: (theme: MantineTheme, style: ThemeStyle): Record<string, string> => {
    // Dynamic import to avoid circular dependencies
    const { createThemeStyles } =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('./theme-style-factory') as typeof import('./theme-style-factory');
    const { gradients } = createThemeStyles(theme, style);
    return gradients;
  },
};

// Shadow generators
export const shadows = {
  /**
   * Create a box shadow with optional inset
   */
  box: (
    x: number,
    y: number,
    blur: number,
    spread: number,
    color: string,
    inset = false,
  ): string => {
    const insetStr = inset ? 'inset ' : '';
    return `${insetStr}${x}px ${y}px ${blur}px ${spread}px ${color}`;
  },

  /**
   * Create a glow effect (neon-style shadow)
   */
  glow: (color: string, intensity: 'sm' | 'md' | 'lg' = 'md'): string => {
    const sizes = {
      sm: [10, 20],
      md: [20, 40],
      lg: [30, 60],
    };
    const [inner, outer] = sizes[intensity];
    return `0 0 ${inner}px ${color}, 0 0 ${outer}px ${color}`;
  },

  /**
   * Create a multi-layer shadow for depth
   */
  layered: (...shadows: string[]): string => {
    return shadows.join(', ');
  },

  /**
   * Get theme-specific shadows
   * @deprecated Use createThemeStyles from theme-style-factory instead
   */
  themed: (theme: MantineTheme, style: ThemeStyle): Record<string, string> => {
    // Dynamic import to avoid circular dependencies
    const { createThemeStyles } =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('./theme-style-factory') as typeof import('./theme-style-factory');
    const { shadows } = createThemeStyles(theme, style);
    return shadows;
  },
};

// Animation helpers
export const animations = {
  /**
   * Create a transition string
   */
  transition: (properties: string[], duration = '0.3s', easing = 'ease'): string => {
    return properties.map((prop) => `${prop} ${duration} ${easing}`).join(', ');
  },

  /**
   * Create keyframe animation styles
   */
  keyframes: (name: string, frames: Record<string, CSSProperties>): string => {
    const keyframeRules = Object.entries(frames)
      .map(([key, styles]) => {
        const styleString = Object.entries(styles)
          .map(([prop, value]) => `${prop}: ${value};`)
          .join(' ');
        return `${key} { ${styleString} }`;
      })
      .join(' ');
    return `@keyframes ${name} { ${keyframeRules} }`;
  },

  /**
   * Common animation presets
   */
  presets: {
    fadeIn: { opacity: 0, animation: 'fadeIn 0.3s ease forwards' },
    slideUp: { transform: 'translateY(20px)', animation: 'slideUp 0.3s ease forwards' },
    pulse: { animation: 'pulse 2s infinite' },
    rotate: { animation: 'rotate 2s linear infinite' },
  },
};

// Responsive helpers
export const responsive = {
  /**
   * Create a media query
   */
  media: (
    breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl',
    styles: CSSProperties,
  ): Record<string, CSSProperties> => {
    const breakpoints = {
      xs: '576px',
      sm: '768px',
      md: '992px',
      lg: '1200px',
      xl: '1400px',
    };
    return {
      [`@media (min-width: ${breakpoints[breakpoint]})`]: styles,
    };
  },

  /**
   * Hide element on certain breakpoints
   */
  hide: (
    breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl',
    type: 'up' | 'down' = 'up',
  ): Record<string, CSSProperties> => {
    const breakpoints = {
      xs: '576px',
      sm: '768px',
      md: '992px',
      lg: '1200px',
      xl: '1400px',
    };
    const query = type === 'up' ? 'min-width' : 'max-width';
    return {
      [`@media (${query}: ${breakpoints[breakpoint]})`]: {
        display: 'none',
      },
    };
  },
};

// Color utilities
export const colors = {
  /**
   * Convert hex to rgba
   */
  hexToRgba: (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },

  /**
   * Lighten a color
   */
  lighten: (color: string, amount: number): string => {
    // Simple implementation - in production, use a proper color library
    return `color-mix(in srgb, ${color}, white ${amount}%)`;
  },

  /**
   * Darken a color
   */
  darken: (color: string, amount: number): string => {
    return `color-mix(in srgb, ${color}, black ${amount}%)`;
  },
};

// Style composition helpers
export const compose = {
  /**
   * Merge multiple style objects
   */
  styles: (...styles: (CSSProperties | undefined)[]): CSSProperties => {
    return Object.assign({}, ...styles.filter(Boolean)) as CSSProperties;
  },

  /**
   * Create variant styles
   */
  variants: <T extends string>(
    base: CSSProperties,
    variants: Record<T, CSSProperties>,
  ): Record<T, CSSProperties> => {
    return Object.entries(variants).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: compose.styles(base, value as CSSProperties),
      }),
      {} as Record<T, CSSProperties>,
    );
  },
};

// Debug utilities
export const debug = {
  /**
   * Add debug outline to element
   */
  outline: (color = 'red'): CSSProperties => ({
    outline: `2px solid ${color}`,
    outlineOffset: '2px',
  }),

  /**
   * Add debug background
   */
  background: (color = 'rgba(255, 0, 0, 0.1)'): CSSProperties => ({
    backgroundColor: color,
  }),

  /**
   * Show element boundaries
   */
  boundaries: (): CSSProperties => ({
    ...debug.outline('red'),
    ...debug.background('rgba(255, 0, 0, 0.05)'),
  }),
};

// Export all utilities as a single object for convenient importing
export const stylingUtils = {
  cn,
  gradients,
  shadows,
  animations,
  responsive,
  colors,
  compose,
  debug,
};
