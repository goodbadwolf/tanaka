import { AppShell, Box, Burger, ScrollArea, useMantineColorScheme } from '@mantine/core';
import '@mantine/core/styles.css';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import { withThemeProvider } from '../themes/theme-provider';
import { ComponentExample } from './components/ComponentExample';
import { PlaygroundHeader } from './components/PlaygroundHeader';
import { PlaygroundNav } from './components/PlaygroundNav';
import { PlaygroundSearch } from './components/PlaygroundSearch';
import { PlaygroundSection } from './components/PlaygroundSection';
import './playground.scss';
import { buttonsSection, inputsSection, selectionSection } from './sections';
import { ColorsSection } from './sections/colors';
import { OverviewSection } from './sections/overview';
import { SpacingSection } from './sections/spacing';
import { TypographySection } from './sections/typography';

function PlaygroundContainer() {
  const { colorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';
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
              ex.description?.toLowerCase().includes(searchQuery.toLowerCase())
          );
          return (
            <Box>
              {filtered.length === 0 ? (
                <Box ta="center" py="xl" c="dimmed">
                  No components found matching "{searchQuery}"
                </Box>
              ) : (
                <Box>
                  {filtered.map((example) => (
                    <Box key={example.id} mb="xl">
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
              <Box key={section.id} mb="xxl">
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
        <Box h="100%" style={{ display: 'flex', alignItems: 'center' }}>
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" ml="md" />
          <Box style={{ flex: 1 }}>
            <PlaygroundHeader />
          </Box>
        </Box>
      </AppShell.Header>

      <AppShell.Navbar
        p="md"
        style={{
          backgroundColor: dark ? '#1a1b1e' : '#f8f9fa',
          borderRight: `1px solid ${dark ? '#373A40' : '#dee2e6'}`,
        }}
      >
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
