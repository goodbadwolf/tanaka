import { Box, Card, Code, Grid, Group, Stack, Text, Title, useMantineTheme } from '@mantine/core';
import './colors.scss';

interface ColorCardProps {
  name: string;
  color: string;
  description?: string;
}

function ColorCard({ name, color, description }: ColorCardProps) {
  const textColor = isColorLight(color) ? '#000' : '#fff';

  return (
    <Card shadow="sm" radius="md" withBorder>
      <Box
        className="tnk-colors__swatch"
        style={{
          backgroundColor: color,
        }}
      >
        <Text size="xs" c={textColor} fw={500}>
          {color}
        </Text>
      </Box>
      <Text fw={600} size="sm">
        {name}
      </Text>
      {description && (
        <Text size="xs" c="dimmed">
          {description}
        </Text>
      )}
    </Card>
  );
}

function isColorLight(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

export function ColorsSection() {
  const theme = useMantineTheme();

  const brandColors = {
    primary: '#6366f1',
    'primary-light': '#818cf8',
    'primary-dark': '#4f46e5',
    secondary: '#8b5cf6',
    'secondary-light': '#a78bfa',
    'secondary-dark': '#7c3aed',
  };

  const semanticColors = {
    success: theme.colors.green[6],
    warning: theme.colors.yellow[6],
    error: theme.colors.red[6],
    info: theme.colors.blue[6],
  };

  const neutralColors = {
    'gray-50': theme.colors.gray[0],
    'gray-100': theme.colors.gray[1],
    'gray-200': theme.colors.gray[2],
    'gray-300': theme.colors.gray[3],
    'gray-400': theme.colors.gray[4],
    'gray-500': theme.colors.gray[5],
    'gray-600': theme.colors.gray[6],
    'gray-700': theme.colors.gray[7],
    'gray-800': theme.colors.gray[8],
    'gray-900': theme.colors.gray[9],
  };

  const accentColors = {
    accent: '#a78bfa',
    'accent-light': '#c4b5fd',
    'accent-dark': '#7c3aed',
    highlight: '#ddd6fe',
    muted: 'rgba(255, 255, 255, 0.7)',
    'surface-light': '#1f1f23',
  };

  return (
    <Stack gap="xl">
      <div>
        <Title order={1} mb="md">
          Color System
        </Title>
        <Text size="lg" c="dimmed">
          A carefully crafted color palette that works across light and dark themes.
        </Text>
      </div>

      <div>
        <Title order={2} mb="md">
          Brand Colors
        </Title>
        <Grid>
          {Object.entries(brandColors).map(([name, color]) => (
            <Grid.Col key={name} span={{ base: 6, sm: 4, md: 3, lg: 2 }}>
              <ColorCard
                name={name}
                color={color}
                description={name.includes('primary') ? 'Primary brand' : 'Secondary brand'}
              />
            </Grid.Col>
          ))}
        </Grid>
      </div>

      <div>
        <Title order={2} mb="md">
          Semantic Colors
        </Title>
        <Grid>
          {Object.entries(semanticColors).map(([name, color]) => (
            <Grid.Col key={name} span={{ base: 6, sm: 4, md: 3 }}>
              <ColorCard name={name} color={color} description={`Used for ${name} states`} />
            </Grid.Col>
          ))}
        </Grid>
      </div>

      <div>
        <Title order={2} mb="md">
          Neutral Palette
        </Title>
        <Grid>
          {Object.entries(neutralColors).map(([name, color]) => (
            <Grid.Col key={name} span={{ base: 6, sm: 4, md: 3, lg: 2 }}>
              <ColorCard name={name} color={color} />
            </Grid.Col>
          ))}
        </Grid>
      </div>

      <div>
        <Title order={2} mb="md">
          Accent Colors
        </Title>
        <Grid>
          {Object.entries(accentColors).map(([name, color]) => (
            <Grid.Col key={name} span={{ base: 6, sm: 4, md: 3 }}>
              <ColorCard name={name} color={color} description="Twilight theme accents" />
            </Grid.Col>
          ))}
        </Grid>
      </div>

      <div>
        <Title order={3} mb="md">
          Usage Examples
        </Title>
        <Stack gap="md">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Text fw={600} mb="xs">
              CSS Variables
            </Text>
            <Code block>{`/* Available as CSS variables */
:root {
  --color-primary: #6366f1;
  --color-primary-light: #818cf8;
  --color-primary-dark: #4f46e5;
  --color-secondary: #8b5cf6;
  /* ... etc */
}`}</Code>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Text fw={600} mb="xs">
              SCSS Variables
            </Text>
            <Code block>{`// Import and use in SCSS
@use 'styles/colors' as *;

.button-primary {
  background: $color-primary;

  &:hover {
    background: $color-primary-dark;
  }
}`}</Code>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Text fw={600} mb="xs">
              Gradients
            </Text>
            <Group>
              <Box className="tnk-colors__gradient-demo tnk-colors__gradient-demo--primary" />
              <Box className="tnk-colors__gradient-demo tnk-colors__gradient-demo--vibrant" />
              <Box className="tnk-colors__gradient-demo tnk-colors__gradient-demo--purple" />
            </Group>
          </Card>
        </Stack>
      </div>
    </Stack>
  );
}
