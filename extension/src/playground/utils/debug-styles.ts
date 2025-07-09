import { Button, MantineTheme } from '@mantine/core';
import React from 'react';

interface DebugStyles {
  getClassName: (component: string, variant?: string) => string;
  createStyledComponent: <P extends Record<string, unknown>>(
    Component: React.ComponentType<P>,
    displayName: string,
    styles: Record<string, unknown>,
  ) => React.ComponentType<P>;
}

export const debugStyles: DebugStyles = {
  getClassName: (component: string, variant?: string) => {
    return `tanaka-${component}${variant ? `--${variant}` : ''}`;
  },

  createStyledComponent: <P extends Record<string, unknown>>(
    Component: React.ComponentType<P>,
    displayName: string,
    styles: Record<string, unknown>,
  ) => {
    const StyledComponent = React.forwardRef<unknown, P>((props, ref) => {
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

// Example: GradientButton with pink gradient (#FE6B8B → #FF8E53), 48px height
export const GradientButton = debugStyles.createStyledComponent(Button, 'GradientButton', {
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
});

// Theme-aware style helpers
export const getThemeAwareGradient = (_theme: MantineTheme, colorScheme: 'light' | 'dark') => {
  return colorScheme === 'dark'
    ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
    : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)';
};
