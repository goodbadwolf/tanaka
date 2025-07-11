import { SegmentedControl } from '@mantine/core';
import { useEffect, useState } from 'preact/hooks';
import './theme-style-switcher.scss';

const THEME_STYLES = [
  { value: 'twilight', label: 'Twilight' },
  { value: 'neon', label: 'Neon' },
  { value: 'midnight', label: 'Midnight' },
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
      localStorage.setItem('tnk-theme-style', value);
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
      className="tnk-theme-style-switcher"
    />
  );
}
