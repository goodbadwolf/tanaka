import 'reflect-metadata';
import '@testing-library/jest-dom';

// Mock crypto.randomUUID for ExtensionError
global.crypto = {
  ...global.crypto,
  randomUUID: jest.fn(() => `test-uuid-${Date.now()}`),
} as Crypto;

// Mock browser APIs for all tests
jest.mock('webextension-polyfill', () => ({
  tabs: {
    query: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    move: jest.fn(),
    onCreated: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onRemoved: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onUpdated: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onMoved: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  windows: {
    getCurrent: jest.fn(),
    getAll: jest.fn(),
    onRemoved: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
  },
  runtime: {
    getManifest: jest.fn(() => ({ version: '1.0.0' })),
    openOptionsPage: jest.fn(),
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
}));
