import { MantineColorScheme, MantineThemeOverride } from '@mantine/core';
import { twilightTheme } from './twilight';

export enum ThemeStyle {
  TWILIGHT = 'twilight',
}

export type ThemeColorScheme = MantineColorScheme;

export const defaultThemeStyle = ThemeStyle.TWILIGHT;
export const defaultThemeColorScheme: ThemeColorScheme = 'light';

export interface ThemeSettings {
  style?: ThemeStyle;
  colorScheme?: ThemeColorScheme;
}

export function getThemeConfig(style?: ThemeStyle): MantineThemeOverride {
  if (style === ThemeStyle.TWILIGHT) {
    return twilightTheme;
  }
  throw new Error(`Unknown theme style: ${style}`);
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
