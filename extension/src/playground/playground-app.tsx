import { Button, Container, Title, Text, Stack, Divider } from '@mantine/core';
import { ThemeProvider, useTheme } from '../themes';
import { StyledExample } from './styled-example';

function PlaygroundContainer() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Container size="sm" py="xl">
      <Stack gap="md">
        <Title order={1}>Tanaka UI Playground</Title>
        <Text>Current theme: {theme}</Text>
        <Button onClick={toggleTheme}>
          Toggle Theme
        </Button>
        <Text c="dimmed" size="sm">
          This is a playground for developing UI components. They can be added below.
        </Text>

        <Divider my="xl" label="CSS-in-JS Examples" labelPosition="center" />

        <StyledExample />
      </Stack>
    </Container>
  );
}

export function PlaygroundApp() {
  return (
    <ThemeProvider>
      <PlaygroundContainer />
    </ThemeProvider>
  );
}
