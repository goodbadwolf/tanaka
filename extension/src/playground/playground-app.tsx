import { AppShell, Box, Burger, ScrollArea } from '@mantine/core';
import '@mantine/core/styles.css';
import { useDisclosure } from '@mantine/hooks';
import { useHashRouter } from '../hooks/use-hash-router';
import { withThemeProvider } from '../styles/theme-provider';
import { PlaygroundHeader } from './components/playground-header';
import { PlaygroundNav } from './components/playground-nav';
import './playground-app.scss';
import './playground.scss';
import { ColorsSection } from './sections/colors';
import { FormsSection, LayoutSection, PatternsSection } from './sections/coming-soon';
import { ComponentsShowcase } from './sections/components-showcase';
import { OverviewSection } from './sections/overview';
import { SpacingSection } from './sections/spacing';
import { TanakaComponentsSection } from './sections/tanaka-components';
import { TypographySection } from './sections/typography';

function PlaygroundContainer() {
  const [opened, { toggle }] = useDisclosure();
  const router = useHashRouter({
    defaultRoute: 'overview',
    routes: {
      overview: OverviewSection,
      colors: ColorsSection,
      typography: TypographySection,
      spacing: SpacingSection,
      tanaka: TanakaComponentsSection,
      components: ComponentsShowcase,
      forms: FormsSection,
      layout: LayoutSection,
      patterns: PatternsSection,
    },
  });

  const renderSection = () => {
    return router.Component ? <router.Component /> : <OverviewSection />;
  };

  return (
    <AppShell
      header={{ height: 80 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding={0}
    >
      <AppShell.Header>
        <Box className="tnk-playground-app__header-wrapper">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" ml="md" />
          <Box className="tnk-playground-app__header-content">
            <PlaygroundHeader />
          </Box>
        </Box>
      </AppShell.Header>

      <AppShell.Navbar p="md" className="tnk-playground-app__navbar">
        <ScrollArea h="100%">
          <PlaygroundNav
            activeSection={String(router.currentRoute)}
            onSectionChange={router.navigate}
          />
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>
        <ScrollArea h="calc(100vh - 80px)" p="xl">
          {renderSection()}
        </ScrollArea>
      </AppShell.Main>
    </AppShell>
  );
}

export const PlaygroundApp = withThemeProvider(PlaygroundContainer);
