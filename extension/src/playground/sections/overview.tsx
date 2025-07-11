import { Alert, Card, Code, Grid, List, Stack, Text, Title } from '@mantine/core';
import { IconBrandGithub, IconInfoCircle, IconRocket } from '@tabler/icons-preact';
import { ThemeTest } from '../components/theme-test';
import './overview.scss';

export function OverviewSection() {
  return (
    <Stack gap="xl">
      <div>
        <Title order={1} mb="md">
          Welcome to Tanaka Design System
        </Title>
        <Text size="lg" c="dimmed">
          A comprehensive design system and component library for the Tanaka browser extension.
          Built with React, TypeScript, and Mantine UI.
        </Text>
      </div>

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <IconRocket size={32} className="tanaka-overview__card-icon tanaka-overview__card-icon--primary" />
            <Text size="lg" fw={600} mb="xs">
              Getting Started
            </Text>
            <Text size="sm" c="dimmed">
              Explore our component library, design tokens, and patterns. Everything you need to build
              consistent UIs.
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <IconBrandGithub size={32} className="tanaka-overview__card-icon tanaka-overview__card-icon--secondary" />
            <Text size="lg" fw={600} mb="xs">
              Open Source
            </Text>
            <Text size="sm" c="dimmed">
              Tanaka is open source. Contribute to the design system and help improve the extension.
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <IconInfoCircle size={32} className="tanaka-overview__card-icon tanaka-overview__card-icon--success" />
            <Text size="lg" fw={600} mb="xs">
              Documentation
            </Text>
            <Text size="sm" c="dimmed">
              Comprehensive docs with examples, API references, and best practices for all components.
            </Text>
          </Card>
        </Grid.Col>
      </Grid>

      <Alert icon={<IconInfoCircle size={16} />} title="Design Principles" color="blue">
        <List spacing="xs" size="sm">
          <List.Item>
            <strong>Consistency</strong> - Unified design language across all components
          </List.Item>
          <List.Item>
            <strong>Accessibility</strong> - WCAG 2.1 AA compliant with keyboard navigation
          </List.Item>
          <List.Item>
            <strong>Performance</strong> - Optimized for extension environment constraints
          </List.Item>
          <List.Item>
            <strong>Flexibility</strong> - Themeable components that adapt to user preferences
          </List.Item>
        </List>
      </Alert>

      <div>
        <Title order={2} mb="md">
          Quick Start
        </Title>
        <Stack gap="md">
          <div>
            <Text fw={600} mb="xs">
              Import components directly:
            </Text>
            <Code block>{`import { Button } from '../components/button';
import { Toggle } from '../components/toggle';
import { AppHeader } from '../components/app-header';`}</Code>
          </div>

          <div>
            <Text fw={600} mb="xs">
              Use design tokens:
            </Text>
            <Code block>{`// SCSS variables
@use 'styles/variables' as *;

.my-component {
  padding: $base-spacing;
  border-radius: $border-radius-base;
  transition: $transition-base;
}`}</Code>
          </div>

          <div>
            <Text fw={600} mb="xs">
              Apply theme classes:
            </Text>
            <Code block>{`// Theme-specific styles
.theme-style-twilight & {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
}

// Additional themes will be added in future releases`}</Code>
          </div>
        </Stack>
      </div>

      <ThemeTest />
    </Stack>
  );
}
