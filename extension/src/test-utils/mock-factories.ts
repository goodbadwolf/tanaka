import { jest } from '@jest/globals';
import type { TanakaAPI } from '../api/api';
import type {
  WindowTracker,
  SyncManager,
  TabEventHandler,
  MessageHandler,
  UserSettingsManager,
} from '../sync';
import type { Browser } from 'webextension-polyfill';

export function createMockTanakaAPI(): jest.Mocked<TanakaAPI> {
  const mock = {
    setAuthToken: jest.fn(),
    syncTabs: jest.fn(),
    checkHealth: jest.fn(),
  } as unknown as jest.Mocked<TanakaAPI>;

  mock.syncTabs.mockResolvedValue([]);
  mock.checkHealth.mockResolvedValue(true);

  return mock;
}

export function createMockWindowTracker(): jest.Mocked<WindowTracker> {
  const mock = {
    track: jest.fn(),
    untrack: jest.fn(),
    isTracked: jest.fn(),
    getTrackedWindows: jest.fn(),
    getTrackedCount: jest.fn(),
    clear: jest.fn(),
  } as unknown as jest.Mocked<WindowTracker>;

  mock.getTrackedWindows.mockReturnValue([]);
  mock.getTrackedCount.mockReturnValue(0);

  return mock;
}

export function createMockSyncManager(): jest.Mocked<SyncManager> {
  const mock = {
    syncNow: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    isRunning: jest.fn(),
  } as unknown as jest.Mocked<SyncManager>;

  mock.syncNow.mockResolvedValue(undefined);
  mock.isRunning.mockReturnValue(false);

  return mock;
}

export function createMockTabEventHandler(): jest.Mocked<TabEventHandler> {
  const mock = {
    setupListeners: jest.fn(),
  } as unknown as jest.Mocked<TabEventHandler>;

  return mock;
}

export function createMockMessageHandler(): jest.Mocked<MessageHandler> {
  const mock = {
    handleMessage: jest.fn(),
  } as unknown as jest.Mocked<MessageHandler>;

  mock.handleMessage.mockResolvedValue({ success: true });

  return mock;
}

export function createMockUserSettingsManager(): jest.Mocked<UserSettingsManager> {
  const mock = {
    load: jest.fn(),
    save: jest.fn(),
    clear: jest.fn(),
  } as unknown as jest.Mocked<UserSettingsManager>;

  mock.load.mockResolvedValue({
    authToken: 'test-token',
    syncInterval: 5000,
  });
  mock.save.mockResolvedValue(undefined);
  mock.clear.mockResolvedValue(undefined);

  return mock;
}

export function createMockBrowserRuntime() {
  const messageListeners: ((message: unknown) => Promise<unknown>)[] = [];

  return {
    onMessage: {
      addListener: jest.fn((listener: (message: unknown) => Promise<unknown>) => {
        messageListeners.push(listener);
      }),
      removeListener: jest.fn((listener: (message: unknown) => Promise<unknown>) => {
        const index = messageListeners.indexOf(listener);
        if (index > -1) {
          messageListeners.splice(index, 1);
        }
      }),
    },
    sendMessage: jest.fn(),
    getMessageListeners: () => messageListeners,
  };
}

export function createMockBrowserTabs() {
  const mock = {
    query: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    move: jest.fn(),
    onCreated: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onUpdated: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onRemoved: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onMoved: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onActivated: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mock.query as any).mockResolvedValue([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mock.create as any).mockResolvedValue({ id: 1 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mock.update as any).mockResolvedValue({ id: 1 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mock.remove as any).mockResolvedValue(undefined);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mock.move as any).mockResolvedValue({ id: 1 });

  return mock;
}

export function createMockBrowserWindows() {
  const mock = {
    getAll: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    onCreated: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onRemoved: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mock.getAll as any).mockResolvedValue([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mock.get as any).mockResolvedValue({ id: 1 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mock.create as any).mockResolvedValue({ id: 1 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mock.remove as any).mockResolvedValue(undefined);

  return mock;
}

export function createMockBrowserStorage() {
  const storage = new Map<string, unknown>();

  return {
    local: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      get: (jest.fn() as any).mockImplementation((keys?: string | string[] | null) => {
        if (!keys) {
          return Promise.resolve(Object.fromEntries(storage));
        }
        if (typeof keys === 'string') {
          return Promise.resolve({ [keys]: storage.get(keys) });
        }
        if (Array.isArray(keys)) {
          const result: Record<string, unknown> = {};
          keys.forEach((key) => {
            if (storage.has(key)) {
              result[key] = storage.get(key);
            }
          });
          return Promise.resolve(result);
        }
        return Promise.resolve({});
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      set: (jest.fn() as any).mockImplementation((items: Record<string, unknown>) => {
        Object.entries(items).forEach(([key, value]) => {
          storage.set(key, value);
        });
        return Promise.resolve();
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      clear: (jest.fn() as any).mockImplementation(() => {
        storage.clear();
        return Promise.resolve();
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      remove: (jest.fn() as any).mockImplementation((keys: string | string[]) => {
        if (typeof keys === 'string') {
          storage.delete(keys);
        } else {
          keys.forEach((key) => storage.delete(key));
        }
        return Promise.resolve();
      }),
    },
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  };
}

export function createMockBrowser(): Partial<Browser> {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    runtime: createMockBrowserRuntime() as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tabs: createMockBrowserTabs() as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    windows: createMockBrowserWindows() as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    storage: createMockBrowserStorage() as any,
  };
}
