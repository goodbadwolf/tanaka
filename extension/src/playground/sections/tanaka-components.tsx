import { ActionIcon, Box, Button, Group } from '@mantine/core';
import {
  IconBell,
  IconComponents,
  IconHome,
  IconSearch,
  IconSettings,
  IconUser,
} from '@tabler/icons-preact';
import { AppHeader } from '../../components/app-header';
import { PlaygroundSection } from '../components/playground-section';
import './tanaka-components.scss';

const appHeaderExamples = [
  {
    id: 'app-header-basic',
    title: 'Basic Header',
    description: 'Simple header with just a title',
    component: () => <AppHeader title="Settings" />,
    code: `<AppHeader title="Settings" />`,
    showCode: true,
  },
  {
    id: 'app-header-with-back',
    title: 'Header with Back Button',
    description: 'Header with navigation back button',
    component: () => (
      <AppHeader title="Profile Settings" onBack={() => console.log('Back clicked')} />
    ),
    code: `<AppHeader
  title="Profile Settings"
  onBack={() => router.back()}
/>`,
  },
  {
    id: 'app-header-with-subtitle',
    title: 'Header with Subtitle',
    description: 'Header with additional descriptive text',
    component: () => (
      <AppHeader title="Account Settings" subtitle="Manage your profile and preferences" />
    ),
    code: `<AppHeader
  title="Account Settings"
  subtitle="Manage your profile and preferences"
/>`,
  },
  {
    id: 'app-header-with-icon',
    title: 'Header with Icon',
    description: 'Header with a visual icon',
    component: () => <AppHeader title="Dashboard" subtitle="Welcome back" icon={<IconHome />} />,
    code: `<AppHeader
  title="Dashboard"
  subtitle="Welcome back"
  icon={<IconHome />}
/>`,
  },
  {
    id: 'app-header-with-actions',
    title: 'Header with Actions',
    description: 'Header with action buttons on the right',
    component: () => (
      <AppHeader
        title="Messages"
        icon={<IconBell />}
        actions={
          <Group gap="xs">
            <ActionIcon variant="light" color="blue">
              <IconSearch size={18} />
            </ActionIcon>
            <ActionIcon variant="light" color="blue">
              <IconSettings size={18} />
            </ActionIcon>
          </Group>
        }
      />
    ),
    code: `<AppHeader
  title="Messages"
  icon={<IconBell />}
  actions={
    <Group gap="xs">
      <ActionIcon variant="light">
        <IconSearch size={18} />
      </ActionIcon>
      <ActionIcon variant="light">
        <IconSettings size={18} />
      </ActionIcon>
    </Group>
  }
/>`,
  },
  {
    id: 'app-header-compact',
    title: 'Compact Variant',
    description: 'Space-efficient header for constrained layouts',
    component: () => (
      <AppHeader
        variant="compact"
        title="Quick Settings"
        onBack={() => console.log('Back clicked')}
        actions={<Button size="xs">Save</Button>}
      />
    ),
    code: `<AppHeader
  variant="compact"
  title="Quick Settings"
  onBack={() => router.back()}
  actions={<Button size="xs">Save</Button>}
/>`,
  },
  {
    id: 'app-header-prominent',
    title: 'Prominent Variant',
    description: 'Eye-catching header with gradient background',
    component: () => (
      <AppHeader
        variant="prominent"
        title="Welcome to Tanaka"
        subtitle="Sync your tabs across all devices"
        icon={<IconUser />}
        actions={
          <Button variant="white" color="dark">
            Get Started
          </Button>
        }
      />
    ),
    code: `<AppHeader
  variant="prominent"
  title="Welcome to Tanaka"
  subtitle="Sync your tabs across all devices"
  icon={<IconUser />}
  actions={
    <Button variant="white" color="dark">
      Get Started
    </Button>
  }
/>`,
  },
  {
    id: 'app-header-full-featured',
    title: 'Full Featured',
    description: 'Header with all available features',
    component: () => (
      <AppHeader
        title="Advanced Settings"
        subtitle="Configure all aspects of your account"
        icon={<IconSettings />}
        onBack={() => console.log('Back clicked')}
        loading={false}
        withBorder={true}
        isMainHeader={true}
        aria-label="Advanced settings page header"
        actions={
          <Group gap="sm">
            <Button variant="light" size="sm">
              Reset
            </Button>
            <Button size="sm">Save Changes</Button>
          </Group>
        }
      />
    ),
    code: `<AppHeader
  title="Advanced Settings"
  subtitle="Configure all aspects of your account"
  icon={<IconSettings />}
  onBack={() => router.back()}
  loading={false}
  withBorder={true}
  isMainHeader={true}
  aria-label="Advanced settings page header"
  actions={
    <Group gap="sm">
      <Button variant="light" size="sm">Reset</Button>
      <Button size="sm">Save Changes</Button>
    </Group>
  }
/>`,
  },
];

const tanakaComponentsSection = {
  id: 'tanaka',
  title: 'Tanaka Components',
  description: 'Custom components built specifically for the Tanaka extension',
  icon: IconComponents,
  examples: appHeaderExamples,
};

export function TanakaComponentsSection() {
  return (
    <Box className="tnk-tanaka-components">
      <PlaygroundSection section={tanakaComponentsSection} />
    </Box>
  );
}
