import { useMantineColorScheme } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { ThemeStyle } from './theme-config';

const THEME_STYLE_STORAGE_KEY = 'tnk-theme-style';

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

export const useThemeColorScheme = useMantineColorScheme;
