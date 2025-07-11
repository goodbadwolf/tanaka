import { Box, Card, Code, Group, Stack, Text, Title } from '@mantine/core';
import './typography.scss';

const fontSizes = [
  { name: 'xs', size: '12px', lineHeight: '16px', usage: 'Small labels, helper text' },
  { name: 'sm', size: '14px', lineHeight: '20px', usage: 'Body text, form labels' },
  { name: 'md', size: '16px', lineHeight: '24px', usage: 'Default body text' },
  { name: 'lg', size: '18px', lineHeight: '28px', usage: 'Large body text, small headings' },
  { name: 'xl', size: '20px', lineHeight: '28px', usage: 'Section headings' },
];

const headingSizes = [
  { level: 1, size: '36px', lineHeight: '40px', weight: 800 },
  { level: 2, size: '30px', lineHeight: '36px', weight: 700 },
  { level: 3, size: '24px', lineHeight: '32px', weight: 600 },
  { level: 4, size: '20px', lineHeight: '28px', weight: 600 },
  { level: 5, size: '18px', lineHeight: '24px', weight: 600 },
  { level: 6, size: '16px', lineHeight: '20px', weight: 600 },
];

export function TypographySection() {
  return (
    <Stack gap="xl">
      <div>
        <Title order={1} mb="md">
          Typography
        </Title>
        <Text size="lg" c="dimmed">
          A type system that ensures readability and hierarchy across the interface.
        </Text>
      </div>

      <div>
        <Title order={2} mb="md">
          Font Family
        </Title>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Text className="tnk-typography__system-font">System UI Font Stack (Default)</Text>
            <Code block>{`font-family: system-ui, -apple-system, BlinkMacSystemFont,
  'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
  'Open Sans', 'Helvetica Neue', sans-serif;`}</Code>
            <Text size="sm" c="dimmed">
              Uses the native system font for optimal readability and performance on each platform.
            </Text>
          </Stack>
        </Card>
      </div>

      <div>
        <Title order={2} mb="md">
          Heading Scales
        </Title>
        <Stack gap="md">
          {headingSizes.map((heading) => (
            <Card key={heading.level} shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" align="flex-start">
                <Box className="tnk-typography__flex-box">
                  <Title
                    order={heading.level as any}
                    className="tnk-typography__heading-demo"
                    style={{
                      fontSize: heading.size,
                      lineHeight: heading.lineHeight,
                      fontWeight: heading.weight,
                    }}
                  >
                    Heading {heading.level}
                  </Title>
                </Box>
                <Stack gap={4} align="flex-end" className="tnk-typography__meta-stack">
                  <Text size="xs" c="dimmed">
                    Size: {heading.size}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Line height: {heading.lineHeight}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Weight: {heading.weight}
                  </Text>
                </Stack>
              </Group>
            </Card>
          ))}
        </Stack>
      </div>

      <div>
        <Title order={2} mb="md">
          Text Sizes
        </Title>
        <Stack gap="md">
          {fontSizes.map((size) => (
            <Card key={size.name} shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" align="center">
                <Box className="tnk-typography__flex-box">
                  <Text size={size.name as any}>The quick brown fox jumps over the lazy dog</Text>
                </Box>
                <Stack gap={4} align="flex-end" className="tnk-typography__text-meta-stack">
                  <Code>{`size="${size.name}"`}</Code>
                  <Text size="xs" c="dimmed">
                    {size.size} / {size.lineHeight}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {size.usage}
                  </Text>
                </Stack>
              </Group>
            </Card>
          ))}
        </Stack>
      </div>

      <div>
        <Title order={2} mb="md">
          Font Weights
        </Title>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Text fw={400}>Regular (400) - Default body text weight</Text>
            <Text fw={500}>Medium (500) - Slightly emphasized text</Text>
            <Text fw={600}>Semibold (600) - Subheadings and labels</Text>
            <Text fw={700}>Bold (700) - Strong emphasis</Text>
            <Text fw={800}>Extra Bold (800) - Primary headings</Text>
          </Stack>
        </Card>
      </div>

      <div>
        <Title order={2} mb="md">
          Text Styles
        </Title>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Text fs="italic">Italic text for emphasis</Text>
            <Text td="underline">Underlined text for links</Text>
            <Text td="line-through">Strikethrough for deprecated items</Text>
            <Text tt="uppercase">Uppercase text for labels</Text>
            <Text c="dimmed">Dimmed text for secondary information</Text>
            <Text className="tnk-typography__gradient-text">
              Gradient text for special emphasis
            </Text>
          </Stack>
        </Card>
      </div>

      <div>
        <Title order={2} mb="md">
          Usage Guidelines
        </Title>
        <Stack gap="md">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={3} size="h5" mb="sm">
              Hierarchy
            </Title>
            <Text size="sm">
              Use consistent heading levels to create clear visual hierarchy. Never skip heading
              levels for styling purposes.
            </Text>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={3} size="h5" mb="sm">
              Line Length
            </Title>
            <Text size="sm">
              Keep line lengths between 45-75 characters for optimal readability. Use max-width
              constraints on text containers.
            </Text>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={3} size="h5" mb="sm">
              Contrast
            </Title>
            <Text size="sm">
              Ensure text has sufficient contrast against backgrounds. Use WCAG AA standards: 4.5:1
              for normal text, 3:1 for large text.
            </Text>
          </Card>
        </Stack>
      </div>
    </Stack>
  );
}
