import { Button, MantineTheme, CSSProperties } from '@mantine/core';
import React from 'react';
import { createElement } from 'react';

/**
 * Unified debug utilities for styling and component development
 */

interface DebugConfig {
  showBoundaries?: boolean;
  showDataAttributes?: boolean;
  outlineColor?: string;
  backgroundColor?: string;
}

const defaultDebugConfig: DebugConfig = {
  showBoundaries: false,
  showDataAttributes: true,
  outlineColor: 'red',
  backgroundColor: 'rgba(255, 0, 0, 0.1)',
};

/**
 * Generate consistent class names for debugging
 */
export function getDebugClassName(component: string, variant?: string): string {
  return `tanaka-${component}${variant ? `--${variant}` : ''}`;
}

/**
 * Create a styled component with debug attributes
 */
export function createDebugComponent<P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
  displayName: string,
  styles: Record<string, unknown>,
  debugConfig: DebugConfig = defaultDebugConfig,
): React.ComponentType<P> {
  const StyledComponent = React.forwardRef<unknown, P>((props, ref) => {
    const debugProps = {
      ...props,
      ref,
      styles,
    } as P & { ref?: unknown; styles: Record<string, unknown> };

    if (debugConfig.showDataAttributes) {
      (debugProps as Record<string, unknown>)['data-styled-component'] = displayName;
      (debugProps as Record<string, unknown>)['data-debug'] = 'true';
    }

    return React.createElement(Component, debugProps as P);
  });

  StyledComponent.displayName = displayName;
  return StyledComponent as React.ComponentType<P>;
}

/**
 * Debug styles for visual development
 */
export const debugStyles = {
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
  boundaries: (config?: DebugConfig): CSSProperties => {
    const { outlineColor, backgroundColor } = { ...defaultDebugConfig, ...config };
    return {
      outline: `2px solid ${outlineColor}`,
      outlineOffset: '2px',
      backgroundColor,
    };
  },

  /**
   * Add debug grid overlay
   */
  grid: (size = 8): CSSProperties => ({
    backgroundImage: `
      repeating-linear-gradient(0deg, rgba(255, 0, 0, 0.1) 0px, transparent 1px, transparent ${size}px, rgba(255, 0, 0, 0.1) ${size + 1}px),
      repeating-linear-gradient(90deg, rgba(255, 0, 0, 0.1) 0px, transparent 1px, transparent ${size}px, rgba(255, 0, 0, 0.1) ${size + 1}px)
    `,
  }),

  /**
   * Show spacing visually
   */
  spacing: (padding?: number, margin?: number): CSSProperties => ({
    padding: padding ? `${padding}px` : undefined,
    margin: margin ? `${margin}px` : undefined,
    boxShadow: padding ? `inset 0 0 0 ${padding}px rgba(0, 255, 0, 0.2)` : undefined,
    outline: margin ? `${margin}px solid rgba(0, 0, 255, 0.2)` : undefined,
  }),
};

/**
 * Get theme-aware gradient for debugging
 */
export function getThemeAwareGradient(_theme: MantineTheme, colorScheme: 'light' | 'dark'): string {
  return colorScheme === 'dark'
    ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
    : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)';
}

/**
 * Example: Gradient Button component with debug features
 */
export const GradientButton = createDebugComponent(
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
      },
    },
  },
  { showDataAttributes: true },
);

/**
 * Debug utility wrapper for components
 */
export function withDebug<P extends object>(
  Component: React.ComponentType<P>,
  debugConfig?: DebugConfig,
): React.ComponentType<P & { debug?: boolean }> {
  const DebugWrapper = (props: P & { debug?: boolean }) => {
    const { debug, ...componentProps } = props;

    if (!debug) {
      return createElement(Component, componentProps as P);
    }

    const style = debugStyles.boundaries(debugConfig);

    return createElement(
      'div',
      {
        style,
        'data-debug-wrapper': Component.displayName || Component.name,
      },
      createElement(Component, componentProps as P),
    );
  };

  DebugWrapper.displayName = `withDebug(${Component.displayName || Component.name})`;
  return DebugWrapper;
}
