import {
  Checkbox,
  Chip,
  Group,
  Radio,
  SegmentedControl,
  Stack,
  Switch
} from '@mantine/core';
import { IconCheck } from '@tabler/icons-preact';
import { Toggle } from '../../components/toggle';
import type { PlaygroundSection } from '../types';


export const selectionSection: PlaygroundSection = {
  id: 'selection',
  title: 'Selection Controls',
  icon: <IconCheck size={20} />,
  description: 'Checkboxes, radios, switches, and toggles',
  examples: [
    {
      id: 'checkbox',
      title: 'Checkbox',
      description: 'Multi-choice selection',
      component: (
        <Stack gap="xs">
          <Checkbox label="Default checkbox" />
          <Checkbox label="Disabled" disabled />
          <Checkbox label="Indeterminate" indeterminate />
        </Stack>
      ),
      code: `<Checkbox label="Default checkbox" />
<Checkbox label="Disabled" disabled />
<Checkbox label="Indeterminate" indeterminate />`
    },
    {
      id: 'radio',
      title: 'Radio',
      description: 'Single choice selection',
      component: (
        <Radio.Group defaultValue="react">
          <Stack gap="xs">
            <Radio value="react" label="React" />
            <Radio value="vue" label="Vue" />
            <Radio value="angular" label="Angular" />
            <Radio value="svelte" label="Svelte" disabled />
          </Stack>
        </Radio.Group>
      ),
      code: `<Radio.Group defaultValue="react">
  <Stack gap="xs">
    <Radio value="react" label="React" />
    <Radio value="vue" label="Vue" />
    <Radio value="angular" label="Angular" />
    <Radio value="svelte" label="Svelte" disabled />
  </Stack>
</Radio.Group>`
    },
    {
      id: 'switch',
      title: 'Switch',
      description: 'Mantine switch component',
      component: (
        <Stack gap="xs">
          <Switch label="Toggle me" />
          <Switch label="Disabled switch" disabled />
          <Switch label="Large switch" size="lg" defaultChecked />
        </Stack>
      ),
      code: `<Switch label="Toggle me" />
<Switch label="Disabled switch" disabled />
<Switch label="Large switch" size="lg" defaultChecked />`
    },
    {
      id: 'custom-toggle',
      title: 'Custom Toggle (SCSS Component)',
      description: 'Our custom toggle component built with SCSS',
      component: (
        <Stack gap="xs">
          <Toggle label="Default toggle" />
          <Toggle label="Small toggle" size="small" defaultChecked />
          <Toggle label="Large toggle" size="large" />
          <Toggle label="Disabled toggle" disabled checked />
          <Toggle aria-label="Toggle without visible label" />
        </Stack>
      ),
      code: `<Toggle label="Default toggle" />
<Toggle label="Small toggle" size="small" defaultChecked />
<Toggle label="Large toggle" size="large" />
<Toggle label="Disabled toggle" disabled checked />
<Toggle aria-label="Toggle without visible label" />`
    },
    {
      id: 'segmented-control',
      title: 'Segmented Control',
      description: 'Multi-option toggle control',
      component: (
        <SegmentedControl
          data={[
            { label: 'React', value: 'react' },
            { label: 'Vue', value: 'vue' },
            { label: 'Angular', value: 'angular' },
            { label: 'Svelte', value: 'svelte' },
          ]}
        />
      ),
      code: `<SegmentedControl
  data={[
    { label: 'React', value: 'react' },
    { label: 'Vue', value: 'vue' },
    { label: 'Angular', value: 'angular' },
    { label: 'Svelte', value: 'svelte' },
  ]}
/>`
    },
    {
      id: 'chips',
      title: 'Chips',
      description: 'Tag-like selection',
      component: (
        <Chip.Group multiple defaultValue={['react']}>
          <Group>
            <Chip value="react">React</Chip>
            <Chip value="vue">Vue</Chip>
            <Chip value="angular">Angular</Chip>
            <Chip value="svelte">Svelte</Chip>
          </Group>
        </Chip.Group>
      ),
      code: `<Chip.Group multiple defaultValue={['react']}>
  <Group>
    <Chip value="react">React</Chip>
    <Chip value="vue">Vue</Chip>
    <Chip value="angular">Angular</Chip>
    <Chip value="svelte">Svelte</Chip>
  </Group>
</Chip.Group>`
    }
  ]
};
