import { Box, Text, Paper, Stack } from '@mantine/core';
import './theme-test.scss';

export function ThemeTest() {
  // Helper to render variable with its own color
  const renderVariable = (varName: string) => (
    <Text className="tanaka-theme-test__variable">
      {varName}: <span style={{ color: `var(${varName})` }}>var({varName})</span>
    </Text>
  );

  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="sm">
        <Text size="lg" fw={700}>Theme Test</Text>

        <Box>
          <Text size="sm" c="dimmed">CSS Variables:</Text>
          {renderVariable('--color-background')}
          {renderVariable('--color-primary')}
          {renderVariable('--color-secondary')}
        </Box>

        <Box className="tanaka-theme-test__surface-box">
          <Text size="sm">Surface Color Test</Text>
        </Box>

        <Box className="tanaka-theme-test__gradient-box">
          <Text size="sm">Gradient Test</Text>
        </Box>
      </Stack>
    </Paper>
  );
}
