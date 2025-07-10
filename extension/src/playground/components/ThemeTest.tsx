import { Box, Text, Paper, Stack } from '@mantine/core';

export function ThemeTest() {
  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="sm">
        <Text size="lg" fw={700}>Theme Test</Text>

        <Box>
          <Text size="sm" c="dimmed">CSS Variables:</Text>
          <Text size="xs" style={{ fontFamily: 'monospace' }}>
            --color-background: <span style={{ color: 'var(--color-background)' }}>var(--color-background)</span>
          </Text>
          <Text size="xs" style={{ fontFamily: 'monospace' }}>
            --color-primary: <span style={{ color: 'var(--color-primary)' }}>var(--color-primary)</span>
          </Text>
          <Text size="xs" style={{ fontFamily: 'monospace' }}>
            --color-secondary: <span style={{ color: 'var(--color-secondary)' }}>var(--color-secondary)</span>
          </Text>
        </Box>

        <Box
          p="xs"
          style={{
            background: 'var(--color-surface)',
            border: '2px solid var(--color-primary)',
            borderRadius: '4px'
          }}
        >
          <Text size="sm">Surface Color Test</Text>
        </Box>

        <Box
          p="xs"
          style={{
            background: 'var(--twilight-gradient-primary)',
            borderRadius: '4px'
          }}
        >
          <Text size="sm">Gradient Test</Text>
        </Box>
      </Stack>
    </Paper>
  );
}
