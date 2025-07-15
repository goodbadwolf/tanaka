import 'reflect-metadata';
import '@testing-library/jest-dom';

// Mock crypto.randomUUID for ExtensionError
global.crypto = {
  ...global.crypto,
  randomUUID: jest.fn(() => `test-uuid-${Date.now()}`),
} as Crypto;

// Mock Web Worker for tests
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  addEventListener: jest.Mock;

  constructor() {
    this.addEventListener = jest.fn((event: string, handler: (event: Event) => void) => {
      if (event === 'message') {
        this.onmessage = handler as (event: MessageEvent) => void;
      } else if (event === 'error') {
        this.onerror = handler as (event: ErrorEvent) => void;
      }
    });
  }

  postMessage(message: unknown): void {
    // Simulate async worker response
    setTimeout(() => {
      if (this.onmessage) {
        // Create a proper response based on the message type
        const response = {
          id: message.id,
          success: true,
          data: this.mockWorkerResponse(message),
        };
        this.onmessage(new MessageEvent('message', { data: response }));
      }
    }, 0);
  }

  private mockWorkerResponse(message: { type: string; payload?: unknown }): unknown {
    switch (message.type) {
      case 'queue':
        return undefined;
      case 'deduplicate':
        return { operations: message.payload || [] };
      case 'apply':
        return undefined;
      case 'getState':
        return {
          queueLength: 0,
          lamportClock: '0',
          deviceId: 'test-device-id',
        };
      default:
        return undefined;
    }
  }

  terminate(): void {
    // No-op
  }
}

(global as unknown as Record<string, unknown>).Worker = MockWorker;

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
