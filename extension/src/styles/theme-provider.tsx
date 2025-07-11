import { MantineProvider } from '@mantine/core';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

export function withThemeProvider<T extends object>(Component: React.ComponentType<T>) {
  return (props: T) => (
    <ThemeProvider>
      <Component {...props} />
    </ThemeProvider>
  );
}
