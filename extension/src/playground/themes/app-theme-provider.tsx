import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { ComponentChildren } from 'preact';
import { createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import { getThemeConfig, ThemeSettings, collapseColorScheme } from './theme-config';
import { setWrappedDisplayName } from '../utils/hoc-utils';
import { useThemeSettings } from './use-theme-settings';


/** Props for {@link AppThemeProvider}. */
interface AppThemeProviderProps {
  children: ComponentChildren;
  defaultThemeSettings?: ThemeSettings;
}

/**
 * Theme provider that manages both theme style and color scheme.
 * Automatically applies CSS classes to document.body for SCSS theming.
 */
export function AppThemeProvider(props: AppThemeProviderProps) {
  const { children, defaultThemeSettings } = props;

  const [themeSettings, setThemeSettings] = useThemeSettings(defaultThemeSettings);
  const selectedTheme = useMemo(() => getThemeConfig(themeSettings.style), [themeSettings.style]);

  // Pre-compute the resolved color scheme
  const computedColorScheme = useMemo(() =>
    collapseColorScheme(themeSettings.colorScheme),
    [themeSettings.colorScheme]
  );

  // Memoize toggle function
  const toggleColorScheme = useCallback(() => {
    setThemeSettings({
      ...themeSettings,
      colorScheme: computedColorScheme === 'light' ? 'dark' : 'light'
    });
  }, [themeSettings, computedColorScheme, setThemeSettings]);

  // Apply CSS classes to body
  useEffect(() => {
    const classNames = [`theme-${themeSettings.style}`, `theme-${computedColorScheme}`];

    // Remove all theme classes first
    document.body.classList.forEach(className => {
      if (className.startsWith('theme-')) {
        document.body.classList.remove(className);
      }
    });

    // Add new theme classes
    document.body.classList.add(...classNames);

    // Cleanup on unmount
    return () => {
      document.body.classList.remove(...classNames);
    };
  }, [themeSettings.style, computedColorScheme]);

  // Memoize context value
  const contextValue = useMemo<ThemeContextValue>(() => ({
    currentThemeSettings: themeSettings,
    setThemeSettings,
    toggleColorScheme,
  }), [themeSettings, setThemeSettings, toggleColorScheme]);

  return (
    <MantineProvider theme={selectedTheme} defaultColorScheme={themeSettings.colorScheme}>
      <ThemeContext.Provider value={contextValue}>
        {children}
      </ThemeContext.Provider>
    </MantineProvider>
  );
}

/** Theme context value exposed by {@link useAppTheme} hook. */
export interface ThemeContextValue {
  currentThemeSettings: ThemeSettings;
  setThemeSettings: (settings: ThemeSettings) => void;
  /** Toggles between light and dark color schemes */
  toggleColorScheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Hook to access theme state and controls.
 * @throws Error if used outside of AppThemeProvider
 */
export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }
  return context;
}

/**
 * HOC that wraps a component with theme provider.
 * @example
 * // Basic usage
 * export const SettingsApp = withAppTheme(SettingsContent);
 *
 * // With default theme
 * export const PopupApp = withAppTheme(PopupContent, ThemeStyle.CYBERPUNK);
 */
export function withAppTheme<P extends object>(
  Component: React.ComponentType<P>,
  defaultThemeSettings?: ThemeSettings,
): React.ComponentType<P> {
  const ThemedComponent: React.FC<P> = (props: P) => (
    <AppThemeProvider defaultThemeSettings={defaultThemeSettings}>
      <Component {...props} />
    </AppThemeProvider>
  );

  return setWrappedDisplayName('withAppTheme', Component, ThemedComponent);
}
