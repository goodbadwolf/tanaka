import { Box, Button, Paper, Text, Stack, Group, Title } from '@mantine/core';
import { useMantineTheme } from '@mantine/core';
import { useState } from 'react';
import { ThemeStyle } from '../themes/theme-config';
import { stylingUtils } from './utils/styling-utils';

const { cn, gradients, shadows, animations, responsive, colors, compose, debug } = stylingUtils;

interface StylingUtilsExampleProps {
  themeStyle: ThemeStyle;
}

export function StylingUtilsExample({ themeStyle }: StylingUtilsExampleProps) {
  const theme = useMantineTheme();
  const [isActive, setIsActive] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Get theme-specific gradients and shadows
  const themedGradients = gradients.themed(theme, themeStyle);
  const themedShadows = shadows.themed(theme, themeStyle);

  return (
    <Stack gap="xl">
      <Title order={2} c="white">Styling Utilities Demo</Title>

      {/* Class Name Utilities */}
      <Paper
        className={cn.combine(
          cn.component('demo-card', 'primary'),
          isActive && cn.component('demo-card', 'primary', 'active'),
          'custom-class'
        )}
        p="xl"
        style={{
          background: themedGradients.primary,
          boxShadow: themedShadows.md,
          transition: animations.transition(['transform', 'box-shadow']),
          ...(showDebug ? debug.boundaries() : {}),
        }}
        styles={{
          root: {
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: themedShadows.lg,
            },
          },
        }}
      >
        <Text size="lg" fw={600} c="white" mb="md">
          Class Name Utilities
        </Text>
        <Text c="white">
          Generated class: {cn.component('demo-card', 'primary', isActive ? 'active' : undefined)}
        </Text>
        <Button
          onClick={() => setIsActive(!isActive)}
          variant="white"
          mt="md"
          styles={{
            root: {
              transition: animations.transition(['all']),
            },
          }}
        >
          Toggle Active State
        </Button>
      </Paper>

      {/* Gradient Utilities */}
      <Group grow>
        <Paper
          p="xl"
          style={{
            background: themedGradients.secondary,
            ...(animations.presets.fadeIn || {}),
          }}
        >
          <Text size="lg" fw={600} c="white">
            Secondary Gradient
          </Text>
        </Paper>
        <Paper
          p="xl"
          style={{
            background: gradients.radial('circle',
              colors.hexToRgba('#ff0f87', 0.5),
              'transparent'
            ),
            backgroundColor: '#1a0a1f',
          }}
        >
          <Text size="lg" fw={600} c="white">
            Radial Gradient
          </Text>
        </Paper>
      </Group>

      {/* Shadow Utilities */}
      <Group grow>
        <Paper
          p="xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            boxShadow: shadows.glow(
              themeStyle === ThemeStyle.CYBERPUNK ? '#ff0f87' : '#6366f1',
              'lg'
            ),
          }}
        >
          <Text size="lg" fw={600} c="white">
            Glow Effect
          </Text>
        </Paper>
        <Paper
          p="xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            boxShadow: shadows.layered(
              shadows.box(0, 4, 20, -5, 'rgba(0, 0, 0, 0.3)'),
              shadows.box(0, 10, 40, -10, 'rgba(0, 0, 0, 0.2)'),
              'inset 0 0 20px rgba(255, 255, 255, 0.1)'
            ),
          }}
        >
          <Text size="lg" fw={600} c="white">
            Layered Shadow
          </Text>
        </Paper>
      </Group>

      {/* Responsive Utilities */}
      <Paper
        p="xl"
        style={{
          background: themedGradients.accent,
          minHeight: '100px',
        }}
        styles={responsive.hide('md', 'down')}
      >
        <Text size="lg" fw={600} c="white">
          Hidden on Mobile (md and below)
        </Text>
      </Paper>

      {/* Variant Styles */}
      <Group>
        {(['primary', 'secondary', 'accent'] as const).map((variant) => {
          const variantStyles = compose.variants(
            {
              padding: '1rem 2rem',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: animations.transition(['all']),
            },
            {
              primary: { background: themedGradients.primary },
              secondary: { background: themedGradients.secondary },
              accent: { background: themedGradients.accent },
            }
          );

          return (
            <Box
              key={variant}
              component="button"
              style={variantStyles[variant]}
              onClick={() => console.log(`Clicked ${variant}`)}
            >
              <Text c="white">{variant.charAt(0).toUpperCase() + variant.slice(1)} Variant</Text>
            </Box>
          );
        })}
      </Group>

      {/* Debug Utilities */}
      <Paper p="xl" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
        <Group>
          <Button
            onClick={() => setShowDebug(!showDebug)}
            variant="outline"
            color={themeStyle === ThemeStyle.CYBERPUNK ? 'neonPink' : 'indigo'}
          >
            {showDebug ? 'Hide' : 'Show'} Debug Boundaries
          </Button>
          <Text c="white">
            Use debug utilities to visualize element boundaries during development
          </Text>
        </Group>
      </Paper>

      {/* Animation Presets */}
      <Group grow>
        <Paper
          p="xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            ...(animations.presets.pulse || {}),
          }}
        >
          <Text size="lg" fw={600} c="white">
            Pulse Animation
          </Text>
        </Paper>
        <Paper
          p="xl"
          className="hover-slide"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            position: 'relative',
            overflow: 'hidden',
          }}
          styles={{
            root: {
              '&:hover .slide-content': {
                transform: 'translateY(0)',
              },
            },
          }}
        >
          <Text size="lg" fw={600} c="white">
            Hover to Slide Up
          </Text>
          <Box
            className="slide-content"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: themedGradients.primary,
              padding: '1rem',
              transform: 'translateY(100%)',
              transition: animations.transition(['transform'], '0.5s'),
            }}
          >
            <Text c="white">Hidden content revealed!</Text>
          </Box>
        </Paper>
      </Group>

      {/* Color Utilities */}
      <Group grow>
        <Paper
          p="xl"
          style={{
            background: colors.lighten(
              themeStyle === ThemeStyle.CYBERPUNK ? '#ff0f87' : '#6366f1',
              20
            ),
          }}
        >
          <Text size="lg" fw={600} c="white">
            Lightened Color
          </Text>
        </Paper>
        <Paper
          p="xl"
          style={{
            background: colors.darken(
              themeStyle === ThemeStyle.CYBERPUNK ? '#ff0f87' : '#6366f1',
              20
            ),
          }}
        >
          <Text size="lg" fw={600} c="white">
            Darkened Color
          </Text>
        </Paper>
      </Group>
    </Stack>
  );
}
