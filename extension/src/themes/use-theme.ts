import { useComputedColorScheme, useMantineColorScheme } from '@mantine/core';

export function useTheme() {
  const { setColorScheme, clearColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('dark');

  const toggleTheme = () => {
    setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light');
  };

  const setTheme = (theme: 'light' | 'dark' | 'auto') => {
    if (theme === 'auto') {
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
