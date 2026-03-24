import { ActionIcon, Button, Group } from '@mantine/core';
import {
  IconCheck,
  IconChevronDown,
  IconDownload,
  IconHeart,
  IconSettings,
  IconStar,
  IconTrash
} from '@tabler/icons-preact';
import type { PlaygroundSection } from '../types';

export const buttonsSection: PlaygroundSection = {
  id: 'buttons',
  title: 'Buttons & Actions',
  icon: <IconSettings size={20} />,
  description: 'Interactive elements for user actions',
  examples: [
    {
      id: 'button-variants',
      title: 'Button Variants',
      description: 'Different visual styles for buttons',
      component: (
        <Group>
          <Button variant="filled">Filled</Button>
          <Button variant="light">Light</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="subtle">Subtle</Button>
          <Button variant="transparent">Transparent</Button>
          <Button variant="white">White</Button>
        </Group>
      ),
      code: `<Button variant="filled">Filled</Button>
<Button variant="light">Light</Button>
<Button variant="outline">Outline</Button>
<Button variant="subtle">Subtle</Button>
<Button variant="transparent">Transparent</Button>
<Button variant="white">White</Button>`
    },
    {
      id: 'button-sizes',
      title: 'Button Sizes',
      description: 'Available button sizes',
      component: (
        <Group align="center">
          <Button size="xs">Extra Small</Button>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="xl">Extra Large</Button>
        </Group>
      ),
      code: `<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>`
    },
    {
      id: 'button-colors',
      title: 'Button Colors',
      description: 'Theme color variations',
      component: (
        <Group>
          <Button color="blue">Blue</Button>
          <Button color="red">Red</Button>
          <Button color="green">Green</Button>
          <Button color="yellow">Yellow</Button>
          <Button color="violet">Violet</Button>
          <Button color="gray">Gray</Button>
        </Group>
      ),
      code: `<Button color="blue">Blue</Button>
<Button color="red">Red</Button>
<Button color="green">Green</Button>
<Button color="yellow">Yellow</Button>
<Button color="violet">Violet</Button>
<Button color="gray">Gray</Button>`
    },
    {
      id: 'button-states',
      title: 'Button States',
      description: 'Loading, disabled, and icon states',
      component: (
        <Group>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button leftSection={<IconDownload size={16} />}>With Icon</Button>
          <Button rightSection={<IconChevronDown size={16} />}>Dropdown</Button>
        </Group>
      ),
      code: `<Button loading>Loading</Button>
<Button disabled>Disabled</Button>
<Button leftSection={<IconDownload size={16} />}>With Icon</Button>
<Button rightSection={<IconChevronDown size={16} />}>Dropdown</Button>`
    },
    {
      id: 'action-icons',
      title: 'Action Icons',
      description: 'Icon-only button variations',
      component: (
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
      ),
      code: `<ActionIcon variant="filled" size="lg">
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
</ActionIcon>`
    }
  ]
};
