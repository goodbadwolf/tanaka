import { ActionIcon, Code, Collapse, Group, Paper, Stack, Text, Tooltip } from '@mantine/core';
import { IconCode, IconCopy } from '@tabler/icons-preact';
import { useState } from 'react';
import { renderComponent } from '../../../utils/component-utils';
import type { ComponentExample as ComponentExampleType } from '../../types';
import './component-example.scss';

interface ComponentExampleProps {
  example: ComponentExampleType;
  showCode?: boolean;
}

export function ComponentExample({
  example,
  showCode: defaultShowCode = false,
}: ComponentExampleProps) {
  const [showCode, setShowCode] = useState(defaultShowCode);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (example.code) {
      navigator.clipboard.writeText(example.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="flex-start">
        <div>
          <Text size="sm" fw={500}>
            {example.title}
          </Text>
          {example.description && (
            <Text size="xs" c="dimmed">
              {example.description}
            </Text>
          )}
        </div>
        {example.code && (
          <Group gap="xs">
            <Tooltip label={copied ? 'Copied!' : 'Copy code'}>
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={handleCopy}
                color={copied ? 'green' : 'gray'}
              >
                <IconCopy size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={showCode ? 'Hide code' : 'Show code'}>
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={() => setShowCode(!showCode)}
                color={showCode ? 'blue' : 'gray'}
              >
                <IconCode size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )}
      </Group>

      <Paper p="md" withBorder radius="sm">
        {renderComponent(example.component)}
      </Paper>

      {example.code && (
        <Collapse in={showCode}>
          <Code block className="language-tsx">
            {example.code}
          </Code>
        </Collapse>
      )}
    </Stack>
  );
}
