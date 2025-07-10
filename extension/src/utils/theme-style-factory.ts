import { MantineTheme } from '@mantine/core';
import { ThemeStyle } from '../themes/theme-config';
import { gradients, shadows } from './styling-utils';

interface ThemeStyleConfig {
  gradients: {
    primary: string[];
    secondary: string[];
    accent: string[];
  };
  shadows: {
    glow: {
      color: string;
      opacity: number;
    };
    card: {
      layers: {
        x: number;
        y: number;
        blur: number;
        spread: number;
        color: string;
        inset?: boolean;
      }[];
    };
  };
}

const themeConfigs: Record<ThemeStyle, ThemeStyleConfig> = {
  [ThemeStyle.TWILIGHT]: {
    gradients: {
      primary: ['#6366f1', '#8b5cf6'],
      secondary: ['#818cf8', '#7c3aed'],
      accent: ['#8b5cf6', '#4f46e5'],
    },
    shadows: {
      glow: {
        color: 'rgba(99, 102, 241, 0.5)',
        opacity: 0.3,
      },
      card: {
        layers: [{ x: 0, y: 8, blur: 32, spread: 0, color: 'rgba(31, 38, 135, 0.37)' }],
      },
    },
  },
};

export function createThemeStyles(_theme: MantineTheme, style: ThemeStyle) {
  const config = themeConfigs[style];

  return {
    gradients: {
      primary: gradients.linear(45, ...config.gradients.primary),
      secondary: gradients.linear(135, ...config.gradients.secondary),
      accent: gradients.linear(90, ...config.gradients.accent),
    },
    shadows: {
      sm: shadows.glow(config.shadows.glow.color, 'sm'),
      md: shadows.glow(config.shadows.glow.color, 'md'),
      lg: shadows.glow(config.shadows.glow.color, 'lg'),
      card: shadows.layered(
        ...config.shadows.card.layers.map((layer) =>
          shadows.box(layer.x, layer.y, layer.blur, layer.spread, layer.color, layer.inset),
        ),
      ),
    },
  };
}
