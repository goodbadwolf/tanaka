import {
  JsonInput,
  MultiSelect,
  NumberInput,
  PasswordInput,
  Select,
  Stack,
  TextInput,
  Textarea
} from '@mantine/core';
import { IconEdit } from '@tabler/icons-preact';
import type { PlaygroundSection } from '../types';


export const inputsSection: PlaygroundSection = {
  id: 'inputs',
  title: 'Form Inputs',
  icon: <IconEdit size={20} />,
  description: 'Text inputs, selects, and other form controls',
  examples: [
    {
      id: 'text-inputs',
      title: 'Text Inputs',
      description: 'Various text input types',
      component: (
        <Stack>
          <TextInput
            label="Text Input"
            placeholder="Enter some text..."
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
        </Stack>
      ),
      code: `<TextInput
  label="Text Input"
  placeholder="Enter some text..."
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
/>`
    },
    {
      id: 'numeric-input',
      title: 'Numeric Input',
      description: 'Number input with controls',
      component: (
        <NumberInput
          label="Number Input"
          placeholder="Enter a number"
          description="Numeric input with controls"
          min={0}
          max={100}
        />
      ),
      code: `<NumberInput
  label="Number Input"
  placeholder="Enter a number"
  description="Numeric input with controls"
  min={0}
  max={100}
/>`
    },
    {
      id: 'select-inputs',
      title: 'Select Inputs',
      description: 'Dropdown selections',
      component: (
        <Stack>
          <Select
            label="Select"
            placeholder="Pick one"
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
        </Stack>
      ),
      code: `<Select
  label="Select"
  placeholder="Pick one"
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
/>`
    },
    {
      id: 'json-input',
      title: 'JSON Input',
      description: 'Structured data input',
      component: (
        <JsonInput
          label="JSON Input"
          placeholder="Enter valid JSON"
          formatOnBlur
          autosize
          minRows={4}
        />
      ),
      code: `<JsonInput
  label="JSON Input"
  placeholder="Enter valid JSON"
  formatOnBlur
  autosize
  minRows={4}
/>`
    }
  ]
};
