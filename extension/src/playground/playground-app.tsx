import { AppShell, Box, ScrollArea } from '@mantine/core';
import '@mantine/core/styles.css';
import { withThemeProvider } from '../styles/theme-provider';
import { IconPalette } from '@tabler/icons-preact';
import { AppHeader } from '../components/app-header/app-header';
import { ThemeStyleSwitcher } from './components/theme-style-switcher';
import './playground-app.scss';
import './playground.scss';
import { ComponentsShowcaseSection } from './sections/components-showcase';

function PlaygroundContainer() {

  return (
    <AppShell header={{ height: 80 }} padding={0}>
      <AppShell.Header>
        <Box className="tnk-playground-app__header-wrapper">
          <Box className="tnk-playground-app__header-content">
            <AppHeader
              title="Tanaka Design System"
              subtitle="Mantine & Tanaka components showcase"
              icon={<IconPalette size={32} />}
              actions={<ThemeStyleSwitcher />}
              variant="default"
              className="tnk-playground-header"
            />
          </Box>
        </Box>
      </AppShell.Header>

      <AppShell.Main>
        <ScrollArea h="calc(100vh - 80px)" p="xl">
          <ComponentsShowcaseSection />
        </ScrollArea>
      </AppShell.Main>
    </AppShell>
  );
}

export const PlaygroundApp = withThemeProvider(PlaygroundContainer);
