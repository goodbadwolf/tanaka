import { Stack, Text, Title } from '@mantine/core';
import { ComponentExample } from '../component-example';
import type { PlaygroundSection as PlaygroundSectionType } from '../../types';
import './playground-section.scss';

interface PlaygroundSectionProps {
  section: PlaygroundSectionType;
}

export function PlaygroundSection({ section }: PlaygroundSectionProps) {
  return (
    <div>
      <Title order={2} mb="md">
        {section.title}
      </Title>
      {section.description && (
        <Text size="lg" c="dimmed" mb="xl">
          {section.description}
        </Text>
      )}
      <Stack gap="xl">
        {section.examples.map((example) => (
          <ComponentExample key={example.id} example={example} />
        ))}
      </Stack>
    </div>
  );
}
