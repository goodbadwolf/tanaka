import { jest } from '@jest/globals';

export const h = jest.fn();
export const render = jest.fn();
export const Fragment = ({ children }: { children?: unknown }) => children;
export const createContext = jest.fn(() => ({
  Provider: ({ children }: { children?: unknown }) => children,
  Consumer: ({ children }: { children?: unknown }) => children,
}));
export const cloneElement = jest.fn();
export const createRef = jest.fn(() => ({ current: null }));
export const Component = jest.fn();
export const isValidElement = jest.fn(() => true);
export const options = {};
