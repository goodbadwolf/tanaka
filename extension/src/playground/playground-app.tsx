import { Container, Title, SegmentedControl, Group, Select, MantineColorScheme, Button, Text, Stack, Divider, Paper, Box, useComputedColorScheme, useMantineTheme } from '@mantine/core';
import { withAppTheme, useAppTheme, ThemeStyle } from '../themes';
import { debugStyles, GradientButton, getThemeAwareGradient, getDebugClassName, createDebugComponent, withDebug } from './utils/debug-utils';
import { StyledExample } from './styled-example';
import { StylingUtilsExample } from './styling-utils-example';

// Import our new SCSS
import './styles/playground.scss';

function PlaygroundContainer() {
  // Use the theme hook - no props needed!
  const { currentThemeSettings: themeSettings, setThemeSettings } = useAppTheme();

  return (
    <Container size="lg" className="playground-container">
      <Title order={1} className="playground-title">
        Tanaka UI Playground
      </Title>

      {/* Step 2: Theme switcher using a dropdown*/}
      <Group justify="center" className="theme-switcher-group">
        <Select
          value={themeSettings.style}
          onChange={(value) => setThemeSettings({ ...themeSettings, style: value as ThemeStyle })}
          data={[
            { label: 'V3 Theme', value: ThemeStyle.V3 },
            { label: 'Cyberpunk', value: ThemeStyle.CYBERPUNK },
          ]}
        />
        <SegmentedControl
          value={themeSettings.colorScheme}
          onChange={(value) => setThemeSettings({ ...themeSettings, colorScheme: value as MantineColorScheme })}
          data={[
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
          ]}
          className="theme-switcher"
        />
      </Group>

      <Divider my="xl" label="Styling Examples" />
      <StyledExample />

      <Divider my="xl" label="Styling Utilities" />
      <StylingUtilsExample themeStyle={themeSettings.style || ThemeStyle.V3} />

      <Divider my="xl" label="Debug Utilities" />
      <DebugExamples />
    </Container>
  );
}

// Debug Examples Component
function DebugExamples() {
  const colorScheme = useComputedColorScheme();
  const theme = useMantineTheme();

  // Create a custom debug button
  const CustomNeonButton = createDebugComponent(
    Button,
    'CustomNeonButton',
    {
      root: {
        background: 'linear-gradient(90deg, #00ff00 0%, #00ffff 100%)',
        color: '#000',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        border: '2px solid #00ff00',
        boxShadow: '0 0 20px rgba(0, 255, 0, 0.5)',
        '&:hover': {
          boxShadow: '0 0 30px rgba(0, 255, 0, 0.8)',
          transform: 'scale(1.05)',
        },
      },
    }
  );

  // Create a debug-wrapped component
  const DebugCard = withDebug(Paper);

  return (
    <Stack gap="xl">
      {/* Debug Class Names */}
      <Paper
        className={getDebugClassName('example-card', 'primary')}
        p="xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <Text size="lg" fw={600} mb="md">
          Debug Class Names
        </Text>
        <Text>
          This card has class: <code>{getDebugClassName('example-card', 'primary')}</code>
        </Text>
        <Text mt="sm">
          Without variant: <code>{getDebugClassName('example-card')}</code>
        </Text>
      </Paper>

      {/* Gradient Buttons */}
      <Paper p="xl" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
        <Text size="lg" fw={600} mb="md">
          Gradient Buttons
        </Text>
        <Group>
          <GradientButton onClick={() => console.log('Gradient clicked!')}>
            Pink Gradient
          </GradientButton>
          <GradientButton size="lg">Large Gradient</GradientButton>
          <CustomNeonButton onClick={() => console.log('Neon clicked!')}>
            Neon Green
          </CustomNeonButton>
        </Group>
        <Text mt="md" size="sm" opacity={0.7}>
          Inspect these buttons to see data-styled-component attributes
        </Text>
      </Paper>

      {/* Theme-aware Gradient */}
      <Paper
        p="xl"
        style={{
          background: getThemeAwareGradient(theme, colorScheme),
          transition: 'background 0.3s ease',
        }}
      >
        <Text size="lg" fw={600} mb="md">
          Theme-Aware Gradient
        </Text>
        <Text>
          This background changes based on {colorScheme} mode
        </Text>
      </Paper>

      {/* Debug Styles */}
      <Paper p="xl" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
        <Text size="lg" fw={600} mb="md">
          Debug Style Utilities
        </Text>
        <Group grow>
          <Box p="md" style={debugStyles.outline()}>Outline</Box>
          <Box p="md" style={debugStyles.outline('#00ff00')}>Green Outline</Box>
          <Box p="md" style={debugStyles.background()}>Debug Background</Box>
          <Box p="md" style={debugStyles.grid()}>Grid Overlay</Box>
        </Group>
        <Box mt="lg" style={debugStyles.spacing(20, 10)}>
          <Text>Spacing visualization (20px padding, 10px margin)</Text>
        </Box>
      </Paper>

      {/* Debug Wrapper */}
      <Paper p="xl" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
        <Text size="lg" fw={600} mb="md">
          Debug Wrapper HOC
        </Text>
        <Stack gap="md">
          <DebugCard p="md" debug={false}>
            <Text>Normal card (debug=false)</Text>
          </DebugCard>
          <DebugCard p="md" debug={true}>
            <Text>Wrapped with debug boundaries (debug=true)</Text>
          </DebugCard>
        </Stack>
      </Paper>

      {/* DevTools Tip */}
      <Paper
        p="xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px dashed rgba(255, 255, 255, 0.3)',
        }}
      >
        <Text size="lg" fw={600} mb="md">💡 DevTools Tips</Text>
        <Box component="ul">
          <li>Inspect elements to see generated class names</li>
          <li>Look for data-styled-component attributes</li>
          <li>Check data-debug-wrapper on wrapped components</li>
          <li>View displayName in React DevTools</li>
        </Box>
      </Paper>
    </Stack>
  );
}

export const PlaygroundApp = withAppTheme(PlaygroundContainer);
