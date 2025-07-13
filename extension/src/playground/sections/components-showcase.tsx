import {
  Accordion,
  ActionIcon,
  Alert,
  Avatar,
  Badge,
  Blockquote,
  Box,
  Button,
  Card,
  Center,
  Checkbox,
  Code,
  Group,
  Indicator,
  Menu,
  Modal,
  NavLink,
  Paper,
  Popover,
  Progress,
  Radio,
  RingProgress,
  SegmentedControl,
  Select,
  SimpleGrid,
  Slider,
  Stack,
  Switch,
  Tabs,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import {
  IconBell,
  IconChevronDown,
  IconDownload,
  IconEdit,
  IconHeart,
  IconHome,
  IconSearch,
  IconSettings,
  IconStar,
  IconTrash,
  IconUser,
} from '@tabler/icons-preact';
import { useState } from 'preact/hooks';
import './components-showcase.scss';

export function ComponentsShowcaseSection() {
  const [opened, setOpened] = useState(false);
  const [value, setValue] = useState('react');
  const [sliderValue, setSliderValue] = useState(40);

  return (
    <Stack gap="xl" className="tnk-showcase">
      <Box>
        <Title order={1} mb="md">
          Components Showcase
        </Title>
        <Text c="dimmed">Commonly used Mantine components and custom Tanaka components</Text>
      </Box>

      <Tabs defaultValue="mantine">
        <Tabs.List>
          <Tabs.Tab value="mantine">Mantine Components</Tabs.Tab>
          <Tabs.Tab value="tanaka">Tanaka Components</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="mantine" pt="xl">
          <Stack gap="xl">
            {/* Buttons & Actions */}
            <Card withBorder>
              <Title order={3} mb="lg">
                Buttons & Actions
              </Title>
              <Stack gap="md">
                <Group>
                  <Button>Default</Button>
                  <Button variant="filled" color="blue">
                    Primary
                  </Button>
                  <Button variant="light">Light</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="subtle">Subtle</Button>
                  <Button variant="transparent">Transparent</Button>
                  <Button color="red">Danger</Button>
                  <Button loading>Loading</Button>
                  <Button disabled>Disabled</Button>
                </Group>

                <Group>
                  <Button size="xs">Extra Small</Button>
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                  <Button size="xl">Extra Large</Button>
                </Group>

                <Group>
                  <Button leftSection={<IconDownload size={16} />}>Download</Button>
                  <Button rightSection={<IconChevronDown size={16} />}>Options</Button>
                  <Button variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                    Gradient
                  </Button>
                </Group>

                <Group>
                  <ActionIcon variant="filled">
                    <IconHeart size={18} />
                  </ActionIcon>
                  <ActionIcon variant="light">
                    <IconStar size={18} />
                  </ActionIcon>
                  <ActionIcon variant="outline">
                    <IconSettings size={18} />
                  </ActionIcon>
                  <ActionIcon variant="subtle">
                    <IconTrash size={18} />
                  </ActionIcon>
                </Group>
              </Stack>
            </Card>

            {/* Form Inputs */}
            <Card withBorder>
              <Title order={3} mb="lg">
                Form Inputs
              </Title>
              <Stack gap="md">
                <TextInput
                  label="Text Input"
                  placeholder="Enter text..."
                  leftSection={<IconUser size={16} />}
                />
                <TextInput
                  label="With Error"
                  placeholder="Invalid input"
                  error="This field is required"
                />
                <Select
                  label="Select"
                  placeholder="Pick one"
                  data={['React', 'Vue', 'Angular', 'Svelte']}
                />
                <Group>
                  <Checkbox label="Checkbox" />
                  <Radio label="Radio option" />
                  <Switch label="Switch" />
                </Group>
                <Box>
                  <Text size="sm" mb="xs">
                    Slider: {sliderValue}%
                  </Text>
                  <Slider value={sliderValue} onChange={setSliderValue} />
                </Box>
                <SegmentedControl
                  value={value}
                  onChange={setValue}
                  data={[
                    { label: 'React', value: 'react' },
                    { label: 'Vue', value: 'vue' },
                    { label: 'Angular', value: 'angular' },
                  ]}
                />
              </Stack>
            </Card>

            {/* Feedback */}
            <Card withBorder>
              <Title order={3} mb="lg">
                Feedback & Status
              </Title>
              <Stack gap="md">
                <Alert variant="light" color="blue" title="Information" icon={<IconBell />}>
                  This is an informational alert with an icon
                </Alert>
                <Alert variant="filled" color="green" title="Success">
                  Operation completed successfully!
                </Alert>
                <Alert variant="outline" color="red" title="Error">
                  Something went wrong. Please try again.
                </Alert>

                <Group>
                  <Badge>Default</Badge>
                  <Badge color="blue">Blue</Badge>
                  <Badge color="green">Green</Badge>
                  <Badge color="red">Red</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="dot">Dot</Badge>
                  <Badge size="lg" radius="xl">
                    Large
                  </Badge>
                </Group>

                <Box>
                  <Text size="sm" mb="xs">
                    Progress: 60%
                  </Text>
                  <Progress value={60} />
                </Box>

                <Group>
                  <RingProgress
                    sections={[
                      { value: 40, color: 'cyan' },
                      { value: 30, color: 'orange' },
                      { value: 30, color: 'grape' },
                    ]}
                  />
                  <Stack gap={4}>
                    <Text size="sm">
                      <Badge size="xs" color="cyan" /> Completed
                    </Text>
                    <Text size="sm">
                      <Badge size="xs" color="orange" /> In Progress
                    </Text>
                    <Text size="sm">
                      <Badge size="xs" color="grape" /> Pending
                    </Text>
                  </Stack>
                </Group>
              </Stack>
            </Card>

            {/* Layout Components */}
            <Card withBorder>
              <Title order={3} mb="lg">
                Layout & Surfaces
              </Title>
              <Stack gap="md">
                <Paper shadow="xs" p="md">
                  <Text>Paper with shadow</Text>
                </Paper>
                <Paper withBorder p="md">
                  <Text>Paper with border</Text>
                </Paper>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Card.Section>
                    <Center h={100} bg="blue.6">
                      <Text c="white" fw={500}>
                        Card Section
                      </Text>
                    </Center>
                  </Card.Section>
                  <Text mt="md">Card with section</Text>
                </Card>

                <SimpleGrid cols={3} spacing="md">
                  <Paper withBorder p="md" ta="center">
                    <Text>Grid 1</Text>
                  </Paper>
                  <Paper withBorder p="md" ta="center">
                    <Text>Grid 2</Text>
                  </Paper>
                  <Paper withBorder p="md" ta="center">
                    <Text>Grid 3</Text>
                  </Paper>
                </SimpleGrid>
              </Stack>
            </Card>

            {/* Navigation */}
            <Card withBorder>
              <Title order={3} mb="lg">
                Navigation
              </Title>
              <Stack gap="md">
                <Group>
                  <NavLink label="Home" leftSection={<IconHome size={16} />} />
                  <NavLink label="Settings" leftSection={<IconSettings size={16} />} active />
                  <NavLink label="Profile" leftSection={<IconUser size={16} />} />
                </Group>

                <Tabs defaultValue="tab1">
                  <Tabs.List>
                    <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
                    <Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
                    <Tabs.Tab value="tab3">Tab 3</Tabs.Tab>
                  </Tabs.List>
                  <Tabs.Panel value="tab1" pt="sm">
                    <Text>Tab 1 content</Text>
                  </Tabs.Panel>
                </Tabs>

                <Accordion>
                  <Accordion.Item value="item1">
                    <Accordion.Control>Accordion Item 1</Accordion.Control>
                    <Accordion.Panel>Content for item 1</Accordion.Panel>
                  </Accordion.Item>
                  <Accordion.Item value="item2">
                    <Accordion.Control>Accordion Item 2</Accordion.Control>
                    <Accordion.Panel>Content for item 2</Accordion.Panel>
                  </Accordion.Item>
                </Accordion>
              </Stack>
            </Card>

            {/* Overlays */}
            <Card withBorder>
              <Title order={3} mb="lg">
                Overlays & Modals
              </Title>
              <Group>
                <Tooltip label="Tooltip content">
                  <Button variant="outline">Hover for tooltip</Button>
                </Tooltip>

                <Menu>
                  <Menu.Target>
                    <Button rightSection={<IconChevronDown size={14} />}>Menu</Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item leftSection={<IconEdit size={14} />}>Edit</Menu.Item>
                    <Menu.Item leftSection={<IconTrash size={14} />} color="red">
                      Delete
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>

                <Popover>
                  <Popover.Target>
                    <Button>Popover</Button>
                  </Popover.Target>
                  <Popover.Dropdown>
                    <Text size="sm">Popover content</Text>
                  </Popover.Dropdown>
                </Popover>

                <Button onClick={() => setOpened(true)}>Open Modal</Button>
              </Group>
            </Card>

            {/* Data Display */}
            <Card withBorder>
              <Title order={3} mb="lg">
                Data Display
              </Title>
              <Stack gap="md">
                <Avatar.Group>
                  <Avatar src={null} />
                  <Avatar color="blue">JD</Avatar>
                  <Avatar color="green">AB</Avatar>
                  <Avatar>+5</Avatar>
                </Avatar.Group>

                <Group>
                  <Indicator processing>
                    <Avatar>US</Avatar>
                  </Indicator>
                  <Indicator color="red" withBorder>
                    <IconBell />
                  </Indicator>
                </Group>

                <Code block>
                  {`function hello() {
  console.log('Hello, world!');
}`}
                </Code>

                <Blockquote cite="– Forrest Gump">Life is like a box of chocolates</Blockquote>
              </Stack>
            </Card>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="tanaka" pt="xl">
          <Stack gap="xl">
            {/* Note about components */}
            <Alert variant="light" color="blue" title="Tanaka Components">
              The custom Tanaka components (Toggle, ThemeToggle) will be implemented in Phase 4
              of the SCSS migration. For now, using Mantine's Switch component as a placeholder.
            </Alert>

            {/* Window Tracking Card */}
            <Card withBorder>
              <Title order={3} mb="lg">
                Window Tracking Card
              </Title>
              <Stack gap="md">
                <Text size="sm" c="dimmed">
                  Used in popup to show window tracking status
                </Text>

                <Card withBorder className="tnk-showcase__window-card">
                  <Group justify="space-between">
                    <Box>
                      <Text fw={500}>Work Browser</Text>
                      <Text size="sm" c="dimmed">
                        12 tabs • Last synced 2m ago
                      </Text>
                    </Box>
                    <Switch defaultChecked />
                  </Group>
                </Card>

                <Card withBorder className="tnk-showcase__window-card">
                  <Group justify="space-between">
                    <Box>
                      <Text fw={500}>Personal Browser</Text>
                      <Text size="sm" c="dimmed">
                        8 tabs • Syncing...
                      </Text>
                    </Box>
                    <Switch />
                  </Group>
                </Card>

                <Code block>
                  {`<Card withBorder>
  <Group justify="space-between">
    <Box>
      <Text fw={500}>{window.title}</Text>
      <Text size="sm" c="dimmed">
        {tabCount} tabs • {syncStatus}
      </Text>
    </Box>
    <Switch checked={isTracked} onChange={setTracked} />
  </Group>
</Card>`}
                </Code>
              </Stack>
            </Card>

            {/* Sync Status */}
            <Card withBorder>
              <Title order={3} mb="lg">
                Sync Status Indicators
              </Title>
              <Stack gap="md">
                <Text size="sm" c="dimmed">
                  Real-time sync status display
                </Text>

                <Group gap="lg">
                  <Box className="tnk-showcase__sync-status tnk-showcase__sync-status--synced">
                    <Box className="tnk-showcase__sync-dot" />
                    <Text size="sm">Synced</Text>
                  </Box>
                  <Box className="tnk-showcase__sync-status tnk-showcase__sync-status--syncing">
                    <Box className="tnk-showcase__sync-dot" />
                    <Text size="sm">Syncing...</Text>
                  </Box>
                  <Box className="tnk-showcase__sync-status tnk-showcase__sync-status--error">
                    <Box className="tnk-showcase__sync-dot" />
                    <Text size="sm">Error</Text>
                  </Box>
                  <Box className="tnk-showcase__sync-status tnk-showcase__sync-status--offline">
                    <Box className="tnk-showcase__sync-dot" />
                    <Text size="sm">Offline</Text>
                  </Box>
                </Group>

                <Code block>
                  {`<Box className={\`sync-status sync-status--\${status}\`}>
  <Box className="sync-dot" />
  <Text size="sm">{statusText}</Text>
</Box>`}
                </Code>
              </Stack>
            </Card>

            {/* Empty States */}
            <Card withBorder>
              <Title order={3} mb="lg">
                Empty States
              </Title>
              <Stack gap="md">
                <Text size="sm" c="dimmed">
                  Placeholder states for empty content
                </Text>

                <Card withBorder p="xl" ta="center" className="tnk-showcase__empty-state">
                  <IconSearch size={48} stroke={1.5} style={{ opacity: 0.5 }} />
                  <Text size="lg" fw={500} mt="md">
                    No windows tracked
                  </Text>
                  <Text size="sm" c="dimmed" mt="xs">
                    Click "Track This Window" to start syncing tabs
                  </Text>
                  <Button mt="md" variant="light">
                    Track Current Window
                  </Button>
                </Card>
              </Stack>
            </Card>

            {/* Theme-Specific Components */}
            <Card withBorder>
              <Title order={3} mb="lg">
                Theme-Specific Styles
              </Title>
              <Stack gap="md">
                <Text size="sm" c="dimmed">
                  Components that adapt to the current theme
                </Text>

                <Group>
                  <Button className="tnk-showcase__gradient-button">Gradient Button</Button>
                  <Card className="tnk-showcase__glow-card" p="md">
                    <Text c="white" fw={500}>
                      Glow Card
                    </Text>
                  </Card>
                </Group>

                <Paper className="tnk-showcase__glass-card" p="md">
                  <Text fw={500}>Glass Morphism Card</Text>
                  <Text size="sm" c="dimmed">
                    Translucent background with blur
                  </Text>
                </Paper>
              </Stack>
            </Card>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {/* Modal Example */}
      <Modal opened={opened} onClose={() => setOpened(false)} title="Example Modal">
        <Text>This is a modal dialog example.</Text>
      </Modal>
    </Stack>
  );
}
