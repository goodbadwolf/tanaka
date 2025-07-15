import type { Permissions, Runtime, Tabs, Windows } from 'webextension-polyfill';
import type {
  IBrowser,
  IEventEmitter,
  ILocalStorage,
  IPermissions,
  IRuntime,
  ITabs,
  IWindows,
} from '../core';

// Mock event emitter that matches the interface
class MockEventEmitter<T extends unknown[]> implements IEventEmitter<T> {
  private listeners: ((...args: T) => void)[] = [];

  addListener(callback: (...args: T) => void): void {
    this.listeners.push(callback);
  }

  removeListener(callback: (...args: T) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  trigger(...args: T): void {
    for (const listener of this.listeners) {
      listener(...args);
    }
  }
}

/**
 * Mock browser implementation for webapp testing
 * Simulates Firefox API behavior with in-memory storage
 */
export class MockBrowser implements IBrowser {
  private mockTabs = new Map<number, Tabs.Tab>();
  private mockWindows = new Map<number, Windows.Window>();
  private mockStorage = new Map<string, unknown>();
  private tabIdCounter = 1;
  private windowIdCounter = 1;

  // Event emitters
  private tabCreatedEmitter = new MockEventEmitter<[tab: Tabs.Tab]>();
  private tabUpdatedEmitter = new MockEventEmitter<
    [tabId: number, changeInfo: Tabs.OnUpdatedChangeInfoType, tab: Tabs.Tab]
  >();
  private tabRemovedEmitter = new MockEventEmitter<
    [tabId: number, removeInfo: Tabs.OnRemovedRemoveInfoType]
  >();
  private tabMovedEmitter = new MockEventEmitter<
    [tabId: number, moveInfo: Tabs.OnMovedMoveInfoType]
  >();
  private windowRemovedEmitter = new MockEventEmitter<[windowId: number]>();
  private messageEmitter = new MockEventEmitter<
    [message: unknown, sender: Runtime.MessageSender, sendResponse: (response?: unknown) => void]
  >();

  constructor() {
    // Initialize with some mock data
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Create a mock window
    const windowId = this.windowIdCounter++;
    this.mockWindows.set(windowId, {
      id: windowId,
      focused: true,
      incognito: false,
      alwaysOnTop: false,
      tabs: [],
    } as Windows.Window);

    // Add some mock tabs
    this.addMockTab(windowId, 'https://github.com', 'GitHub');
    this.addMockTab(windowId, 'https://news.ycombinator.com', 'Hacker News');
    this.addMockTab(windowId, 'https://developer.mozilla.org', 'MDN Web Docs');
  }

  private addMockTab(windowId: number, url: string, title: string): number {
    const tabId = this.tabIdCounter++;
    const tab: Tabs.Tab = {
      id: tabId,
      windowId,
      url,
      title,
      active: this.mockTabs.size === 0,
      pinned: false,
      index: this.mockTabs.size,
      highlighted: false,
      incognito: false,
    } as Tabs.Tab;

    this.mockTabs.set(tabId, tab);

    const window = this.mockWindows.get(windowId);
    if (window) {
      window.tabs = window.tabs ?? [];
      window.tabs.push(tab);
    }

    return tabId;
  }

  // Tabs API
  tabs: ITabs = {
    query: async (queryInfo: Tabs.QueryQueryInfoType): Promise<Tabs.Tab[]> => {
      let tabs = Array.from(this.mockTabs.values());

      if (queryInfo.windowId !== undefined) {
        tabs = tabs.filter((t) => t.windowId === queryInfo.windowId);
      }
      if (queryInfo.active !== undefined) {
        tabs = tabs.filter((t) => t.active === queryInfo.active);
      }
      if (queryInfo.pinned !== undefined) {
        tabs = tabs.filter((t) => t.pinned === queryInfo.pinned);
      }
      if (queryInfo.currentWindow !== undefined && queryInfo.currentWindow) {
        // For mock, just return tabs from the first window
        const firstWindowId = Array.from(this.mockWindows.keys())[0];
        tabs = tabs.filter((t) => t.windowId === firstWindowId);
      }

      return tabs.map((t) => ({ ...t }));
    },

    create: async (createProperties: Tabs.CreateCreatePropertiesType): Promise<Tabs.Tab> => {
      const windowId = createProperties.windowId ?? Array.from(this.mockWindows.keys())[0];
      const tabId = this.addMockTab(windowId, createProperties.url ?? 'about:blank', 'New Tab');
      const tab = this.mockTabs.get(tabId);
      if (!tab) throw new Error(`Tab ${tabId} not found`);

      if (createProperties.active !== undefined) {
        tab.active = createProperties.active;
      }
      if (createProperties.pinned !== undefined) {
        tab.pinned = createProperties.pinned;
      }
      if (createProperties.index !== undefined) {
        tab.index = createProperties.index;
      }

      // Simulate tab created event
      setTimeout(() => {
        this.tabCreatedEmitter.trigger(tab);
      }, 10);

      return { ...tab };
    },

    remove: async (tabId: number): Promise<void> => {
      const tab = this.mockTabs.get(tabId);
      if (tab) {
        this.mockTabs.delete(tabId);

        // Remove from window
        const windowId = tab.windowId;
        if (windowId !== undefined) {
          const window = this.mockWindows.get(windowId);
          if (window?.tabs) {
            window.tabs = window.tabs.filter((t) => t.id !== tabId);
          }
        }

        // Simulate tab removed event
        setTimeout(() => {
          this.tabRemovedEmitter.trigger(tabId, {
            windowId: windowId ?? 0,
            isWindowClosing: false,
          });
        }, 10);
      }
    },

    update: async (
      tabId: number,
      updateProperties: Tabs.UpdateUpdatePropertiesType,
    ): Promise<Tabs.Tab> => {
      const tab = this.mockTabs.get(tabId);
      if (!tab) throw new Error(`Tab ${tabId} not found`);

      const changeInfo: Tabs.OnUpdatedChangeInfoType = {};

      if (updateProperties.url !== undefined) {
        changeInfo.url = updateProperties.url;
        tab.url = updateProperties.url;
      }
      if (updateProperties.active !== undefined) {
        tab.active = updateProperties.active;
      }
      if (updateProperties.pinned !== undefined) {
        changeInfo.pinned = updateProperties.pinned;
        tab.pinned = updateProperties.pinned;
      }

      // Simulate tab updated event
      setTimeout(() => {
        this.tabUpdatedEmitter.trigger(tabId, changeInfo, tab);
      }, 10);

      return { ...tab };
    },

    move: async (tabId: number, moveProperties: Tabs.MoveMovePropertiesType): Promise<Tabs.Tab> => {
      const tab = this.mockTabs.get(tabId);
      if (!tab) throw new Error(`Tab ${tabId} not found`);

      const fromIndex = tab.index;
      const toIndex = moveProperties.index;
      const toWindowId = moveProperties.windowId ?? tab.windowId;

      // Update tab properties
      tab.index = toIndex;
      if (moveProperties.windowId !== undefined) {
        tab.windowId = moveProperties.windowId;
      }

      // Simulate tab moved event
      setTimeout(() => {
        this.tabMovedEmitter.trigger(tabId, {
          windowId: toWindowId ?? tab.windowId ?? 0,
          fromIndex,
          toIndex,
        });
      }, 10);

      return { ...tab };
    },

    onCreated: this.tabCreatedEmitter,
    onRemoved: this.tabRemovedEmitter,
    onUpdated: this.tabUpdatedEmitter,
    onMoved: this.tabMovedEmitter,
  };

  // Windows API
  windows: IWindows = {
    getCurrent: async (): Promise<Windows.Window> => {
      const window = Array.from(this.mockWindows.values())[0];
      if (!window) throw new Error('No windows available');
      return { ...window };
    },

    getAll: async (): Promise<Windows.Window[]> => {
      return Array.from(this.mockWindows.values()).map((w) => ({ ...w }));
    },

    onRemoved: this.windowRemovedEmitter,
  };

  // Storage API
  localStorage: ILocalStorage = {
    get: async (keys?: string | string[] | null): Promise<Record<string, unknown>> => {
      if (!keys) {
        return Object.fromEntries(this.mockStorage);
      }

      const keyArray = Array.isArray(keys) ? keys : [keys];
      const result: Record<string, unknown> = {};

      for (const key of keyArray) {
        if (this.mockStorage.has(key)) {
          result[key] = this.mockStorage.get(key);
        }
      }

      return result;
    },

    set: async (items: Record<string, unknown>): Promise<void> => {
      for (const [key, value] of Object.entries(items)) {
        this.mockStorage.set(key, value);
      }
      console.info('[Mock] Storage set:', items);
    },

    remove: async (keys: string | string[]): Promise<void> => {
      const keyArray = Array.isArray(keys) ? keys : [keys];
      for (const key of keyArray) {
        this.mockStorage.delete(key);
      }
      console.info('[Mock] Storage removed:', keys);
    },

    clear: async (): Promise<void> => {
      this.mockStorage.clear();
      console.info('[Mock] Storage cleared');
    },
  };

  // Permissions API
  permissions: IPermissions = {
    contains: async (permissions: Permissions.Permissions): Promise<boolean> => {
      console.info('[Mock] Checking permissions:', permissions);
      // For mock, always return true unless explicitly testing permission denial
      return true;
    },

    getAll: async (): Promise<Permissions.AnyPermissions> => {
      console.info('[Mock] Getting all permissions');
      return {
        permissions: ['tabs', 'storage'],
        origins: [],
      };
    },

    request: async (permissions: Permissions.Permissions): Promise<boolean> => {
      console.info('[Mock] Requesting permissions:', permissions);
      // For mock, simulate user granting permissions
      return true;
    },

    remove: async (permissions: Permissions.Permissions): Promise<boolean> => {
      console.info('[Mock] Removing permissions:', permissions);
      return true;
    },

    onAdded: new MockEventEmitter<[permissions: Permissions.Permissions]>(),
    onRemoved: new MockEventEmitter<[permissions: Permissions.Permissions]>(),
  };

  // Runtime API
  runtime: IRuntime = {
    getManifest: () => {
      return {
        version: '0.5.0',
        name: 'Tanaka',
        description: 'Firefox extension for cross-device tab synchronization',
      };
    },

    openOptionsPage: async (): Promise<void> => {
      console.info('[Mock] Opening options page');
      window.open('/settings', '_blank');
    },

    sendMessage: async (message: unknown): Promise<unknown> => {
      console.info('[Mock] Message sent:', message);

      // Simulate async message handling
      return new Promise((resolve) => {
        setTimeout(() => {
          let responseReceived = false;
          const sendResponse = (response?: unknown) => {
            if (!responseReceived) {
              responseReceived = true;
              resolve(response);
            }
          };

          this.messageEmitter.trigger(
            message,
            {
              tab: undefined,
              id: 'mock-extension',
            } as Runtime.MessageSender,
            sendResponse,
          );

          // If no response after a timeout, resolve with undefined
          setTimeout(() => {
            if (!responseReceived) {
              resolve(undefined);
            }
          }, 100);
        }, 10);
      });
    },

    onMessage: this.messageEmitter,
  };
}
