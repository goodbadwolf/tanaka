import { NavLink, Stack, Text } from '@mantine/core';
import {
  IconBrandTabler,
  IconBrush,
  IconComponents,
  IconForms,
  IconLayout,
  IconPalette,
  IconRuler,
  IconSettings,
  IconTypography,
} from '@tabler/icons-preact';
import './playground-nav.scss';

interface PlaygroundNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: IconPalette },
  { id: 'colors', label: 'Colors', icon: IconBrush },
  { id: 'typography', label: 'Typography', icon: IconTypography },
  { id: 'spacing', label: 'Spacing & Layout', icon: IconRuler },
  { id: 'tanaka', label: 'Tanaka Components', icon: IconBrandTabler },
  { id: 'components', label: 'Mantine Components', icon: IconComponents },
  { id: 'forms', label: 'Form Elements', icon: IconForms },
  { id: 'layout', label: 'Layout System', icon: IconLayout },
  { id: 'patterns', label: 'Patterns', icon: IconSettings },
];

export function PlaygroundNav({ activeSection, onSectionChange }: PlaygroundNavProps) {
  return (
    <Stack gap={4}>
      <Text size="xs" fw={700} c="dimmed" tt="uppercase" px="md" py="xs">
        Design System
      </Text>
      {navItems.map((item) => (
        <NavLink
          key={item.id}
          label={item.label}
          leftSection={<item.icon size={18} />}
          active={activeSection === item.id}
          onClick={() => onSectionChange(item.id)}
          className="tnk-playground-nav__navlink"
        />
      ))}
    </Stack>
  );
}
