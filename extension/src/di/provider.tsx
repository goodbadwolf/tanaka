import { createContext, ComponentChildren } from 'preact';
import { useContext } from 'preact/hooks';
import { container as defaultContainer } from './container';
import type { DependencyContainer } from 'tsyringe';

const DIContext = createContext<DependencyContainer>(defaultContainer);

export interface DIProviderProps {
  container?: DependencyContainer;
  children: ComponentChildren;
}

export function DIProvider({ container = defaultContainer, children }: DIProviderProps) {
  return <DIContext.Provider value={container}>{children}</DIContext.Provider>;
}

export function useDI(): DependencyContainer {
  const container = useContext(DIContext);
  if (!container) {
    throw new Error('useDI must be used within a DIProvider');
  }
  return container;
}

export function useService<T>(token: any): T {
  const container = useDI();
  return container.resolve<T>(token);
}
