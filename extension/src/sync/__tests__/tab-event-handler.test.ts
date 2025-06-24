import 'reflect-metadata';
import { createTestContainer } from '../../test/test-container';
import { TabEventHandler } from '../tab-event-handler';
import { WindowTracker } from '../window-tracker';
import { SyncManager } from '../sync-manager';
import { createMockBrowser } from '../../browser/__mocks__';
import type {
  IBrowser,
  Tab,
  OnRemovedRemoveInfoType,
  OnUpdatedChangeInfoType,
  OnMovedMoveInfoType,
} from '../../browser/core';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

jest.mock('../window-tracker');
jest.mock('../sync-manager');

describe('TabEventHandler', () => {
  let tabEventHandler: TabEventHandler;
  let mockBrowser: IBrowser;
  let mockWindowTracker: WindowTracker;
  let mockSyncManager: SyncManager;
  let testContainer: ReturnType<typeof createTestContainer>;

  beforeEach(() => {
    testContainer = createTestContainer();
    mockBrowser = createMockBrowser();

    testContainer.register<IBrowser>('IBrowser', {
      useValue: mockBrowser,
    });

    mockWindowTracker = {
      isTracked: jest.fn(),
      untrack: jest.fn(),
      getTrackedCount: jest.fn(),
      track: jest.fn(),
      getTrackedWindows: jest.fn(),
    } as unknown as WindowTracker;

    mockSyncManager = {
      syncNow: jest.fn(),
      stop: jest.fn(),
      start: jest.fn(),
      restart: jest.fn(),
      isRunning: jest.fn(),
    } as unknown as SyncManager;

    testContainer.registerInstance(WindowTracker, mockWindowTracker);
    testContainer.registerInstance(SyncManager, mockSyncManager);

    tabEventHandler = testContainer.resolve(TabEventHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setupListeners', () => {
    it('registers all event listeners', () => {
      tabEventHandler.setupListeners();

      expect(mockBrowser.tabs.onCreated.addListener).toHaveBeenCalledTimes(1);
      expect(mockBrowser.tabs.onRemoved.addListener).toHaveBeenCalledTimes(1);
      expect(mockBrowser.tabs.onUpdated.addListener).toHaveBeenCalledTimes(1);
      expect(mockBrowser.tabs.onMoved.addListener).toHaveBeenCalledTimes(1);
      expect(mockBrowser.windows.onRemoved.addListener).toHaveBeenCalledTimes(1);
    });

    it('binds instance methods as event handlers', () => {
      tabEventHandler.setupListeners();

      const tabCreatedHandler = (mockBrowser.tabs.onCreated.addListener as jest.Mock).mock
        .calls[0][0];
      const tabRemovedHandler = (mockBrowser.tabs.onRemoved.addListener as jest.Mock).mock
        .calls[0][0];
      const tabUpdatedHandler = (mockBrowser.tabs.onUpdated.addListener as jest.Mock).mock
        .calls[0][0];
      const tabMovedHandler = (mockBrowser.tabs.onMoved.addListener as jest.Mock).mock.calls[0][0];
      const windowRemovedHandler = (mockBrowser.windows.onRemoved.addListener as jest.Mock).mock
        .calls[0][0];

      expect(typeof tabCreatedHandler).toBe('function');
      expect(typeof tabRemovedHandler).toBe('function');
      expect(typeof tabUpdatedHandler).toBe('function');
      expect(typeof tabMovedHandler).toBe('function');
      expect(typeof windowRemovedHandler).toBe('function');
    });
  });

  describe('cleanup', () => {
    it('removes all event listeners', () => {
      tabEventHandler.setupListeners();
      tabEventHandler.cleanup();

      expect(mockBrowser.tabs.onCreated.removeListener).toHaveBeenCalledTimes(1);
      expect(mockBrowser.tabs.onRemoved.removeListener).toHaveBeenCalledTimes(1);
      expect(mockBrowser.tabs.onUpdated.removeListener).toHaveBeenCalledTimes(1);
      expect(mockBrowser.tabs.onMoved.removeListener).toHaveBeenCalledTimes(1);
      expect(mockBrowser.windows.onRemoved.removeListener).toHaveBeenCalledTimes(1);
    });

    it('clears unsubscribers array', () => {
      tabEventHandler.setupListeners();
      tabEventHandler.cleanup();

      // Calling cleanup again should not throw
      expect(() => tabEventHandler.cleanup()).not.toThrow();
    });
  });

  describe('handleTabCreated', () => {
    let tabCreatedHandler: (tab: Tab) => Promise<void>;

    beforeEach(() => {
      tabEventHandler.setupListeners();
      tabCreatedHandler = (mockBrowser.tabs.onCreated.addListener as jest.Mock).mock
        .calls[0][0] as (tab: Tab) => Promise<void>;
    });

    it('syncs when tab is created in tracked window', async () => {
      const tab: Tab = { id: 1, windowId: 100, index: 0 } as Tab;
      (mockWindowTracker.isTracked as jest.Mock).mockReturnValue(true);

      await tabCreatedHandler(tab);

      expect(mockWindowTracker.isTracked).toHaveBeenCalledWith(100);
      expect(mockSyncManager.syncNow).toHaveBeenCalledTimes(1);
    });

    it('does not sync when tab is created in untracked window', async () => {
      const tab: Tab = { id: 1, windowId: 100, index: 0 } as Tab;
      (mockWindowTracker.isTracked as jest.Mock).mockReturnValue(false);

      await tabCreatedHandler(tab);

      expect(mockWindowTracker.isTracked).toHaveBeenCalledWith(100);
      expect(mockSyncManager.syncNow).not.toHaveBeenCalled();
    });

    it('does not sync when tab has no windowId', async () => {
      const tab: Tab = { id: 1, index: 0 } as Tab;

      await tabCreatedHandler(tab);

      expect(mockWindowTracker.isTracked).not.toHaveBeenCalled();
      expect(mockSyncManager.syncNow).not.toHaveBeenCalled();
    });
  });

  describe('handleTabRemoved', () => {
    let tabRemovedHandler: (tabId: number, removeInfo: OnRemovedRemoveInfoType) => Promise<void>;

    beforeEach(() => {
      tabEventHandler.setupListeners();
      tabRemovedHandler = (mockBrowser.tabs.onRemoved.addListener as jest.Mock).mock
        .calls[0][0] as (tabId: number, removeInfo: OnRemovedRemoveInfoType) => Promise<void>;
    });

    it('syncs when tab is removed from tracked window', async () => {
      const removeInfo: OnRemovedRemoveInfoType = { windowId: 100, isWindowClosing: false };
      (mockWindowTracker.isTracked as jest.Mock).mockReturnValue(true);

      await tabRemovedHandler(1, removeInfo);

      expect(mockWindowTracker.isTracked).toHaveBeenCalledWith(100);
      expect(mockSyncManager.syncNow).toHaveBeenCalledTimes(1);
    });

    it('does not sync when tab is removed from untracked window', async () => {
      const removeInfo: OnRemovedRemoveInfoType = { windowId: 100, isWindowClosing: false };
      (mockWindowTracker.isTracked as jest.Mock).mockReturnValue(false);

      await tabRemovedHandler(1, removeInfo);

      expect(mockWindowTracker.isTracked).toHaveBeenCalledWith(100);
      expect(mockSyncManager.syncNow).not.toHaveBeenCalled();
    });
  });

  describe('handleTabUpdated', () => {
    let tabUpdatedHandler: (
      tabId: number,
      changeInfo: OnUpdatedChangeInfoType,
      tab: Tab,
    ) => Promise<void>;

    beforeEach(() => {
      tabEventHandler.setupListeners();
      tabUpdatedHandler = (mockBrowser.tabs.onUpdated.addListener as jest.Mock).mock
        .calls[0][0] as (
        tabId: number,
        changeInfo: OnUpdatedChangeInfoType,
        tab: Tab,
      ) => Promise<void>;
    });

    it('syncs when tab URL is updated in tracked window', async () => {
      const changeInfo: OnUpdatedChangeInfoType = { url: 'https://example.com' };
      const tab: Tab = { id: 1, windowId: 100, index: 0 } as Tab;
      (mockWindowTracker.isTracked as jest.Mock).mockReturnValue(true);

      await tabUpdatedHandler(1, changeInfo, tab);

      expect(mockWindowTracker.isTracked).toHaveBeenCalledWith(100);
      expect(mockSyncManager.syncNow).toHaveBeenCalledTimes(1);
    });

    it('does not sync when URL is not changed', async () => {
      const changeInfo: OnUpdatedChangeInfoType = { status: 'complete' };
      const tab: Tab = { id: 1, windowId: 100, index: 0 } as Tab;
      (mockWindowTracker.isTracked as jest.Mock).mockReturnValue(true);

      await tabUpdatedHandler(1, changeInfo, tab);

      expect(mockSyncManager.syncNow).not.toHaveBeenCalled();
    });

    it('does not sync when tab is in untracked window', async () => {
      const changeInfo: OnUpdatedChangeInfoType = { url: 'https://example.com' };
      const tab: Tab = { id: 1, windowId: 100, index: 0 } as Tab;
      (mockWindowTracker.isTracked as jest.Mock).mockReturnValue(false);

      await tabUpdatedHandler(1, changeInfo, tab);

      expect(mockWindowTracker.isTracked).toHaveBeenCalledWith(100);
      expect(mockSyncManager.syncNow).not.toHaveBeenCalled();
    });

    it('does not sync when tab has no windowId', async () => {
      const changeInfo: OnUpdatedChangeInfoType = { url: 'https://example.com' };
      const tab: Tab = { id: 1, index: 0 } as Tab;

      await tabUpdatedHandler(1, changeInfo, tab);

      expect(mockWindowTracker.isTracked).not.toHaveBeenCalled();
      expect(mockSyncManager.syncNow).not.toHaveBeenCalled();
    });
  });

  describe('handleTabMoved', () => {
    let tabMovedHandler: (tabId: number, moveInfo: OnMovedMoveInfoType) => Promise<void>;

    beforeEach(() => {
      tabEventHandler.setupListeners();
      tabMovedHandler = (mockBrowser.tabs.onMoved.addListener as jest.Mock).mock.calls[0][0] as (
        tabId: number,
        moveInfo: OnMovedMoveInfoType,
      ) => Promise<void>;
    });

    it('syncs when tab is moved in tracked window', async () => {
      const moveInfo: OnMovedMoveInfoType = { windowId: 100, fromIndex: 0, toIndex: 2 };
      (mockWindowTracker.isTracked as jest.Mock).mockReturnValue(true);

      await tabMovedHandler(1, moveInfo);

      expect(mockWindowTracker.isTracked).toHaveBeenCalledWith(100);
      expect(mockSyncManager.syncNow).toHaveBeenCalledTimes(1);
    });

    it('does not sync when tab is moved in untracked window', async () => {
      const moveInfo: OnMovedMoveInfoType = { windowId: 100, fromIndex: 0, toIndex: 2 };
      (mockWindowTracker.isTracked as jest.Mock).mockReturnValue(false);

      await tabMovedHandler(1, moveInfo);

      expect(mockWindowTracker.isTracked).toHaveBeenCalledWith(100);
      expect(mockSyncManager.syncNow).not.toHaveBeenCalled();
    });
  });

  describe('handleWindowRemoved', () => {
    let windowRemovedHandler: (windowId: number) => Promise<void>;

    beforeEach(() => {
      tabEventHandler.setupListeners();
      windowRemovedHandler = (mockBrowser.windows.onRemoved.addListener as jest.Mock).mock
        .calls[0][0] as (windowId: number) => Promise<void>;
    });

    it('untracks window and stops sync when last tracked window is removed', async () => {
      (mockWindowTracker.isTracked as jest.Mock).mockReturnValue(true);
      (mockWindowTracker.getTrackedCount as jest.Mock).mockReturnValue(0);

      await windowRemovedHandler(100);

      expect(mockWindowTracker.isTracked).toHaveBeenCalledWith(100);
      expect(mockWindowTracker.untrack).toHaveBeenCalledWith(100);
      expect(mockSyncManager.stop).toHaveBeenCalledTimes(1);
      expect(mockSyncManager.syncNow).not.toHaveBeenCalled();
    });

    it('untracks window and syncs when other tracked windows remain', async () => {
      (mockWindowTracker.isTracked as jest.Mock).mockReturnValue(true);
      (mockWindowTracker.getTrackedCount as jest.Mock).mockReturnValue(2);

      await windowRemovedHandler(100);

      expect(mockWindowTracker.isTracked).toHaveBeenCalledWith(100);
      expect(mockWindowTracker.untrack).toHaveBeenCalledWith(100);
      expect(mockSyncManager.stop).not.toHaveBeenCalled();
      expect(mockSyncManager.syncNow).toHaveBeenCalledTimes(1);
    });

    it('does nothing when untracked window is removed', async () => {
      (mockWindowTracker.isTracked as jest.Mock).mockReturnValue(false);

      await windowRemovedHandler(100);

      expect(mockWindowTracker.isTracked).toHaveBeenCalledWith(100);
      expect(mockWindowTracker.untrack).not.toHaveBeenCalled();
      expect(mockSyncManager.stop).not.toHaveBeenCalled();
      expect(mockSyncManager.syncNow).not.toHaveBeenCalled();
    });
  });
});
