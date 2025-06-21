import { jest } from '@jest/globals';

export const jsx = jest.fn((type: unknown, props: unknown) => ({ type, props }));
export const jsxs = jest.fn((type: unknown, props: unknown) => ({ type, props }));
export const jsxDEV = jest.fn((type: unknown, props: unknown) => ({ type, props }));
export const Fragment = ({ children }: { children?: unknown }) => children;
