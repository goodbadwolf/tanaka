import { useMantineColorScheme } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { ThemeColorScheme, ThemeStyle } from './theme-config';

const THEME_STYLE_STORAGE_KEY = 'tanaka-theme-style';
const COLOR_SCHEME_STORAGE_KEY = 'tanaka-theme-color-scheme';

export function useThemeStyle(
  defaultStyle?: ThemeStyle,
): [ThemeStyle, (style: ThemeStyle) => void] {
  const computedDefaultStyle = defaultStyle ?? ThemeStyle.TWILIGHT;

  const [storedStyle, setStoredStyle] = useLocalStorage<ThemeStyle>({
    key: THEME_STYLE_STORAGE_KEY,
    defaultValue: computedDefaultStyle,
  });

  return [storedStyle, setStoredStyle];
}

export function useThemeColorScheme(): {
  colorScheme: ThemeColorScheme;
  setColorScheme: (value: ThemeColorScheme) => void;
  clearColorScheme: () => void;
  toggleColorScheme: () => void;
} {
  const { colorScheme, setColorScheme, clearColorScheme, toggleColorScheme } =
    useMantineColorScheme();

  const [storedColorScheme, setStoredColorScheme, resetStoredColorScheme] =
    useLocalStorage<ThemeColorScheme>({
      key: COLOR_SCHEME_STORAGE_KEY,
      defaultValue: colorScheme,
    });

  const customSetColorScheme = (newColorScheme: ThemeColorScheme) => {
    setStoredColorScheme(newColorScheme);
    setColorScheme(newColorScheme);
  };

  const customClearColorScheme = () => {
    clearColorScheme();
    resetStoredColorScheme();
  };

  const customToggleColorScheme = () => {
    toggleColorScheme();
    const toggledColorScheme = colorScheme === 'light' ? 'dark' : 'light';
    setStoredColorScheme(toggledColorScheme);
  };

  return {
    colorScheme: storedColorScheme,
    setColorScheme: customSetColorScheme,
    clearColorScheme: customClearColorScheme,
    toggleColorScheme: customToggleColorScheme,
  };
}
