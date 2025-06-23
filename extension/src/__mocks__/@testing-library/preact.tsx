import { jest } from '@jest/globals';

export const render = jest.fn(() => ({
  getByText: jest.fn(),
  getByTestId: jest.fn(),
  queryByText: jest.fn(),
  container: document.createElement('div'),
}));

export const waitFor = jest.fn(async (callback: () => void) => {
  await callback();
});

export const renderHook = jest.fn((hook: () => unknown) => {
  const result = { current: hook() };
  return { result };
});

export const act = jest.fn(async (callback: () => Promise<void>) => {
  await callback();
});
