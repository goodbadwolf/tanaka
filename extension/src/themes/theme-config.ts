import { MantineThemeOverride } from '@mantine/core';
import { v3Theme } from './v3/theme-config-v3';
import { cyberpunkTheme } from './cyberpunk/theme-config-cyberpunk';

export enum ThemeName {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
}

export enum ThemeStyle {
  V3 = 'v3',
  CYBERPUNK = 'cyberpunk',
}

export function getToggledTheme(theme: ThemeName | undefined): ThemeName {
  if (!theme) {
    return ThemeName.LIGHT;
  }

  return theme === ThemeName.LIGHT ? ThemeName.DARK : ThemeName.LIGHT;
}

export function getThemeConfig(style: ThemeStyle = ThemeStyle.V3): MantineThemeOverride {
  switch (style) {
    case ThemeStyle.CYBERPUNK:
      return cyberpunkTheme;
    case ThemeStyle.V3:
    default:
      return v3Theme;
  }
}

// Default theme export for backwards compatibility
export const theme = v3Theme;
