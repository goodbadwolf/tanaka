import 'reflect-metadata';
import { createTestContainer } from '../../test/test-container';
import { SyncManager } from '../sync-manager';
import { WindowTracker } from '../window-tracker';
import { UserSettingsManager } from '../user-settings';
import { TanakaAPI } from '../../api/api';
import { createMockBrowser } from '../../browser/__mocks__';
import type { IBrowser } from '../../browser/core';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

jest.mock('../window-tracker');
jest.mock('../user-settings');
jest.mock('../../api/api', () => ({
  TanakaAPI: jest.fn(),
  browserTabToSyncTab: jest.fn((tab: unknown, windowId: unknown) => {
    const typedTab = tab as {
      id?: number;
      url?: string;
      title?: string;
      favIconUrl?: string;
      index?: number;
      pinned?: boolean;
      active?: boolean;
    };
    if (!typedTab.id || !typedTab.url) return null;
    return {
      id: `tab-${typedTab.id}`,
      windowId: `window-${windowId}`,
      data: JSON.stringify({
        url: typedTab.url,
        title: typedTab.title || '',
        favIconUrl: typedTab.favIconUrl || '',
        index: typedTab.index,
        pinned: typedTab.pinned,
        active: typedTab.active,
      }),
      updatedAt: Date.now(),
    };
  }),
}));

describe('SyncManager', () => {
  let syncManager: SyncManager;
  let mockBrowser: IBrowser;
  let mockWindowTracker: WindowTracker;
  let mockSettingsManager: UserSettingsManager;
  let mockApi: TanakaAPI;
  let testContainer: ReturnType<typeof createTestContainer>;

  beforeEach(() => {
    jest.useFakeTimers();
    // Mock window.setInterval to use Jest's fake timers
    (globalThis as { window?: unknown }).window = {
      setInterval: jest.fn((callback: unknown, delay: unknown) =>
        setInterval(callback as TimerHandler, delay as number),
      ),
    };
    testContainer = createTestContainer();
    testContainer.clearInstances();
    mockBrowser = createMockBrowser();

    testContainer.register<IBrowser>('IBrowser', {
      useValue: mockBrowser,
    });

    mockWindowTracker = {
      getTrackedCount: jest.fn(),
      getTrackedWindows: jest.fn(),
      isTracked: jest.fn(),
      track: jest.fn(),
      untrack: jest.fn(),
      clear: jest.fn(),
    } as unknown as WindowTracker;

    mockSettingsManager = {
      load: jest.fn(() =>
        Promise.resolve({
          authToken: 'test-token',
          syncInterval: 5000,
        }),
      ),
      save: jest.fn(() => Promise.resolve()),
      clear: jest.fn(() => Promise.resolve()),
    } as unknown as UserSettingsManager;

    mockApi = {
      syncTabs: jest.fn().mockImplementation(() => Promise.resolve([])),
      setAuthToken: jest.fn(),
    } as unknown as TanakaAPI;

    testContainer.registerInstance(WindowTracker, mockWindowTracker);
    testContainer.registerInstance(UserSettingsManager, mockSettingsManager);
    testContainer.registerInstance(TanakaAPI, mockApi);

    syncManager = testContainer.resolve(SyncManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('syncNow', () => {
    it('does nothing when no windows are tracked', async () => {
      (mockWindowTracker.getTrackedCount as jest.Mock).mockReturnValue(0);

      await syncManager.syncNow();

      expect(mockWindowTracker.getTrackedCount).toHaveBeenCalled();
      expect(mockWindowTracker.getTrackedWindows).not.toHaveBeenCalled();
      expect(mockApi.syncTabs).not.toHaveBeenCalled();
    });

    it('collects tabs from tracked windows and syncs', async () => {
      (mockWindowTracker.getTrackedCount as jest.Mock).mockReturnValue(2);
      (mockWindowTracker.getTrackedWindows as jest.Mock).mockReturnValue([100, 200]);

      const mockTabs = [
        { id: 1, windowId: 100, url: 'https://example.com', title: 'Example', index: 0 },
        { id: 2, windowId: 100, url: 'https://test.com', title: 'Test', index: 1 },
        { id: 3, windowId: 200, url: 'https://demo.com', title: 'Demo', index: 0 },
      ];

      (mockBrowser.tabs.query as jest.Mock)
        .mockImplementationOnce(() => Promise.resolve([mockTabs[0], mockTabs[1]]))
        .mockImplementationOnce(() => Promise.resolve([mockTabs[2]]));

      (mockApi.syncTabs as jest.Mock).mockImplementation(() => Promise.resolve([...mockTabs]));

      await syncManager.syncNow();

      expect(mockBrowser.tabs.query).toHaveBeenCalledWith({ windowId: 100 });
      expect(mockBrowser.tabs.query).toHaveBeenCalledWith({ windowId: 200 });
      expect(mockApi.syncTabs).toHaveBeenCalledTimes(1);
      expect(mockApi.syncTabs).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ windowId: 'window-100' }),
          expect.objectContaining({ windowId: 'window-100' }),
          expect.objectContaining({ windowId: 'window-200' }),
        ]),
      );
    });

    it('handles API errors gracefully', async () => {
      (mockWindowTracker.getTrackedCount as jest.Mock).mockReturnValue(1);
      (mockWindowTracker.getTrackedWindows as jest.Mock).mockReturnValue([100]);
      (mockBrowser.tabs.query as jest.Mock).mockImplementation(() =>
        Promise.resolve([
          { id: 1, windowId: 100, url: 'https://example.com', title: 'Example', index: 0 },
        ]),
      );
      (mockApi.syncTabs as jest.Mock).mockImplementation(() =>
        Promise.reject(new Error('Network error')),
      );

      await expect(syncManager.syncNow()).resolves.not.toThrow();
    });

    it('handles browser query errors gracefully', async () => {
      (mockWindowTracker.getTrackedCount as jest.Mock).mockReturnValue(2);
      (mockWindowTracker.getTrackedWindows as jest.Mock).mockReturnValue([100, 200]);

      (mockBrowser.tabs.query as jest.Mock)
        .mockImplementationOnce(() => Promise.reject(new Error('Permission denied')))
        .mockImplementationOnce(() =>
          Promise.resolve([
            { id: 1, windowId: 200, url: 'https://example.com', title: 'Example', index: 0 },
          ]),
        );

      await syncManager.syncNow();

      expect(mockApi.syncTabs).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ windowId: 'window-200' })]),
      );
    });

    it('filters out tabs without windowId', async () => {
      (mockWindowTracker.getTrackedCount as jest.Mock).mockReturnValue(1);
      (mockWindowTracker.getTrackedWindows as jest.Mock).mockReturnValue([100]);

      (mockBrowser.tabs.query as jest.Mock).mockImplementation(() =>
        Promise.resolve([
          { id: 1, windowId: 100, url: 'https://example.com', title: 'Example', index: 0 },
          { id: 2, url: 'https://no-window.com', title: 'No Window', index: 1 },
        ]),
      );

      await syncManager.syncNow();

      expect(mockApi.syncTabs).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ windowId: 'window-100' })]),
      );
      expect(mockApi.syncTabs).toHaveBeenCalledWith(
        expect.not.arrayContaining([expect.objectContaining({ url: 'https://no-window.com' })]),
      );
    });
  });

  describe('start', () => {
    it('loads settings and starts periodic sync', async () => {
      (mockWindowTracker.getTrackedCount as jest.Mock).mockReturnValue(1);
      (mockWindowTracker.getTrackedWindows as jest.Mock).mockReturnValue([100]);
      (mockBrowser.tabs.query as jest.Mock).mockImplementation(() =>
        Promise.resolve([
          { id: 1, windowId: 100, url: 'https://example.com', title: 'Example', index: 0 },
        ]),
      );

      await syncManager.start();

      // The initial syncNow is not awaited, so we need to flush promises
      await Promise.resolve();

      expect(mockSettingsManager.load).toHaveBeenCalled();
      expect(mockApi.syncTabs).toHaveBeenCalledTimes(1);

      // Advance timer and run the interval callback
      jest.advanceTimersByTime(5000);
      // The interval callback calls syncNow() but doesn't await it, so we need multiple promise flushes
      await Promise.resolve(); // For the interval callback to start
      await Promise.resolve(); // For the syncNow promise to resolve
      expect(mockApi.syncTabs).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(5000);
      await Promise.resolve();
      await Promise.resolve();
      expect(mockApi.syncTabs).toHaveBeenCalledTimes(3);
    });

    it('uses custom sync interval from settings', async () => {
      (mockSettingsManager.load as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          authToken: 'test-token',
          syncInterval: 10000,
        }),
      );
      (mockWindowTracker.getTrackedCount as jest.Mock).mockReturnValue(1);
      (mockWindowTracker.getTrackedWindows as jest.Mock).mockReturnValue([100]);
      (mockBrowser.tabs.query as jest.Mock).mockImplementation(() =>
        Promise.resolve([
          { id: 1, windowId: 100, url: 'https://example.com', title: 'Example', index: 0 },
        ]),
      );

      await syncManager.start();
      await Promise.resolve();

      jest.advanceTimersByTime(5000);
      await Promise.resolve();
      await Promise.resolve();
      expect(mockApi.syncTabs).toHaveBeenCalledTimes(1); // Only initial sync

      jest.advanceTimersByTime(5000);
      await Promise.resolve();
      await Promise.resolve();
      expect(mockApi.syncTabs).toHaveBeenCalledTimes(2); // Now the interval fires
    });

    it('does not start multiple intervals', async () => {
      (mockWindowTracker.getTrackedCount as jest.Mock).mockReturnValue(1);
      (mockWindowTracker.getTrackedWindows as jest.Mock).mockReturnValue([100]);
      (mockBrowser.tabs.query as jest.Mock).mockImplementation(() =>
        Promise.resolve([
          { id: 1, windowId: 100, url: 'https://example.com', title: 'Example', index: 0 },
        ]),
      );

      await syncManager.start();
      await Promise.resolve();

      await syncManager.start();
      await Promise.resolve();

      jest.advanceTimersByTime(5000);
      await Promise.resolve();
      await Promise.resolve();
      expect(mockApi.syncTabs).toHaveBeenCalledTimes(2); // 1 initial + 1 interval (second start() returns early)
    });
  });

  describe('stop', () => {
    it('clears the sync interval', async () => {
      (mockWindowTracker.getTrackedCount as jest.Mock).mockReturnValue(1);
      (mockWindowTracker.getTrackedWindows as jest.Mock).mockReturnValue([100]);
      (mockBrowser.tabs.query as jest.Mock).mockImplementation(() =>
        Promise.resolve([
          { id: 1, windowId: 100, url: 'https://example.com', title: 'Example', index: 0 },
        ]),
      );

      await syncManager.start();
      await Promise.resolve();
      syncManager.stop();

      jest.advanceTimersByTime(10000);
      await Promise.resolve();
      await Promise.resolve();
      expect(mockApi.syncTabs).toHaveBeenCalledTimes(1); // Only initial sync
    });

    it('handles stop when not running', () => {
      expect(() => syncManager.stop()).not.toThrow();
    });
  });

  describe('restart', () => {
    it('stops and starts sync with updated settings', async () => {
      (mockWindowTracker.getTrackedCount as jest.Mock).mockReturnValue(1);
      (mockWindowTracker.getTrackedWindows as jest.Mock).mockReturnValue([100]);
      (mockBrowser.tabs.query as jest.Mock).mockImplementation(() =>
        Promise.resolve([
          { id: 1, windowId: 100, url: 'https://example.com', title: 'Example', index: 0 },
        ]),
      );

      await syncManager.start();
      await Promise.resolve();

      jest.advanceTimersByTime(5000);
      await Promise.resolve();
      await Promise.resolve();
      expect(mockApi.syncTabs).toHaveBeenCalledTimes(2);

      // Change settings
      (mockSettingsManager.load as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          authToken: 'new-token',
          syncInterval: 3000,
        }),
      );

      await syncManager.restart();
      await Promise.resolve();
      expect(mockApi.syncTabs).toHaveBeenCalledTimes(3); // One more from restart

      jest.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
      expect(mockApi.syncTabs).toHaveBeenCalledTimes(4); // New interval fires
    });
  });

  describe('isRunning', () => {
    it('returns false when not started', () => {
      expect(syncManager.isRunning()).toBe(false);
    });

    it('returns true when running', async () => {
      (mockWindowTracker.getTrackedCount as jest.Mock).mockReturnValue(1);
      await syncManager.start();

      expect(syncManager.isRunning()).toBe(true);
    });

    it('returns false after stop', async () => {
      (mockWindowTracker.getTrackedCount as jest.Mock).mockReturnValue(1);
      await syncManager.start();
      syncManager.stop();

      expect(syncManager.isRunning()).toBe(false);
    });
  });
});
