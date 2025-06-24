import { render as preactRender } from '@testing-library/preact';
import { ComponentChildren } from 'preact';
import { DIProvider } from '../di/provider';
import { createTestContainer } from '../di/container';
import type { DependencyContainer } from 'tsyringe';
import type { IBrowser } from '../browser/core';
import { createMockBrowser } from '../browser/__mocks__';

interface RenderOptions {
  container?: DependencyContainer;
  mockBrowser?: IBrowser;
}

export function render(
  ui: ComponentChildren,
  { container, mockBrowser = createMockBrowser() }: RenderOptions = {},
) {
  const testContainer = container || createTestContainer();

  // Override browser with mock
  testContainer.register<IBrowser>('IBrowser', {
    useValue: mockBrowser,
  });

  return preactRender(<DIProvider container={testContainer}>{ui}</DIProvider>);
}

export * from '@testing-library/preact';
export { createMockBrowser } from '../browser/__mocks__';