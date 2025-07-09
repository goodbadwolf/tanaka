import { Button, Container, Title, Text, Stack, Divider, SegmentedControl, Group } from '@mantine/core';
import { ThemeProvider, useTheme } from '../themes';
import { StyledExample } from './styled-example';
import { StylingUtilsExample } from './styling-utils-example';
import { useState, useEffect } from 'react';
import { ThemeStyle } from '../themes/theme-config';

// Import both theme styles
import './styles/v3/playground.css';
import './styles/cyberpunk/playground.css';

interface PlaygroundContainerProps {
  themeStyle: ThemeStyle;
  setThemeStyle: (style: ThemeStyle) => void;
}

function PlaygroundContainer({ themeStyle, setThemeStyle }: PlaygroundContainerProps) {
  const { theme, toggleTheme } = useTheme();

  // Apply theme class to body
  useEffect(() => {
    document.body.className = `theme-${themeStyle}`;
  }, [themeStyle]);

  return (
    <Container size="lg" className="playground-container" data-component="playground-container">
      <Stack gap="xl">
        <div className="text-center">
          <Title
            order={1}
            style={{
              color: 'white',
              textShadow: themeStyle === ThemeStyle.CYBERPUNK
                ? '0 0 20px var(--mantine-color-neonPink-5)'
                : '2px 2px 4px rgba(0, 0, 0, 0.3)',
              marginBottom: '1rem'
            }}
          >
            Tanaka UI Playground
          </Title>
          <Text size="lg" c="white">
            Mantine v8 - {themeStyle === ThemeStyle.V3 ? 'V3 Theme' : 'Cyberpunk Theme'}
          </Text>
        </div>

        <Group justify="center">
          <SegmentedControl
            value={themeStyle}
            onChange={(value) => setThemeStyle(value as ThemeStyle)}
            data={[
              { label: 'V3 Theme', value: ThemeStyle.V3 },
              { label: 'Cyberpunk', value: ThemeStyle.CYBERPUNK },
            ]}
            styles={{
              root: {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              },
            }}
          />
        </Group>

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

        <Divider
          my="xl"
          label="Styling Utilities"
          labelPosition="center"
          color="rgba(255, 255, 255, 0.3)"
          styles={{
            label: {
              color: 'white',
              backgroundColor: 'transparent'
            }
          }}
        />

        <StylingUtilsExample themeStyle={themeStyle} />
      </Stack>
    </Container>
  );
}

export function PlaygroundApp() {
  const [themeStyle, setThemeStyle] = useState<ThemeStyle>(ThemeStyle.V3);

  return (
    <ThemeProvider themeStyle={themeStyle}>
      <PlaygroundContainer themeStyle={themeStyle} setThemeStyle={setThemeStyle} />
    </ThemeProvider>
  );
}

// Easy theme switching for testing
// Change the default theme in useState above to ThemeStyle.CYBERPUNK to test the cyberpunk theme
