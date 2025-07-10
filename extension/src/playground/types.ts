import { ReactNode } from 'react';

export interface ComponentExample {
  id: string;
  title: string;
  description?: string;
  component: ReactNode;
  code?: string;
  props?: Record<string, unknown>;
}

export interface PlaygroundSection {
  id: string;
  title: string;
  icon: ReactNode;
  description?: string;
  examples: ComponentExample[];
}

export interface PlaygroundConfig {
  sections: PlaygroundSection[];
}

export interface PlaygroundState {
  searchQuery: string;
  expandedSections: string[];
  selectedExample: string | null;
  showCode: boolean;
  compactMode: boolean;
}
