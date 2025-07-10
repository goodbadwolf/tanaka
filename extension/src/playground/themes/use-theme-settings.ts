// A hook that returns the theme settings and a function to set them
// Theme settings are stored in the browser's local storage
import { useLocalStorage } from '@mantine/hooks';
import { defaultThemeColorScheme, defaultThemeStyle, ThemeSettings } from './theme-config';

const STORAGE_KEY = 'tanaka-theme-settings';

/**
 * Hook to persist theme settings in local storage.
 * @returns Tuple of [themeSettings, setThemeSettings]
 */
export function useThemeSettings(
  defaultSettings?: ThemeSettings,
): [ThemeSettings, (settings: ThemeSettings) => void] {
  const computedDefaultSettings = {
    style: defaultSettings?.style ?? defaultThemeStyle,
    colorScheme: defaultSettings?.colorScheme ?? defaultThemeColorScheme,
  };

  const [storedSettings, setStoredSettings] = useLocalStorage<ThemeSettings>({
    key: STORAGE_KEY,
    defaultValue: computedDefaultSettings,
  });

  return [storedSettings, setStoredSettings];
}
