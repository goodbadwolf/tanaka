import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock webextension-polyfill before imports
jest.mock('webextension-polyfill');

import browser from 'webextension-polyfill';
import { TabEventHandler } from '../tab-event-handler';
import type { WindowTracker } from '../window-tracker';
import type { SyncManager } from '../sync-manager';

describe('TabEventHandler', () => {
  let tabEventHandler: TabEventHandler;
  let mockWindowTracker: jest.Mocked<WindowTracker>;
  let mockSyncManager: jest.Mocked<SyncManager>;
  let consoleLogSpy: ReturnType<typeof jest.spyOn>;

  // Event listeners
  let onTabCreatedListener: (tab: browser.Tabs.Tab) => Promise<void>;
  let onTabRemovedListener: (tabId: number, removeInfo: browser.Tabs.OnRemovedRemoveInfoType) => Promise<void>;
  let onTabUpdatedListener: (
    tabId: number,
    changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
    tab: browser.Tabs.Tab
  ) => Promise<void>;
  let onTabMovedListener: (tabId: number, moveInfo: browser.Tabs.OnMovedMoveInfoType) => Promise<void>;
  let onWindowRemovedListener: (windowId: number) => Promise<void>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup console spy
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    // Mock browser event listeners
    const mockBrowser = browser as any;
    mockBrowser.tabs = {
      onCreated: {
        addListener: jest.fn((listener: any) => {
          onTabCreatedListener = listener;
        }),
      },
      onRemoved: {
        addListener: jest.fn((listener: any) => {
          onTabRemovedListener = listener;
        }),
      },
      onUpdated: {
        addListener: jest.fn((listener: any) => {
          onTabUpdatedListener = listener;
        }),
      },
      onMoved: {
        addListener: jest.fn((listener: any) => {
          onTabMovedListener = listener;
        }),
      },
    };
    mockBrowser.windows = {
      onRemoved: {
        addListener: jest.fn((listener: any) => {
          onWindowRemovedListener = listener;
        }),
      },
    };

    // Mock WindowTracker
    mockWindowTracker = {
      track: jest.fn(),
      untrack: jest.fn(),
      getTrackedWindows: jest.fn(),
      getTrackedCount: jest.fn(),
      isTracked: jest.fn(),
      clear: jest.fn(),
    } as unknown as jest.Mocked<WindowTracker>;

    // Mock SyncManager
    mockSyncManager = {
      start: jest.fn(),
      stop: jest.fn(),
      syncNow: jest.fn().mockResolvedValue(undefined),
      isRunning: jest.fn(),
    } as unknown as jest.Mocked<SyncManager>;

    tabEventHandler = new TabEventHandler(mockWindowTracker, mockSyncManager);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('setupListeners', () => {
    it('should register all event listeners', () => {
      tabEventHandler.setupListeners();

      expect(browser.tabs.onCreated.addListener).toHaveBeenCalled();
      expect(browser.tabs.onRemoved.addListener).toHaveBeenCalled();
      expect(browser.tabs.onUpdated.addListener).toHaveBeenCalled();
      expect(browser.tabs.onMoved.addListener).toHaveBeenCalled();
      expect(browser.windows.onRemoved.addListener).toHaveBeenCalled();
    });
  });

  describe('tab events', () => {
    beforeEach(() => {
      tabEventHandler.setupListeners();
    });

    describe('onCreated', () => {
      it('should sync when tab is created in tracked window', async () => {
        mockWindowTracker.isTracked.mockReturnValue(true);
        const tab = { id: 1, windowId: 123, url: 'https://example.com' } as browser.Tabs.Tab;

        await onTabCreatedListener(tab);

        expect(mockWindowTracker.isTracked).toHaveBeenCalledWith(123);
        expect(consoleLogSpy).toHaveBeenCalledWith('Tab created:', tab);
        expect(mockSyncManager.syncNow).toHaveBeenCalled();
      });

      it('should not sync when tab is created in untracked window', async () => {
        mockWindowTracker.isTracked.mockReturnValue(false);
        const tab = { id: 1, windowId: 123, url: 'https://example.com' } as browser.Tabs.Tab;

        await onTabCreatedListener(tab);

        expect(mockWindowTracker.isTracked).toHaveBeenCalledWith(123);
        expect(mockSyncManager.syncNow).not.toHaveBeenCalled();
      });

      it('should handle tabs without windowId', async () => {
        const tab = { id: 1, url: 'https://example.com' } as browser.Tabs.Tab;

        await onTabCreatedListener(tab);

        expect(mockWindowTracker.isTracked).not.toHaveBeenCalled();
        expect(mockSyncManager.syncNow).not.toHaveBeenCalled();
      });
    });

    describe('onRemoved', () => {
      it('should sync when tab is removed from tracked window', async () => {
        mockWindowTracker.isTracked.mockReturnValue(true);
        const removeInfo = { windowId: 123, isWindowClosing: false };

        await onTabRemovedListener(1, removeInfo);

        expect(mockWindowTracker.isTracked).toHaveBeenCalledWith(123);
        expect(consoleLogSpy).toHaveBeenCalledWith('Tab removed:', 1);
        expect(mockSyncManager.syncNow).toHaveBeenCalled();
      });

      it('should not sync when tab is removed from untracked window', async () => {
        mockWindowTracker.isTracked.mockReturnValue(false);
        const removeInfo = { windowId: 123, isWindowClosing: false };

        await onTabRemovedListener(1, removeInfo);

        expect(mockWindowTracker.isTracked).toHaveBeenCalledWith(123);
        expect(mockSyncManager.syncNow).not.toHaveBeenCalled();
      });
    });

    describe('onUpdated', () => {
      it('should sync when URL changes in tracked window', async () => {
        mockWindowTracker.isTracked.mockReturnValue(true);
        const changeInfo = { url: 'https://newurl.com' };
        const tab = { id: 1, windowId: 123 } as browser.Tabs.Tab;

        await onTabUpdatedListener(1, changeInfo, tab);

        expect(mockWindowTracker.isTracked).toHaveBeenCalledWith(123);
        expect(consoleLogSpy).toHaveBeenCalledWith('Tab updated:', 1, changeInfo);
        expect(mockSyncManager.syncNow).toHaveBeenCalled();
      });

      it('should not sync when non-URL property changes', async () => {
        mockWindowTracker.isTracked.mockReturnValue(true);
        const changeInfo = { title: 'New Title' };
        const tab = { id: 1, windowId: 123 } as browser.Tabs.Tab;

        await onTabUpdatedListener(1, changeInfo, tab);

        expect(mockSyncManager.syncNow).not.toHaveBeenCalled();
      });

      it('should not sync when URL changes in untracked window', async () => {
        mockWindowTracker.isTracked.mockReturnValue(false);
        const changeInfo = { url: 'https://newurl.com' };
        const tab = { id: 1, windowId: 123 } as browser.Tabs.Tab;

        await onTabUpdatedListener(1, changeInfo, tab);

        expect(mockSyncManager.syncNow).not.toHaveBeenCalled();
      });
    });

    describe('onMoved', () => {
      it('should sync when tab is moved in tracked window', async () => {
        mockWindowTracker.isTracked.mockReturnValue(true);
        const moveInfo = { windowId: 123, fromIndex: 0, toIndex: 2 };

        await onTabMovedListener(1, moveInfo);

        expect(mockWindowTracker.isTracked).toHaveBeenCalledWith(123);
        expect(consoleLogSpy).toHaveBeenCalledWith('Tab moved:', 1, moveInfo);
        expect(mockSyncManager.syncNow).toHaveBeenCalled();
      });

      it('should not sync when tab is moved in untracked window', async () => {
        mockWindowTracker.isTracked.mockReturnValue(false);
        const moveInfo = { windowId: 123, fromIndex: 0, toIndex: 2 };

        await onTabMovedListener(1, moveInfo);

        expect(mockSyncManager.syncNow).not.toHaveBeenCalled();
      });
    });

    describe('onWindowRemoved', () => {
      it('should untrack and sync when tracked window is removed with other windows', async () => {
        mockWindowTracker.isTracked.mockReturnValue(true);
        mockWindowTracker.getTrackedCount.mockReturnValue(1);

        await onWindowRemovedListener(123);

        expect(mockWindowTracker.isTracked).toHaveBeenCalledWith(123);
        expect(mockWindowTracker.untrack).toHaveBeenCalledWith(123);
        expect(consoleLogSpy).toHaveBeenCalledWith('Tracked window removed:', 123);
        expect(mockSyncManager.syncNow).toHaveBeenCalled();
        expect(mockSyncManager.stop).not.toHaveBeenCalled();
      });

      it('should stop sync when last tracked window is removed', async () => {
        mockWindowTracker.isTracked.mockReturnValue(true);
        mockWindowTracker.getTrackedCount.mockReturnValue(0);

        await onWindowRemovedListener(123);

        expect(mockWindowTracker.untrack).toHaveBeenCalledWith(123);
        expect(mockSyncManager.stop).toHaveBeenCalled();
        expect(mockSyncManager.syncNow).not.toHaveBeenCalled();
      });

      it('should not sync when untracked window is removed', async () => {
        mockWindowTracker.isTracked.mockReturnValue(false);

        await onWindowRemovedListener(123);

        expect(mockWindowTracker.untrack).not.toHaveBeenCalled();
        expect(mockSyncManager.syncNow).not.toHaveBeenCalled();
        expect(mockSyncManager.stop).not.toHaveBeenCalled();
      });
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      tabEventHandler.setupListeners();
    });

    it('should handle sync errors in tab created', async () => {
      mockWindowTracker.isTracked.mockReturnValue(true);
      mockSyncManager.syncNow.mockRejectedValue(new Error('Sync error'));
      const tab = { id: 1, windowId: 123 } as browser.Tabs.Tab;

      await expect(onTabCreatedListener(tab)).rejects.toThrow('Sync error');
    });

    it('should handle sync errors in tab removed', async () => {
      mockWindowTracker.isTracked.mockReturnValue(true);
      mockSyncManager.syncNow.mockRejectedValue(new Error('Sync error'));
      const removeInfo = { windowId: 123, isWindowClosing: false };

      await expect(onTabRemovedListener(1, removeInfo)).rejects.toThrow('Sync error');
    });
  });
});