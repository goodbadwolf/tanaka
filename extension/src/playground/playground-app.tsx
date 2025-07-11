import { AppShell, Box, Burger, ScrollArea } from '@mantine/core';
import '@mantine/core/styles.css';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import { withThemeProvider } from '../themes/theme-provider';
import { ComponentExample } from './components/component-example';
import { PlaygroundHeader } from './components/playground-header';
import { PlaygroundNav } from './components/playground-nav';
import { PlaygroundSearch } from './components/playground-search';
import { PlaygroundSection } from './components/playground-section';
import './playground-app.scss';
import './playground.scss';
import { buttonsSection, inputsSection, selectionSection } from './sections';
import { ColorsSection } from './sections/colors';
import { OverviewSection } from './sections/overview';
import { SpacingSection } from './sections/spacing';
import { TanakaComponentsSection } from './sections/tanaka-components';
import { TypographySection } from './sections/typography';

function PlaygroundContainer() {
  const [opened, { toggle }] = useDisclosure();
  const [activeSection, setActiveSection] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection />;
      case 'colors':
        return <ColorsSection />;
      case 'typography':
        return <TypographySection />;
      case 'spacing':
        return <SpacingSection />;
      case 'tanaka-components':
        return <TanakaComponentsSection />;
      case 'components':
        // Component showcase with search
        if (searchQuery) {
          const allExamples = [
            ...buttonsSection.examples,
            ...inputsSection.examples,
            ...selectionSection.examples,
          ];
          const filtered = allExamples.filter(
            (ex) =>
              ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              ex.description?.toLowerCase().includes(searchQuery.toLowerCase()),
          );
          return (
            <Box>
              {filtered.length === 0 ? (
                <Box className="tnk-playground-app__empty-state">
                  No components found matching "{searchQuery}"
                </Box>
              ) : (
                <Box>
                  {filtered.map((example) => (
                    <Box key={example.id} className="tnk-playground-app__component-wrapper">
                      <ComponentExample example={example} />
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          );
        }
        // All components
        return (
          <Box>
            {[buttonsSection, inputsSection, selectionSection].map((section) => (
              <Box key={section.id} className="tnk-playground-app__section-wrapper">
                <PlaygroundSection section={section} />
              </Box>
            ))}
          </Box>
        );
      case 'forms':
        return <PlaygroundSection section={inputsSection} />;
      case 'layout':
        // TODO: Add layout components section
        return <Box>Layout components coming soon...</Box>;
      case 'patterns':
        // TODO: Add common patterns section
        return <Box>Common patterns coming soon...</Box>;
      default:
        return <OverviewSection />;
    }
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
        <AppShell.Section>
          {activeSection === 'components' && (
            <Box mb="md">
              <PlaygroundSearch value={searchQuery} onChange={setSearchQuery} />
            </Box>
          )}
        </AppShell.Section>
        <AppShell.Section grow component={ScrollArea}>
          <PlaygroundNav activeSection={activeSection} onSectionChange={setActiveSection} />
        </AppShell.Section>
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
