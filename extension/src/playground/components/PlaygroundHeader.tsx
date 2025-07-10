import { Box, Group, Text, Title, useMantineColorScheme } from '@mantine/core';
import { IconPalette } from '@tabler/icons-preact';
import { ThemeToggle } from '../../components/theme-toggle';

export function PlaygroundHeader() {
  const { colorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';

  return (
    <Box
      component="header"
      style={{
        background: dark
          ? 'linear-gradient(135deg, #1a1b1e 0%, #2c2e33 100%)'
          : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        borderBottom: `1px solid ${dark ? '#373A40' : '#dee2e6'}`,
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
      py="md"
    >
      <Group justify="space-between" px="xl">
        <Group>
          <IconPalette size={32} style={{ color: 'var(--mantine-color-blue-6)' }} />
          <div>
            <Title order={3} style={{ lineHeight: 1.2 }}>
              Tanaka Design System
            </Title>
            <Text size="sm" c="dimmed">
              Component library & UI showcase
            </Text>
          </div>
        </Group>
        <ThemeToggle />
      </Group>
    </Box>
  );
}
