import { AppShell, Box, ScrollArea } from '@mantine/core';
import '@mantine/core/styles.css';
import { withThemeProvider } from '../styles/theme-provider';
import { PlaygroundHeader } from './components/playground-header';
import './playground-app.scss';
import './playground.scss';
import { ComponentsShowcaseSection } from './sections/components-showcase';

function PlaygroundContainer() {

  return (
    <AppShell header={{ height: 80 }} padding={0}>
      <AppShell.Header>
        <Box className="tnk-playground-app__header-wrapper">
          <Box className="tnk-playground-app__header-content">
            <PlaygroundHeader />
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
