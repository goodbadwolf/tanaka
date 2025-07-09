import { Box, Button, Paper, Text, Stack, Group, Title } from '@mantine/core';
import { useComputedColorScheme, useMantineTheme } from '@mantine/core';
import { debugStyles, GradientButton, getThemeAwareGradient } from './utils/debug-styles';

export function DebugStylesExample() {
  const colorScheme = useComputedColorScheme();
  const theme = useMantineTheme();

  return (
    <Stack gap="xl">
      <Title order={2} c="white">Debug Styles Utilities Demo</Title>

      {/* Example 1: Using getClassName */}
      <Paper
        className={debugStyles.getClassName('example-card', 'primary')}
        p="xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <Text size="lg" fw={600} c="white" mb="md">
          Using getClassName Utility
        </Text>
        <Text c="white">
          This card has class: <code>{debugStyles.getClassName('example-card', 'primary')}</code>
        </Text>
        <Text c="white" mt="sm">
          Without variant: <code>{debugStyles.getClassName('example-card')}</code>
        </Text>
      </Paper>

      {/* Example 2: GradientButton */}
      <Paper
        p="xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
        }}
      >
        <Text size="lg" fw={600} c="white" mb="md">
          GradientButton Component
        </Text>
        <Group>
          <GradientButton onClick={() => console.log('GradientButton clicked!')}>
            Pink Gradient Button
          </GradientButton>
          <GradientButton size="lg">
            Large Gradient Button
          </GradientButton>
          <GradientButton size="sm">
            Small Button
          </GradientButton>
        </Group>
        <Text c="white" mt="md" size="sm">
          Note the data-styled-component="GradientButton" attribute in DevTools
        </Text>
      </Paper>

      {/* Example 3: Theme-aware gradient */}
      <Paper
        p="xl"
        style={{
          background: getThemeAwareGradient(theme, colorScheme),
          transition: 'background 0.3s ease',
        }}
      >
        <Text size="lg" fw={600} mb="md">
          Theme-Aware Gradient Background
        </Text>
        <Text>
          This background changes based on light/dark theme. Current: {colorScheme}
        </Text>
      </Paper>

      {/* Example 4: Custom styled component */}
      <Paper
        p="xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
        }}
      >
        <Text size="lg" fw={600} c="white" mb="md">
          Creating Custom Styled Components
        </Text>
        <Group>
          {/* Create a custom button on the fly */}
          {(() => {
            const CustomButton = debugStyles.createStyledComponent(
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

            return (
              <CustomButton onClick={() => console.log('Custom button clicked!')}>
                Neon Green Button
              </CustomButton>
            );
          })()}
        </Group>
      </Paper>

      {/* Example 5: Multiple variants with getClassName */}
      <Group grow>
        {['primary', 'secondary', 'danger', 'success'].map((variant) => (
          <Paper
            key={variant}
            className={debugStyles.getClassName('status-card', variant)}
            p="md"
            style={{
              background:
                variant === 'primary' ? 'rgba(99, 102, 241, 0.2)' :
                variant === 'secondary' ? 'rgba(139, 92, 246, 0.2)' :
                variant === 'danger' ? 'rgba(239, 68, 68, 0.2)' :
                'rgba(34, 197, 94, 0.2)',
              border: `1px solid ${
                variant === 'primary' ? 'rgba(99, 102, 241, 0.5)' :
                variant === 'secondary' ? 'rgba(139, 92, 246, 0.5)' :
                variant === 'danger' ? 'rgba(239, 68, 68, 0.5)' :
                'rgba(34, 197, 94, 0.5)'
              }`,
            }}
          >
            <Text c="white" ta="center" fw={600}>
              {variant.charAt(0).toUpperCase() + variant.slice(1)}
            </Text>
            <Text c="white" ta="center" size="xs" mt="xs">
              {debugStyles.getClassName('status-card', variant)}
            </Text>
          </Paper>
        ))}
      </Group>

      {/* DevTools tip */}
      <Paper
        p="xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px dashed rgba(255, 255, 255, 0.3)',
        }}
      >
        <Text size="lg" fw={600} c="white" mb="md">
          💡 DevTools Tip
        </Text>
        <Text c="white">
          Open your browser DevTools and inspect these components to see:
        </Text>
        <Box component="ul" c="white" mt="sm">
          <li>Class names generated by <code>getClassName()</code></li>
          <li><code>data-styled-component</code> attributes on styled components</li>
          <li>The <code>displayName</code> property in React DevTools</li>
        </Box>
      </Paper>
    </Stack>
  );
}
