import { jest } from '@jest/globals';

export const render = jest.fn();
export const hydrate = jest.fn();
export const createPortal = jest.fn();
export const createContext = jest.fn(() => ({
  Provider: ({ children }: { children?: unknown }) => children,
  Consumer: ({ children }: { children?: unknown }) => children,
}));
export const forwardRef = jest.fn((component: unknown) => component);
export const memo = jest.fn((component: unknown) => component);
export const Fragment = ({ children }: { children?: unknown }) => children;

// Re-export hooks
export * from './hooks';
