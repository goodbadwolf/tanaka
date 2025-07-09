import { useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { getToggledTheme, ThemeName } from './theme-config';

export function useTheme() {
  const defaultTheme = ThemeName.LIGHT;
  const { setColorScheme, clearColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme(defaultTheme);

  const toggleTheme = () => {
    setColorScheme(getToggledTheme(computedColorScheme as ThemeName));
  };

  const setTheme = (theme: ThemeName) => {
    if (theme === ThemeName.AUTO) {
      clearColorScheme();
    } else {
      setColorScheme(theme);
    }
  };

  return {
    theme: computedColorScheme,
    toggleTheme,
    setTheme,
  };
}
