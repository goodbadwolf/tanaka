import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { ComponentChildren } from 'preact';
import { getThemeConfig, ThemeStyle } from './theme-config';

interface ThemeProviderProps {
  children: ComponentChildren;
  themeStyle?: ThemeStyle;
}

export function ThemeProvider({ children, themeStyle = ThemeStyle.V3 }: ThemeProviderProps) {
  const selectedTheme = getThemeConfig(themeStyle);

  return (
    <MantineProvider
      theme={selectedTheme}
      defaultColorScheme="light"
    >
      {children}
    </MantineProvider>
  );
}
