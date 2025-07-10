import { MantineProvider } from '@mantine/core';
import type { ComponentType, ReactNode } from 'react';
import { useState } from 'react';
import { setWrappedDisplayName } from '../utils/hoc-utils';
import { collapseColorScheme, getThemeConfig, ThemeColorScheme, ThemeStyle } from './theme-config';

interface IThemeProviderProps {
  children: ReactNode;
  defaultStyle?: ThemeStyle;
  defaultColorScheme?: ThemeColorScheme;
}

export function ThemeProvider(props: IThemeProviderProps) {
  const { children, defaultStyle = ThemeStyle.TWILIGHT, defaultColorScheme = 'light' } = props;

  const [themeStyle] = useState<ThemeStyle>(defaultStyle);

  const theme = getThemeConfig(themeStyle);
  const computedColorScheme = collapseColorScheme(defaultColorScheme);

  return (
    <MantineProvider theme={theme} defaultColorScheme={computedColorScheme}>
      {children}
    </MantineProvider>
  );
}

export function withThemeProvider<T extends object>(Component: ComponentType<T>): ComponentType<T> {
  const WrappedComponent: ComponentType<T> = (props: T) => {
    return (
      <ThemeProvider>
        <Component {...props} />
      </ThemeProvider>
    );
  };

  return setWrappedDisplayName('withThemeProvider', Component, WrappedComponent);
}
