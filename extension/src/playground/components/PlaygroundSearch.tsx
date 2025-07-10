import { CloseButton, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-preact';

interface PlaygroundSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function PlaygroundSearch({
  value,
  onChange,
  placeholder = "Search components..."
}: PlaygroundSearchProps) {
  return (
    <TextInput
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      placeholder={placeholder}
      leftSection={<IconSearch size={16} />}
      rightSection={
        value && (
          <CloseButton
            size="sm"
            onClick={() => onChange('')}
            aria-label="Clear search"
          />
        )
      }
      styles={{
        root: {
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'var(--mantine-color-body)',
        }
      }}
    />
  );
}
