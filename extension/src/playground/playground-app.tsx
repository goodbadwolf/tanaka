import { Button, Container, Title, Text, Stack, Divider } from '@mantine/core';
import { ThemeProvider, useTheme } from '../themes';
import { StyledExample } from './styled-example';
import './styles/playground.css';

function PlaygroundContainer() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Container size="lg" className="playground-container" data-component="playground-container">
      <Stack gap="xl">
        <div className="text-center">
          <Title
            order={1}
            style={{
              color: 'white',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
              marginBottom: '1rem'
            }}
          >
            Tanaka UI Playground
          </Title>
          <Text size="lg" c="white">
            Mantine v8 with Multiple Styling Approaches
          </Text>
        </div>

        <Button
          onClick={toggleTheme}
          variant="white"
          size="lg"
          className="pulse-effect"
          data-component="theme-toggle"
          styles={{
            root: {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#764ba2',
              fontWeight: 600,
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              transition: 'all 0.3s ease',

              '&:hover': {
                backgroundColor: 'white',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)'
              }
            }
          }}
        >
          Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode
        </Button>

        <Divider
          my="xl"
          label="Styling Examples"
          labelPosition="center"
          color="rgba(255, 255, 255, 0.3)"
          styles={{
            label: {
              color: 'white',
              backgroundColor: 'transparent'
            }
          }}
        />

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
