/**
 * Mock implementation of the Browser API for testing.
 * This file should only be imported in test environments where Jest is available.
 */
/*
import type { IBrowser } from '../core';

export function createMockBrowser(): IBrowser {
  return {
    permissions: {
      contains: jest.fn().mockResolvedValue(true),
      getAll: jest.fn().mockResolvedValue({ permissions: [], origins: [] }),
      request: jest.fn().mockResolvedValue(true),
      remove: jest.fn().mockResolvedValue(true),
      onAdded: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
      onRemoved: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
    },
    tabs: {
      query: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({}),
      remove: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue({}),
      move: jest.fn().mockResolvedValue({}),
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
      getCurrent: jest.fn().mockResolvedValue({ id: 1 }),
      getAll: jest.fn().mockResolvedValue([]),
      onRemoved: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
    },
    localStorage: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
    },
    runtime: {
      getManifest: jest.fn().mockReturnValue({ version: '1.0.0' }),
      openOptionsPage: jest.fn().mockResolvedValue(undefined),
      sendMessage: jest.fn().mockResolvedValue(undefined),
      onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
    },
  };
}

export class MockBrowser implements IBrowser {
  private mockBrowser = createMockBrowser();

  public readonly permissions = this.mockBrowser.permissions;
  public readonly tabs = this.mockBrowser.tabs;
  public readonly windows = this.mockBrowser.windows;
  public readonly localStorage = this.mockBrowser.localStorage;
  public readonly runtime = this.mockBrowser.runtime;
}
*/
