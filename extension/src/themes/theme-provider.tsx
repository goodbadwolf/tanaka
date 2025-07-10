import { MantineProvider } from '@mantine/core';
import type { ReactNode } from 'react';
import { useState } from 'react';
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
