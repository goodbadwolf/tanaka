import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock webextension-polyfill before any imports that use it
jest.mock('webextension-polyfill');
jest.mock('../../utils/logger');

import { SyncManager } from '../sync-manager';
import { TanakaAPI } from '../../api/api';
import { WindowTracker } from '../window-tracker';
import browser from 'webextension-polyfill';
import { debugLog, debugError } from '../../utils/logger';

// Mock API
jest.mock('../../api/api');

interface MockBrowser {
  tabs: {
    query: jest.MockedFunction<(query: { windowId: number }) => Promise<unknown[]>>;
  };
}

describe('SyncManager', () => {
  let syncManager: SyncManager;
  let mockApi: jest.Mocked<TanakaAPI>;
  let mockWindowTracker: jest.Mocked<WindowTracker>;
  let mockBrowser: MockBrowser;
  let mockDebugLog: jest.MockedFunction<typeof debugLog>;
  let mockDebugError: jest.MockedFunction<typeof debugError>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Setup mocks
    mockBrowser = browser as unknown as MockBrowser;
    mockApi = new TanakaAPI('https://api.example.com') as jest.Mocked<TanakaAPI>;
    mockWindowTracker = {
      getTrackedCount: jest.fn(),
      getTrackedWindows: jest.fn(),
      track: jest.fn(),
      untrack: jest.fn(),
      isTracked: jest.fn(),
      clear: jest.fn(),
    } as unknown as jest.Mocked<WindowTracker>;

    mockApi.syncTabs = jest.fn();

    // Mock logger functions
    mockDebugLog = jest.mocked(debugLog);
    mockDebugError = jest.mocked(debugError);

    syncManager = new SyncManager(mockApi, mockWindowTracker);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('syncNow', () => {
    it('should skip sync when no windows are tracked', async () => {
      mockWindowTracker.getTrackedCount.mockReturnValue(0);

      await syncManager.syncNow();

      expect(mockApi.syncTabs).not.toHaveBeenCalled();
    });

    it('should sync tabs from tracked windows', async () => {
      mockWindowTracker.getTrackedCount.mockReturnValue(2);
      mockWindowTracker.getTrackedWindows.mockReturnValue([1, 2]);

      const mockTabs = [
        { id: 1, windowId: 1, url: 'https://example.com', index: 0, pinned: false, active: true },
        { id: 2, windowId: 1, url: 'https://test.com', index: 1, pinned: false, active: false },
        { id: 3, windowId: 2, url: 'https://demo.com', index: 0, pinned: true, active: false },
      ];

      mockBrowser.tabs.query
        .mockResolvedValueOnce([mockTabs[0], mockTabs[1]])
        .mockResolvedValueOnce([mockTabs[2]]);

      mockApi.syncTabs.mockResolvedValue([]);

      await syncManager.syncNow();

      expect(mockBrowser.tabs.query).toHaveBeenCalledWith({ windowId: 1 });
      expect(mockBrowser.tabs.query).toHaveBeenCalledWith({ windowId: 2 });
      expect(mockApi.syncTabs).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'tab-1', windowId: 'window-1' }),
          expect.objectContaining({ id: 'tab-2', windowId: 'window-1' }),
          expect.objectContaining({ id: 'tab-3', windowId: 'window-2' }),
        ]),
      );
      expect(mockDebugLog).toHaveBeenCalledWith('Synced 3 local tabs, received 0 total tabs');
    });

    it('should handle errors when querying tabs', async () => {
      mockWindowTracker.getTrackedCount.mockReturnValue(1);
      mockWindowTracker.getTrackedWindows.mockReturnValue([1]);

      mockBrowser.tabs.query.mockRejectedValue(new Error('Tab query error'));
      mockApi.syncTabs.mockResolvedValue([]);

      await syncManager.syncNow();

      expect(mockDebugError).toHaveBeenCalledWith(
        'Failed to get tabs for window 1:',
        expect.any(Error),
      );
      expect(mockApi.syncTabs).toHaveBeenCalledWith([]);
    });

    it('should handle sync API errors', async () => {
      mockWindowTracker.getTrackedCount.mockReturnValue(1);
      mockWindowTracker.getTrackedWindows.mockReturnValue([1]);
      mockBrowser.tabs.query.mockResolvedValue([]);

      const error = new Error('API error');
      mockApi.syncTabs.mockRejectedValue(error);

      await syncManager.syncNow();

      expect(mockDebugError).toHaveBeenCalledWith('Sync failed:', error);
    });

    it('should filter out tabs without windowId', async () => {
      mockWindowTracker.getTrackedCount.mockReturnValue(1);
      mockWindowTracker.getTrackedWindows.mockReturnValue([1]);

      const mockTabs = [
        { id: 1, windowId: 1, url: 'https://example.com', index: 0 },
        { id: 2, windowId: null, url: 'https://test.com', index: 1 }, // No windowId
        { id: 3, url: 'https://demo.com', index: 2 }, // Missing windowId
      ];

      mockBrowser.tabs.query.mockResolvedValue(mockTabs);
      mockApi.syncTabs.mockResolvedValue([]);

      await syncManager.syncNow();

      expect(mockApi.syncTabs).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'tab-1', windowId: 'window-1' }),
      ]);
    });
  });

  describe('start/stop', () => {
    it('should start periodic sync', () => {
      syncManager.start();

      expect(syncManager.isRunning()).toBe(true);

      // Should sync immediately
      expect(mockWindowTracker.getTrackedCount).toHaveBeenCalled();

      // Advance timer
      jest.advanceTimersByTime(5000);
      expect(mockWindowTracker.getTrackedCount).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(5000);
      expect(mockWindowTracker.getTrackedCount).toHaveBeenCalledTimes(3);
    });

    it('should not start if already running', () => {
      syncManager.start();
      const firstCallCount = mockWindowTracker.getTrackedCount.mock.calls.length;

      syncManager.start();
      expect(mockWindowTracker.getTrackedCount).toHaveBeenCalledTimes(firstCallCount);
    });

    it('should stop periodic sync', () => {
      syncManager.start();
      expect(syncManager.isRunning()).toBe(true);

      syncManager.stop();
      expect(syncManager.isRunning()).toBe(false);

      const callCount = mockWindowTracker.getTrackedCount.mock.calls.length;
      jest.advanceTimersByTime(10000);
      expect(mockWindowTracker.getTrackedCount).toHaveBeenCalledTimes(callCount);
    });

    it('should handle stop when not running', () => {
      expect(syncManager.isRunning()).toBe(false);
      expect(() => syncManager.stop()).not.toThrow();
      expect(syncManager.isRunning()).toBe(false);
    });
  });
});
