import { Box, Text } from '@mantine/core';

interface ComingSoonProps {
  feature: string;
}

export function ComingSoon({ feature }: ComingSoonProps) {
  return (
    <Box ta="center" py="xl">
      <Text size="lg" c="dimmed">
        {feature} coming soon...
      </Text>
    </Box>
  );
}

export const FormsSection = () => <ComingSoon feature="Form elements" />;
export const LayoutSection = () => <ComingSoon feature="Layout system" />;
export const PatternsSection = () => <ComingSoon feature="Common patterns" />;
