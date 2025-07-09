import { Button, Box, Text, Paper, MantineTheme } from '@mantine/core';
import { useComputedColorScheme } from '@mantine/core';

export function StyledExample() {
  const colorScheme = useComputedColorScheme();

  return (
    <Box>
      {/* Using styles prop for a glowing card */}
      <Paper
        p="xl"
        mb="xl"
        radius="lg"
        withBorder
        style={{
          position: 'relative',
          overflow: 'hidden',
        }}
        styles={{
          root: {
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            },
          },
        }}
      >
        <Text size="lg" fw={600} mb="md">
          CSS-in-JS with Mantine v8
        </Text>
        <Text
          style={{
            color: 'var(--mantine-color-violet-6)',
            fontSize: 'var(--mantine-font-size-lg)',
          }}
        >
          This text uses CSS variables for theming
        </Text>
      </Paper>

      {/* Using style prop for gradient button */}
      <Button
        size="lg"
        mb="md"
        fullWidth
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

      {/* Using styles prop with theme */}
      <Button
        size="lg"
        mb="md"
        fullWidth
        variant="filled"
        color="violet"
        styles={(theme: MantineTheme) => ({
          root: {
            backgroundColor: theme.colors.violet[6],
            '&:hover': {
              backgroundColor: theme.colors.violet[7],
            },
          },
        })}
      >
        Themed Button (styles prop with theme)
      </Button>

      {/* Using styles prop for component-specific styling */}
      <Text
        mt="xl"
        styles={(theme: MantineTheme) => ({
          root: {
            color: theme.colors.gray[6],
            fontStyle: 'italic',
          },
        })}
      >
        Text styled with the styles prop and theme access
      </Text>

      {/* Example with dynamic styling based on color scheme */}
      <Paper
        p="md"
        mt="xl"
        withBorder
        styles={(theme: MantineTheme) => ({
          root: {
            backgroundColor: colorScheme === 'dark'
              ? theme.colors.dark[7]
              : theme.white,
            borderColor: colorScheme === 'dark'
              ? theme.colors.dark[4]
              : theme.colors.gray[2],
          },
        })}
      >
        <Text>This card adapts to the color scheme (currently: {colorScheme})</Text>
      </Paper>
    </Box>
  );
}
