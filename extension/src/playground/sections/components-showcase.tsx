import { Box } from '@mantine/core';
import { PlaygroundSection } from '../components/playground-section';
import { buttonsSection, inputsSection, selectionSection } from './index';

export function ComponentsShowcase() {
  return (
    <Box>
      <PlaygroundSection section={buttonsSection} />
      <Box my={60} />
      <PlaygroundSection section={inputsSection} />
      <Box my={60} />
      <PlaygroundSection section={selectionSection} />
    </Box>
  );
}
