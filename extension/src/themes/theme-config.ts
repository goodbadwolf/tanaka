import { MantineColorScheme, MantineThemeOverride } from '@mantine/core';
import { v3Theme } from './v3/theme-config-v3';
import { cyberpunkTheme } from './cyberpunk/theme-config-cyberpunk';

export enum ThemeStyle {
  V3 = 'v3',
  CYBERPUNK = 'cyberpunk',
}

export const defaultThemeStyle = ThemeStyle.V3;
export const defaultThemeColorScheme: MantineColorScheme = 'light';

export interface ThemeSettings {
  style?: ThemeStyle;
  colorScheme?: MantineColorScheme;
}

export function getThemeConfig(style?: ThemeStyle): MantineThemeOverride {
  style = style ?? defaultThemeStyle;
  switch (style) {
    case ThemeStyle.CYBERPUNK:
      return cyberpunkTheme;
    case ThemeStyle.V3:
    default:
      return v3Theme;
  }
}

/**
 * A function that takes a MantineColorScheme and returns either 'light' or 'dark'
 * @param colorScheme - The MantineColorScheme to get the color scheme for
 * @returns The color scheme as a string
 */
export function collapseColorScheme(colorScheme?: MantineColorScheme): 'light' | 'dark' {
  if (!colorScheme) {
    return 'light';
  }
  switch (colorScheme) {
    case 'light':
      return 'light';
    case 'dark':
      return 'dark';
    default:
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
