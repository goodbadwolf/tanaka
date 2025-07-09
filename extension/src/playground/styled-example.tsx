import { Button, Box, Text, Paper, MantineTheme, Stack, Title, Group } from '@mantine/core';
import { useComputedColorScheme } from '@mantine/core';

export function StyledExample() {
  const colorScheme = useComputedColorScheme();

  return (
    <Stack gap="xl">
      {/* Section 1: Plain CSS Classes */}
      <Box>
        <Title order={2} mb="md" c="white">1. Plain CSS Classes</Title>

        <Paper className="glowing-card" p="xl" mb="md" data-component="glowing-card">
          <Text size="lg" fw={600} mb="md">
            Glass Morphism Card (CSS Class)
          </Text>
          <Text>
            This card uses the `.glowing-card` CSS class for glass morphism effect with backdrop blur.
          </Text>
        </Paper>

        <Button className="custom-button" size="lg" fullWidth mb="md">
          Custom Gradient Button (CSS Class)
        </Button>

        <Text className="gradient-text" size="xl" ta="center">
          Beautiful Gradient Text (CSS Class)
        </Text>
      </Box>

      {/* Section 2: Styles Prop (CSS-in-JS) */}
      <Box>
        <Title order={2} mb="md" c="white">2. Styles Prop (CSS-in-JS)</Title>

        <Paper
          p="xl"
          mb="md"
          radius="lg"
          withBorder
          style={{
            position: 'relative',
            overflow: 'hidden',
          }}
          styles={{
            root: {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              },
            },
          }}
        >
          <Text size="lg" fw={600} mb="md">
            Card with Top Gradient Border
          </Text>
          <Text>
            Uses the styles prop to add a gradient border and custom background.
          </Text>
        </Paper>

        <Button
          size="lg"
          fullWidth
          mb="md"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            border: 'none',
          }}
          styles={{
            root: {
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              },
              '&:active': {
                transform: 'translateY(0)',
              },
            },
          }}
        >
          Gradient Button (styles prop)
        </Button>
      </Box>

      {/* Section 3: Hybrid Approach (CSS + styles prop) */}
      <Box>
        <Title order={2} mb="md" c="white">3. Hybrid Approach (CSS + Styles Prop)</Title>

        <Paper
          className="glowing-card"
          p="xl"
          mb="md"
          data-component="hybrid-card"
          styles={{
            root: {
              '&:hover': {
                transform: 'scale(1.02)',
                transition: 'transform 0.2s ease'
              }
            }
          }}
        >
          <Text size="lg" fw={600} mb="md">
            Hybrid Styled Card
          </Text>
          <Text>
            Base styles from `.glowing-card` CSS class, hover effect from styles prop.
          </Text>
        </Paper>

        <Button
          variant="outline"
          size="lg"
          fullWidth
          mb="md"
          data-component="pink-outline-button"
          style={{
            borderColor: 'var(--mantine-color-pink-6)',
            color: 'var(--mantine-color-pink-6)'
          }}
          styles={{
            root: {
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'var(--mantine-color-pink-6)',
                color: 'white',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)'
              }
            }
          }}
        >
          Pink Outline Button (Hybrid)
        </Button>
      </Box>

      {/* Section 4: Theme-Aware Styling */}
      <Box>
        <Title order={2} mb="md" c="white">4. Theme-Aware Styling</Title>

        <Paper
          p="xl"
          mb="md"
          withBorder
          className={colorScheme === 'dark' ? 'theme-gradient-dark' : 'theme-gradient-light'}
          styles={(theme: MantineTheme) => ({
            root: {
              borderColor: colorScheme === 'dark'
                ? theme.colors.dark[4]
                : theme.colors.gray[2],
              color: colorScheme === 'dark' ? theme.white : theme.black,
            },
          })}
        >
          <Text size="lg" fw={600} mb="md">
            Theme-Aware Card
          </Text>
          <Text>
            This card adapts to the color scheme using both CSS classes and styles prop.
            Current theme: {colorScheme}
          </Text>
        </Paper>

        <Group grow>
          <Button
            size="lg"
            variant="filled"
            color="indigo"
            styles={(theme: MantineTheme) => ({
              root: {
                backgroundColor: theme.colors.indigo[5],
                '&:hover': {
                  backgroundColor: theme.colors.indigo[6],
                },
              },
            })}
          >
            Primary Color Button
          </Button>

          <Button
            size="lg"
            variant="filled"
            color="violet"
            styles={(theme: MantineTheme) => ({
              root: {
                backgroundColor: theme.colors.violet[5],
                '&:hover': {
                  backgroundColor: theme.colors.violet[6],
                },
              },
            })}
          >
            Secondary Color Button
          </Button>
        </Group>
      </Box>

      {/* Section 5: CSS Variables */}
      <Box>
        <Title order={2} mb="md" c="white">5. CSS Variables</Title>

        <Text
          size="lg"
          mb="md"
          style={{
            color: 'var(--mantine-color-violet-6)',
            fontSize: 'var(--mantine-font-size-lg)',
            padding: 'var(--mantine-spacing-md)',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 'var(--mantine-radius-md)',
          }}
        >
          This text uses Mantine CSS variables for consistent theming
        </Text>
      </Box>
    </Stack>
  );
}
