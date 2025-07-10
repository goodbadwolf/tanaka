import { Box, Card, Code, Grid, Group, Stack, Text, Title } from '@mantine/core';

const spacingScale = [
  { name: 'xs', value: '4px', multiplier: 0.5 },
  { name: 'sm', value: '8px', multiplier: 1 },
  { name: 'md', value: '16px', multiplier: 2 },
  { name: 'lg', value: '24px', multiplier: 3 },
  { name: 'xl', value: '32px', multiplier: 4 },
  { name: 'xxl', value: '48px', multiplier: 6 },
];

const borderRadii = [
  { name: 'none', value: '0' },
  { name: 'sm', value: '4px' },
  { name: 'md', value: '8px' },
  { name: 'lg', value: '16px' },
  { name: 'xl', value: '32px' },
  { name: 'full', value: '9999px' },
];

export function SpacingSection() {
  return (
    <Stack gap="xl">
      <div>
        <Title order={1} mb="md">
          Spacing & Layout
        </Title>
        <Text size="lg" c="dimmed">
          Consistent spacing creates visual rhythm and improves usability.
        </Text>
      </div>

      <div>
        <Title order={2} mb="md">
          Spacing Scale
        </Title>
        <Text mb="lg">
          Based on an 8px unit system for consistent alignment and spacing.
        </Text>
        <Stack gap="md">
          {spacingScale.map((space) => (
            <Card key={space.name} shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" align="center">
                <Group>
                  <Box
                    style={{
                      width: 60,
                      height: 60,
                      backgroundColor: 'var(--mantine-color-blue-light)',
                      border: '2px solid var(--mantine-color-blue-6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Box
                      style={{
                        width: space.value,
                        height: space.value,
                        backgroundColor: 'var(--mantine-color-blue-6)',
                      }}
                    />
                  </Box>
                  <div>
                    <Text fw={600}>{space.name}</Text>
                    <Text size="sm" c="dimmed">
                      {space.value} ({space.multiplier}× base unit)
                    </Text>
                  </div>
                </Group>
                <Code>{`spacing("${space.name}")`}</Code>
              </Group>
            </Card>
          ))}
        </Stack>
      </div>

      <div>
        <Title order={2} mb="md">
          Border Radius
        </Title>
        <Grid>
          {borderRadii.map((radius) => (
            <Grid.Col key={radius.name} span={{ base: 6, sm: 4, md: 3 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Box
                  style={{
                    width: '100%',
                    height: 80,
                    backgroundColor: 'var(--mantine-color-blue-light)',
                    border: '2px solid var(--mantine-color-blue-6)',
                    borderRadius: radius.value,
                    marginBottom: 12,
                  }}
                />
                <Text fw={600} size="sm">
                  {radius.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {radius.value}
                </Text>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </div>

      <div>
        <Title order={2} mb="md">
          Container Widths
        </Title>
        <Stack gap="md">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
              {['xs', 'sm', 'md', 'lg', 'xl'].map((size) => (
                <div key={size}>
                  <Text fw={600} mb="xs">
                    Container {size.toUpperCase()}
                  </Text>
                  <Box
                    style={{
                      height: 40,
                      backgroundColor: 'var(--mantine-color-gray-2)',
                      border: '1px dashed var(--mantine-color-gray-5)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      style={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        height: '100%',
                        backgroundColor: 'var(--mantine-color-blue-light)',
                        width: size === 'xs' ? 540 : size === 'sm' ? 720 : size === 'md' ? 960 : size === 'lg' ? 1140 : 1320,
                        maxWidth: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text size="xs" fw={500}>
                        {size === 'xs' ? '540px' : size === 'sm' ? '720px' : size === 'md' ? '960px' : size === 'lg' ? '1140px' : '1320px'}
                      </Text>
                    </Box>
                  </Box>
                </div>
              ))}
            </Stack>
          </Card>
        </Stack>
      </div>

      <div>
        <Title order={2} mb="md">
          Grid System
        </Title>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Text mb="md">12-column grid system with responsive breakpoints</Text>
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gap: 8,
              marginBottom: 16,
            }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <Box
                key={i}
                style={{
                  height: 40,
                  backgroundColor: 'var(--mantine-color-blue-light)',
                  border: '1px solid var(--mantine-color-blue-6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text size="xs" fw={500}>
                  {i + 1}
                </Text>
              </Box>
            ))}
          </Box>
          <Code block>{`<Grid>
  <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
    Responsive column
  </Grid.Col>
</Grid>`}</Code>
        </Card>
      </div>

      <div>
        <Title order={2} mb="md">
          Usage Examples
        </Title>
        <Stack gap="md">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Text fw={600} mb="xs">
              SCSS Spacing Function
            </Text>
            <Code block>{`// Using the spacing function
.component {
  padding: spacing("md");           // 16px
  margin-bottom: spacing("lg");     // 24px
  gap: spacing("sm");              // 8px
}

// Or use variables directly
.component {
  padding: $base-spacing * 2;      // 16px
  margin: map-get($spacing-scale, "lg"); // 24px
}`}</Code>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Text fw={600} mb="xs">
              Component Spacing
            </Text>
            <Code block>{`// Mantine components
<Stack gap="md">...</Stack>
<Group gap="lg">...</Group>
<Grid gutter="xl">...</Grid>

// Custom CSS
.custom-layout {
  display: flex;
  gap: var(--spacing-md);
}`}</Code>
          </Card>
        </Stack>
      </div>
    </Stack>
  );
}
