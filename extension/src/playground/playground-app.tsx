import { Container, Title, SegmentedControl, Group } from '@mantine/core';
import { ThemeProvider } from '../themes';
// import { Button, Text, Stack, Divider } from '@mantine/core';
// import { useTheme } from '../themes';
// import { StyledExample } from './styled-example';
// import { StylingUtilsExample } from './styling-utils-example';
// import { DebugStylesExample } from './debug-styles-example';
import { useState, useEffect } from 'react';
import { ThemeStyle } from '../themes/theme-config';

// Import our new SCSS
import './styles/playground.scss';

interface PlaygroundContainerProps {
  themeStyle: ThemeStyle;
  setThemeStyle: (style: ThemeStyle) => void;
}

function PlaygroundContainer({ themeStyle, setThemeStyle }: PlaygroundContainerProps) {
  // Apply theme class to body
  useEffect(() => {
    document.body.className = `theme-${themeStyle}`;
  }, [themeStyle]);

  // Now with theme switcher
  return (
    <Container size="lg" className="playground-container">
      <Title order={1} className="playground-title">
        Tanaka UI Playground
      </Title>

      {/* Step 2: Theme switcher */}
      <Group justify="center" className="theme-switcher-group">
        <SegmentedControl
          value={themeStyle}
          onChange={(value) => setThemeStyle(value as ThemeStyle)}
          data={[
            { label: 'V3 Theme', value: ThemeStyle.V3 },
            { label: 'Cyberpunk', value: ThemeStyle.CYBERPUNK },
          ]}
          className="theme-switcher"
        />
      </Group>

      {/* Step 3: Toggle button will go here */}
      {/* <Button onClick={toggleTheme}>
        Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode
      </Button> */}

      {/* Step 4: Dividers will go here */}
      {/* <Divider my="xl" label="Styling Examples" /> */}

      {/* Step 5: StyledExample will go here */}
      {/* <StyledExample /> */}

      {/* Step 6: StylingUtilsExample will go here */}
      {/* <StylingUtilsExample themeStyle={themeStyle} /> */}

      {/* Step 7: DebugStylesExample will go here */}
      {/* <DebugStylesExample /> */}
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
