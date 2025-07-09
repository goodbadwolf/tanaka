import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { ComponentChildren } from 'preact';
import { theme } from './theme';

interface ThemeProviderProps {
  children: ComponentChildren;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <MantineProvider
      theme={theme}
      defaultColorScheme="light"
    >
      {children}
    </MantineProvider>
  );
}
