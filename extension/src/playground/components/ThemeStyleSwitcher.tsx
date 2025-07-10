import { SegmentedControl } from '@mantine/core';
import { useState, useEffect } from 'preact/hooks';

const THEME_STYLES = [
  { value: 'twilight', label: 'Twilight' },
  { value: 'neon', label: 'Neon (Test)' },
];

export function ThemeStyleSwitcher() {
  const [themeStyle, setThemeStyle] = useState('twilight');

  useEffect(() => {
    // Get initial theme from data attribute
    const currentTheme = document.documentElement.getAttribute('data-theme-style') || 'twilight';
    setThemeStyle(currentTheme);
  }, []);

  const handleThemeChange = (value: string) => {
    setThemeStyle(value);
    document.documentElement.setAttribute('data-theme-style', value);

    // Optionally save to localStorage
    try {
      localStorage.setItem('tanaka-theme-style', value);
    } catch (e) {
      console.error('Failed to save theme preference:', e);
    }
  };

  return (
    <SegmentedControl
      value={themeStyle}
      onChange={handleThemeChange}
      data={THEME_STYLES}
      size="sm"
      radius="md"
      fullWidth={false}
      styles={{
        root: {
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--card-border)',
        },
        indicator: {
          background: 'var(--twilight-gradient-primary)',
          boxShadow: 'var(--twilight-shadow-glow)',
        },
        label: {
          color: 'var(--color-text)',
          '&[data-active]': {
            color: 'var(--color-text)',
          },
        },
      }}
    />
  );
}
