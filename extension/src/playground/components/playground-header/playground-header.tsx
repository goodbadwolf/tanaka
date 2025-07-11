import { Box, Group, Text, Title } from '@mantine/core';
import { IconPalette } from '@tabler/icons-preact';
import { ThemeToggle } from '../../../components/theme-toggle';
import { ThemeStyleSwitcher } from '../theme-style-switcher';
import './playground-header.scss';

export function PlaygroundHeader() {
  return (
    <Box component="header" className="tnk-playground-header" py="md">
      <Group justify="space-between" px="xl">
        <Group>
          <IconPalette size={32} className="tnk-playground-header__icon" />
          <div>
            <Title order={3} className="tnk-playground-header__title">
              Tanaka Design System
            </Title>
            <Text size="sm" c="dimmed">
              Component library & UI showcase
            </Text>
          </div>
        </Group>
        <Group gap="md">
          <ThemeStyleSwitcher />
          <ThemeToggle />
        </Group>
      </Group>
    </Box>
  );
}
