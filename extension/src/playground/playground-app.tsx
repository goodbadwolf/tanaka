import {
  Accordion,
  ActionIcon,
  Alert,
  AspectRatio,
  Avatar,
  Badge,
  Blockquote,
  Box,
  Button,
  Center,
  Checkbox,
  Chip,
  Code,
  ColorInput,
  Container,
  Grid,
  Group,
  Highlight,
  Indicator,
  JsonInput,
  Kbd,
  List,
  Loader,
  Mark,
  Menu,
  MultiSelect,
  Notification,
  NumberInput,
  Paper,
  PasswordInput,
  Progress,
  Radio,
  RangeSlider,
  Rating,
  SegmentedControl,
  Select,
  SimpleGrid,
  Skeleton,
  Slider,
  Stack,
  Switch,
  Table,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core';
import '@mantine/core/styles.css';
import {
  IconBell,
  IconCheck,
  IconChevronDown,
  IconDownload,
  IconEdit,
  IconFolder,
  IconHeart,
  IconHome,
  IconMessage,
  IconPhoto,
  IconSettings,
  IconStar,
  IconTrash,
  IconX,
} from '@tabler/icons-preact';
import { useState } from 'react';
import { PageHeader } from '../components';
import { withThemeProvider } from '../themes/theme-provider';
import './playground.scss';

function PlaygroundContainer() {
  const { colorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';

  // Demo states
  const [textValue, setTextValue] = useState('');
  const [selectValue, setSelectValue] = useState<string | null>(null);
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [radioValue, setRadioValue] = useState('react');
  const [switchValue, setSwitchValue] = useState(false);
  const [sliderValue, setSliderValue] = useState(40);
  const [colorValue, setColorValue] = useState('#ffffff');
  const [ratingValue, setRatingValue] = useState(3);
  const [chipValue, setChipValue] = useState<string[]>(['react']);
  const [tabValue, setTabValue] = useState<string | null>('gallery');

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: dark ? '#1a1b1e' : '#f8f9fa' }}>
      <PageHeader title="Tanaka UI Playground" />

      {/* Main Content */}
      <Container size="md" py="xl">
        <Accordion
          defaultValue={['basic-inputs', 'buttons', 'display']}
          multiple
          variant="separated"
          chevronPosition="left"
          styles={{
            chevron: {
              '&[data-rotate]': {
                transform: 'rotate(90deg)',
              },
            },
          }}
        >
          {/* Basic Inputs Section */}
          <Accordion.Item value="basic-inputs">
            <Accordion.Control icon={<IconEdit size={20} />}>
              <Text fw={500}>Basic Inputs</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="md">
                <TextInput
                  label="Text Input"
                  placeholder="Enter some text..."
                  value={textValue}
                  onChange={(e) => setTextValue(e.currentTarget.value)}
                  description="Basic text input with label"
                />

                <PasswordInput
                  label="Password Input"
                  placeholder="Your password"
                  description="Input with hidden text"
                />

                <Textarea
                  label="Textarea"
                  placeholder="Enter multiple lines..."
                  description="Multi-line text input"
                  minRows={3}
                />

                <NumberInput
                  label="Number Input"
                  placeholder="Enter a number"
                  description="Numeric input with controls"
                  min={0}
                  max={100}
                />

                <Select
                  label="Select"
                  placeholder="Pick one"
                  value={selectValue}
                  onChange={setSelectValue}
                  data={[
                    { value: 'react', label: 'React' },
                    { value: 'vue', label: 'Vue' },
                    { value: 'angular', label: 'Angular' },
                    { value: 'svelte', label: 'Svelte' },
                  ]}
                  description="Dropdown selection"
                />

                <MultiSelect
                  label="Multi Select"
                  placeholder="Pick multiple"
                  data={[
                    { value: 'react', label: 'React' },
                    { value: 'vue', label: 'Vue' },
                    { value: 'angular', label: 'Angular' },
                    { value: 'svelte', label: 'Svelte' },
                  ]}
                  description="Multiple selection dropdown"
                />

                <JsonInput
                  label="JSON Input"
                  placeholder="Enter valid JSON"
                  formatOnBlur
                  autosize
                  minRows={4}
                />
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          {/* Buttons & Actions Section */}
          <Accordion.Item value="buttons">
            <Accordion.Control icon={<IconSettings size={20} />}>
              <Text fw={500}>Buttons & Actions</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="lg">
                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Button Variants
                  </Text>
                  <Group>
                    <Button variant="filled">Filled</Button>
                    <Button variant="light">Light</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="subtle">Subtle</Button>
                    <Button variant="transparent">Transparent</Button>
                    <Button variant="white">White</Button>
                  </Group>
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Button Sizes
                  </Text>
                  <Group align="center">
                    <Button size="xs">Extra Small</Button>
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                    <Button size="xl">Extra Large</Button>
                  </Group>
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Button Colors
                  </Text>
                  <Group>
                    <Button color="blue">Blue</Button>
                    <Button color="red">Red</Button>
                    <Button color="green">Green</Button>
                    <Button color="yellow">Yellow</Button>
                    <Button color="violet">Violet</Button>
                    <Button color="gray">Gray</Button>
                  </Group>
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Button States
                  </Text>
                  <Group>
                    <Button loading>Loading</Button>
                    <Button disabled>Disabled</Button>
                    <Button leftSection={<IconDownload size={16} />}>With Icon</Button>
                    <Button rightSection={<IconChevronDown size={16} />}>Dropdown</Button>
                  </Group>
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Action Icons
                  </Text>
                  <Group>
                    <ActionIcon variant="filled" size="lg">
                      <IconHeart size={20} />
                    </ActionIcon>
                    <ActionIcon variant="light" size="lg" color="red">
                      <IconTrash size={20} />
                    </ActionIcon>
                    <ActionIcon variant="outline" size="lg" color="green">
                      <IconCheck size={20} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" size="lg" color="yellow">
                      <IconStar size={20} />
                    </ActionIcon>
                  </Group>
                </div>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          {/* Display Components Section */}
          <Accordion.Item value="display">
            <Accordion.Control icon={<IconPhoto size={20} />}>
              <Text fw={500}>Display Components</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="lg">
                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Badges
                  </Text>
                  <Group>
                    <Badge>Default</Badge>
                    <Badge color="red">Error</Badge>
                    <Badge color="green">Success</Badge>
                    <Badge color="yellow">Warning</Badge>
                    <Badge variant="dot">With Dot</Badge>
                    <Badge size="lg" variant="outline">
                      Large Outline
                    </Badge>
                  </Group>
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Progress
                  </Text>
                  <Stack gap="xs">
                    <Progress value={30} />
                    <Progress value={60} color="green" />
                    <Progress value={85} color="red" striped />
                    <Progress value={100} color="violet" animated />
                  </Stack>
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Alerts
                  </Text>
                  <Stack gap="xs">
                    <Alert title="Default alert" icon={<IconBell size={16} />}>
                      This is a default alert with an icon
                    </Alert>
                    <Alert title="Success!" color="green" icon={<IconCheck size={16} />}>
                      Operation completed successfully
                    </Alert>
                    <Alert title="Warning" color="yellow" icon={<IconX size={16} />}>
                      Please review before proceeding
                    </Alert>
                  </Stack>
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Avatars
                  </Text>
                  <Group>
                    <Avatar>MK</Avatar>
                    <Avatar color="cyan" radius="xl">
                      JD
                    </Avatar>
                    <Avatar color="red" size="lg">
                      AB
                    </Avatar>
                    <Avatar src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-1.png" />
                    <Avatar.Group spacing="sm">
                      <Avatar>BH</Avatar>
                      <Avatar>YK</Avatar>
                      <Avatar>+5</Avatar>
                    </Avatar.Group>
                  </Group>
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Loaders
                  </Text>
                  <Group>
                    <Loader size="xs" />
                    <Loader size="sm" color="red" />
                    <Loader size="md" color="green" variant="bars" />
                    <Loader size="lg" color="violet" variant="dots" />
                  </Group>
                </div>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          {/* Selection Controls Section */}
          <Accordion.Item value="selection">
            <Accordion.Control icon={<IconCheck size={20} />}>
              <Text fw={500}>Selection Controls</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="lg">
                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Checkbox
                  </Text>
                  <Stack gap="xs">
                    <Checkbox
                      label="Default checkbox"
                      checked={checkboxValue}
                      onChange={(e) => setCheckboxValue(e.currentTarget.checked)}
                    />
                    <Checkbox label="Disabled" disabled />
                    <Checkbox label="Indeterminate" indeterminate />
                  </Stack>
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Radio
                  </Text>
                  <Radio.Group value={radioValue} onChange={setRadioValue}>
                    <Stack gap="xs">
                      <Radio value="react" label="React" />
                      <Radio value="vue" label="Vue" />
                      <Radio value="angular" label="Angular" />
                      <Radio value="svelte" label="Svelte" disabled />
                    </Stack>
                  </Radio.Group>
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Switch
                  </Text>
                  <Stack gap="xs">
                    <Switch
                      label="Toggle me"
                      checked={switchValue}
                      onChange={(e) => setSwitchValue(e.currentTarget.checked)}
                    />
                    <Switch label="Disabled switch" disabled />
                    <Switch label="Large switch" size="lg" defaultChecked />
                  </Stack>
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Segmented Control
                  </Text>
                  <SegmentedControl
                    data={[
                      { label: 'React', value: 'react' },
                      { label: 'Vue', value: 'vue' },
                      { label: 'Angular', value: 'angular' },
                      { label: 'Svelte', value: 'svelte' },
                    ]}
                  />
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Chips
                  </Text>
                  <Chip.Group multiple value={chipValue} onChange={setChipValue}>
                    <Group>
                      <Chip value="react">React</Chip>
                      <Chip value="vue">Vue</Chip>
                      <Chip value="angular">Angular</Chip>
                      <Chip value="svelte">Svelte</Chip>
                    </Group>
                  </Chip.Group>
                </div>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          {/* Sliders & Color Section */}
          <Accordion.Item value="sliders">
            <Accordion.Control icon={<IconSettings size={20} />}>
              <Text fw={500}>Sliders & Color</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="lg">
                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Slider
                  </Text>
                  <Stack gap="md">
                    <Slider
                      value={sliderValue}
                      onChange={setSliderValue}
                      marks={[
                        { value: 20, label: '20%' },
                        { value: 50, label: '50%' },
                        { value: 80, label: '80%' },
                      ]}
                    />
                    <Slider
                      defaultValue={60}
                      color="green"
                      thumbSize={20}
                      label={(value) => `${value}°C`}
                    />
                  </Stack>
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Range Slider
                  </Text>
                  <RangeSlider
                    defaultValue={[20, 80]}
                    marks={[
                      { value: 0, label: 'start' },
                      { value: 50, label: 'middle' },
                      { value: 100, label: 'end' },
                    ]}
                  />
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Color Input
                  </Text>
                  <ColorInput
                    value={colorValue}
                    onChange={setColorValue}
                    format="hex"
                    swatches={[
                      '#25262b',
                      '#868e96',
                      '#fa5252',
                      '#e64980',
                      '#be4bdb',
                      '#7950f2',
                      '#4c6ef5',
                      '#228be6',
                      '#15aabf',
                      '#12b886',
                      '#40c057',
                      '#82c91e',
                      '#fab005',
                      '#fd7e14',
                    ]}
                  />
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Rating
                  </Text>
                  <Stack gap="xs">
                    <Rating value={ratingValue} onChange={setRatingValue} />
                    <Rating defaultValue={2} size="lg" color="red" />
                    <Rating defaultValue={3.5} fractions={2} readOnly />
                  </Stack>
                </div>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          {/* Navigation Section */}
          <Accordion.Item value="navigation">
            <Accordion.Control icon={<IconHome size={20} />}>
              <Text fw={500}>Navigation</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="lg">
                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Tabs
                  </Text>
                  <Tabs value={tabValue} onChange={setTabValue}>
                    <Tabs.List>
                      <Tabs.Tab value="gallery" leftSection={<IconPhoto size={16} />}>
                        Gallery
                      </Tabs.Tab>
                      <Tabs.Tab value="messages" leftSection={<IconMessage size={16} />}>
                        Messages
                      </Tabs.Tab>
                      <Tabs.Tab value="settings" leftSection={<IconSettings size={16} />}>
                        Settings
                      </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="gallery" pt="xs">
                      <Text size="sm" c="dimmed">
                        Gallery tab content
                      </Text>
                    </Tabs.Panel>
                    <Tabs.Panel value="messages" pt="xs">
                      <Text size="sm" c="dimmed">
                        Messages tab content
                      </Text>
                    </Tabs.Panel>
                    <Tabs.Panel value="settings" pt="xs">
                      <Text size="sm" c="dimmed">
                        Settings tab content
                      </Text>
                    </Tabs.Panel>
                  </Tabs>
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Menu
                  </Text>
                  <Menu shadow="md" width={200}>
                    <Menu.Target>
                      <Button rightSection={<IconChevronDown size={16} />}>Toggle menu</Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Label>Application</Menu.Label>
                      <Menu.Item leftSection={<IconSettings size={14} />}>Settings</Menu.Item>
                      <Menu.Item leftSection={<IconMessage size={14} />}>Messages</Menu.Item>
                      <Menu.Item leftSection={<IconPhoto size={14} />}>Gallery</Menu.Item>
                      <Menu.Divider />
                      <Menu.Label>Danger zone</Menu.Label>
                      <Menu.Item color="red" leftSection={<IconTrash size={14} />}>
                        Delete account
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </div>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          {/* Typography Section */}
          <Accordion.Item value="typography">
            <Accordion.Control icon={<IconEdit size={20} />}>
              <Text fw={500}>Typography</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="lg">
                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Text Sizes
                  </Text>
                  <Stack gap="xs">
                    <Text size="xs">Extra small text</Text>
                    <Text size="sm">Small text</Text>
                    <Text size="md">Medium text (default)</Text>
                    <Text size="lg">Large text</Text>
                    <Text size="xl">Extra large text</Text>
                  </Stack>
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Text Styles
                  </Text>
                  <Stack gap="xs">
                    <Text fw={700}>Bold text</Text>
                    <Text fs="italic">Italic text</Text>
                    <Text td="underline">Underlined text</Text>
                    <Text td="line-through">Strikethrough text</Text>
                    <Text c="dimmed">Dimmed text</Text>
                    <Text c="blue">Colored text</Text>
                  </Stack>
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Code & Keyboard
                  </Text>
                  <Stack gap="xs">
                    <Code>const name = 'inline code';</Code>
                    <Code block>{`function greet(name) {
  return \`Hello, \${name}!\`;
}`}</Code>
                    <Group>
                      <Kbd>Ctrl</Kbd> + <Kbd>C</Kbd> to copy
                    </Group>
                  </Stack>
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Other Typography
                  </Text>
                  <Stack gap="xs">
                    <Text>
                      This is <Mark>highlighted</Mark> text
                    </Text>
                    <Highlight highlight="highlight">This text has a highlight</Highlight>
                    <Blockquote cite="– Someone famous">
                      This is a blockquote with a citation
                    </Blockquote>
                  </Stack>
                </div>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          {/* Layout Section */}
          <Accordion.Item value="layout">
            <Accordion.Control icon={<IconFolder size={20} />}>
              <Text fw={500}>Layout Components</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="lg">
                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Paper
                  </Text>
                  <Stack gap="xs">
                    <Paper shadow="xs" p="md">
                      Paper with extra small shadow
                    </Paper>
                    <Paper shadow="md" p="md" withBorder>
                      Paper with medium shadow and border
                    </Paper>
                    <Paper shadow="xl" p="md" radius="md">
                      Paper with extra large shadow and radius
                    </Paper>
                  </Stack>
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Grid
                  </Text>
                  <Grid>
                    <Grid.Col span={4}>
                      <Paper p="md" withBorder>
                        Col 1
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <Paper p="md" withBorder>
                        Col 2
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <Paper p="md" withBorder>
                        Col 3
                      </Paper>
                    </Grid.Col>
                  </Grid>
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Simple Grid
                  </Text>
                  <SimpleGrid cols={3} spacing="lg">
                    {Array(6)
                      .fill(0)
                      .map((_, index) => (
                        <Paper key={index} p="md" withBorder>
                          Item {index + 1}
                        </Paper>
                      ))}
                  </SimpleGrid>
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Aspect Ratio
                  </Text>
                  <AspectRatio ratio={16 / 9} maw={300}>
                    <Paper withBorder h="100%">
                      <Center h="100%">
                        <Text>16:9</Text>
                      </Center>
                    </Paper>
                  </AspectRatio>
                </div>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          {/* Data Display Section */}
          <Accordion.Item value="data">
            <Accordion.Control icon={<IconFolder size={20} />}>
              <Text fw={500}>Data Display</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="lg">
                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Table
                  </Text>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Framework</Table.Th>
                        <Table.Th>Stars</Table.Th>
                        <Table.Th>License</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      <Table.Tr>
                        <Table.Td>React</Table.Td>
                        <Table.Td>200k</Table.Td>
                        <Table.Td>MIT</Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td>Vue</Table.Td>
                        <Table.Td>180k</Table.Td>
                        <Table.Td>MIT</Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td>Angular</Table.Td>
                        <Table.Td>80k</Table.Td>
                        <Table.Td>MIT</Table.Td>
                      </Table.Tr>
                    </Table.Tbody>
                  </Table>
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    List
                  </Text>
                  <List>
                    <List.Item>First item</List.Item>
                    <List.Item>Second item</List.Item>
                    <List.Item>
                      Third item with nested list
                      <List withPadding>
                        <List.Item>Nested item 1</List.Item>
                        <List.Item>Nested item 2</List.Item>
                      </List>
                    </List.Item>
                  </List>
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Skeleton
                  </Text>
                  <Stack gap="xs">
                    <Skeleton height={8} radius="xl" />
                    <Skeleton height={8} width="70%" radius="xl" />
                    <Skeleton height={8} width="50%" radius="xl" />
                  </Stack>
                </div>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          {/* Overlays Section */}
          <Accordion.Item value="overlays">
            <Accordion.Control icon={<IconMessage size={20} />}>
              <Text fw={500}>Overlays & Tooltips</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="lg">
                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Tooltips
                  </Text>
                  <Group>
                    <Tooltip label="Default tooltip">
                      <Button variant="outline">Hover me</Button>
                    </Tooltip>
                    <Tooltip label="Tooltip on top" position="top">
                      <Button variant="outline">Top</Button>
                    </Tooltip>
                    <Tooltip label="Tooltip on right" position="right">
                      <Button variant="outline">Right</Button>
                    </Tooltip>
                    <Tooltip
                      label="Click to show"
                      events={{ hover: false, focus: false, touch: false }}
                    >
                      <Button variant="outline">Click me</Button>
                    </Tooltip>
                  </Group>
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Notification (Static)
                  </Text>
                  <Notification title="Notification title" withCloseButton={false}>
                    This is a notification message
                  </Notification>
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Indicators
                  </Text>
                  <Group>
                    <Indicator inline label="New" size={16}>
                      <Button>With indicator</Button>
                    </Indicator>
                    <Indicator inline processing color="red">
                      <Avatar>JD</Avatar>
                    </Indicator>
                    <Indicator inline disabled>
                      <Button variant="outline">Disabled</Button>
                    </Indicator>
                  </Group>
                </div>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Container>
    </Box>
  );
}

export const PlaygroundApp = withThemeProvider(PlaygroundContainer);
