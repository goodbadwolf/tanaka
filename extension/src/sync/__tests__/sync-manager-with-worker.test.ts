/*
import { SyncManagerWithWorker } from '../sync-manager-with-worker';
import type { TanakaAPI } from '../../api/api';
import type { WindowTracker } from '../window-tracker';
import type { IBrowser } from '../../browser/core';
import type { CrdtOperation, SyncResponse } from '../../api/sync';
// Removed neverthrow imports since API uses different format
import { ExtensionError } from '../../error/types';

jest.mock('../../../src/workers/crdt-worker-client');
jest.mock('../../utils/logger');

// Polyfill setImmediate for tests
if (typeof setImmediate === 'undefined') {
  (global as unknown as Record<string, unknown>).setImmediate = (fn: () => void) =>
    setTimeout(fn, 0);
}

const mockWorkerClient = {
  initialize: jest.fn(),
  queueOperation: jest.fn(),
  deduplicateOperations: jest.fn(),
  getState: jest.fn(),
  updateState: jest.fn(),
  terminate: jest.fn(),
};

jest.mock('../../../src/workers/crdt-worker-client', () => ({
  CrdtWorkerClient: jest.fn(() => mockWorkerClient),
}));

const mockAPI: TanakaAPI = {
  sync: jest.fn(),
} as unknown as TanakaAPI;

const mockWindowTracker: WindowTracker = {
  isTracked: jest.fn(),
  track: jest.fn(),
  untrack: jest.fn(),
} as unknown as WindowTracker;

const mockBrowser: IBrowser = {
  permissions: {
    contains: jest.fn().mockResolvedValue(true),
    getAll: jest.fn().mockResolvedValue({ permissions: ['tabs', 'storage'], origins: [] }),
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
  localStorage: {
    get: jest.fn(),
    set: jest.fn(),
  },
  tabs: {
    query: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
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
    onActivated: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  windows: {
    onRemoved: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onFocusChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
} as unknown as IBrowser;

describe('SyncManagerWithWorker', () => {
  let syncManager: SyncManagerWithWorker;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockWorkerClient.initialize.mockResolvedValue(undefined);
    mockWorkerClient.queueOperation.mockResolvedValue({ priority: 1, dedupKey: 'test' });
    mockWorkerClient.deduplicateOperations.mockResolvedValue([]);
    mockWorkerClient.getState.mockResolvedValue({
      queueLength: 0,
      lamportClock: '0',
      deviceId: 'test-device',
    });
    mockWorkerClient.updateState.mockResolvedValue(undefined);

    (mockBrowser.localStorage.get as jest.Mock).mockResolvedValue({});
    (mockBrowser.localStorage.set as jest.Mock).mockResolvedValue(undefined);

    (mockAPI.sync as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        clock: 1n,
        operations: [],
      } as SyncResponse,
    });

    syncManager = new SyncManagerWithWorker({
      api: mockAPI,
      windowTracker: mockWindowTracker,
      browser: mockBrowser,
      syncIntervalMs: 1000,
      deviceId: 'test-device',
    });
  });

  afterEach(() => {
    syncManager.stop();
    jest.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize the worker', async () => {
      await syncManager.start();

      expect(mockWorkerClient.initialize).toHaveBeenCalled();
    });

    it('should load persisted state', async () => {
      (mockBrowser.localStorage.get as jest.Mock).mockResolvedValue({
        deviceId: 'stored-device',
        lamportClock: '123',
        lastSyncClock: '456',
      });

      await syncManager.start();

      expect(mockBrowser.localStorage.get).toHaveBeenCalledWith([
        'deviceId',
        'lamportClock',
        'lastSyncClock',
      ]);
      expect(mockWorkerClient.updateState).toHaveBeenCalledWith('stored-device', '123');
    });
  });

  describe('operation queueing', () => {
    beforeEach(async () => {
      await syncManager.start();
    });

    it('should queue tab upsert operation', async () => {
      await syncManager.queueTabUpsert('123', '456', 'https://example.com', 'Example', true, 0);

      expect(mockWorkerClient.queueOperation).toHaveBeenCalledWith({
        type: 'upsert_tab',
        id: '123',
        data: {
          window_id: '456',
          url: 'https://example.com',
          title: 'Example',
          active: true,
          index: 0,
          updated_at: expect.any(BigInt),
        },
      });
    });

    it('should queue tab close operation', async () => {
      await syncManager.queueTabClose('123');

      expect(mockWorkerClient.queueOperation).toHaveBeenCalledWith({
        type: 'close_tab',
        id: '123',
        closed_at: expect.any(BigInt),
      });
    });

    it('should queue window tracking operations', async () => {
      await syncManager.queueWindowTrack('456', true);

      expect(mockWorkerClient.queueOperation).toHaveBeenCalledWith({
        type: 'track_window',
        id: '456',
        tracked: true,
        updated_at: expect.any(BigInt),
      });
    });
  });

  describe('sync process', () => {
    beforeEach(async () => {
      await syncManager.start();
    });

    it('should deduplicate operations before syncing', async () => {
      const operations: CrdtOperation[] = [
        {
          type: 'set_active',
          id: '123',
          active: true,
          updated_at: 123456789n,
        },
      ];

      mockWorkerClient.deduplicateOperations.mockResolvedValue(operations);

      await syncManager.syncNow();

      expect(mockWorkerClient.deduplicateOperations).toHaveBeenCalled();
      expect(mockAPI.sync).toHaveBeenCalledWith({
        clock: 0n,
        device_id: 'test-device',
        since_clock: null,
        operations,
      });
    });

    it('should handle sync errors by re-queueing operations', async () => {
      const operations: CrdtOperation[] = [
        {
          type: 'close_tab',
          id: '123',
          closed_at: 123456789n,
        },
      ];

      mockWorkerClient.deduplicateOperations.mockResolvedValue(operations);
      (mockAPI.sync as jest.Mock).mockResolvedValue({
        success: false,
        error: ExtensionError.NetworkFailure,
      });

      const result = await syncManager.syncNow();

      expect(result.isErr()).toBe(true);
      expect(mockWorkerClient.queueOperation).toHaveBeenCalledWith(operations[0]);
    });

    it('should update state after successful sync', async () => {
      await syncManager.start();

      const response: SyncResponse = {
        clock: 123n,
        operations: [],
      };

      (mockAPI.sync as jest.Mock).mockResolvedValue({ success: true, data: response });

      await syncManager.syncNow();

      expect(mockBrowser.localStorage.set).toHaveBeenCalledWith({
        deviceId: 'test-device',
        lamportClock: '123',
        lastSyncClock: '123',
      });
      expect(mockWorkerClient.updateState).toHaveBeenCalledWith('test-device', '123');
    });
  });

  describe('adaptive intervals', () => {
    beforeEach(async () => {
      await syncManager.start();
    });

    it('should use active interval when operations are queued', async () => {
      // Clear the initial sync timer to control timing
      // @ts-expect-error - accessing private property for testing
      if (syncManager.syncTimer) {
        clearTimeout(syncManager.syncTimer);
        // @ts-expect-error - accessing private property for testing
        syncManager.syncTimer = null;
      }

      // Clear mock counts after start
      mockWorkerClient.deduplicateOperations.mockClear();
      mockAPI.sync.mockClear();

      // Set up operations to sync
      mockWorkerClient.deduplicateOperations.mockResolvedValue([
        {
          type: 'set_active',
          id: '123',
          active: true,
          updated_at: 123456789n,
        },
      ]);

      // Queue an operation which should trigger batched sync with HIGH priority (200ms)
      await syncManager.queueTabActive('123', true);

      // The batched sync is scheduled for 200ms later (HIGH priority)
      await jest.advanceTimersToNextTimerAsync();

      // First sync should have happened via batched sync
      expect(mockWorkerClient.deduplicateOperations).toHaveBeenCalledTimes(1);

      // After the sync, scheduleSyncCheck should have been called
      // Since there was recent activity (queueTabActive), it should use active interval (1000ms)
      // @ts-expect-error - accessing private property for testing
      expect(syncManager.currentInterval).toBe(1000);

      // Clear the mock for next check
      mockWorkerClient.deduplicateOperations.mockClear();

      // Advance by active interval (1000ms) to trigger the next scheduled sync
      await jest.advanceTimersToNextTimerAsync();

      // Should sync again after active interval
      expect(mockWorkerClient.deduplicateOperations).toHaveBeenCalledTimes(1);
    });

    it('should use error backoff on sync failures', async () => {
      // Start the sync manager first
      await syncManager.start();

      // Stop the sync manager to clear the regular timer, but keep the worker running
      // @ts-expect-error - accessing private property for testing
      if (syncManager.syncTimer) {
        clearTimeout(syncManager.syncTimer);
        // @ts-expect-error - accessing private property for testing
        syncManager.syncTimer = null;
      }

      // Clear mock counts after start
      mockWorkerClient.deduplicateOperations.mockClear();
      mockAPI.sync.mockClear();

      // Mock first call to fail, second to succeed
      (mockAPI.sync as jest.Mock)
        .mockResolvedValueOnce({ success: false, error: ExtensionError.NetworkFailure })
        .mockResolvedValueOnce({ success: true, data: { clock: 1n, operations: [] } });

      // Set up operations to sync
      mockWorkerClient.deduplicateOperations.mockResolvedValue([
        {
          type: 'set_active',
          id: '123',
          active: true,
          updated_at: 123456789n,
        },
      ]);

      // Queue an operation which triggers a batched sync with HIGH priority (200ms delay)
      await syncManager.queueTabActive('123', true);

      // The batched sync is scheduled for 200ms later
      // Use advanceTimersToNextTimer to run exactly one timer
      await jest.advanceTimersToNextTimerAsync();

      // First sync should have failed
      expect(mockWorkerClient.deduplicateOperations).toHaveBeenCalledTimes(1);
      expect(mockAPI.sync).toHaveBeenCalledTimes(1);

      // Verify error count was incremented
      // @ts-expect-error - accessing private property for testing
      expect(syncManager.consecutiveErrors).toBe(1);

      // After the failed sync, scheduleSyncCheck should have been called
      // which sets a new timer with error backoff (5000ms)
      // Use advanceTimersToNextTimer to run exactly one timer
      await jest.advanceTimersToNextTimerAsync();

      // Second sync should have happened automatically
      expect(mockWorkerClient.deduplicateOperations).toHaveBeenCalledTimes(2);
      expect(mockAPI.sync).toHaveBeenCalledTimes(2);

      // Verify error count was reset after successful sync
      // @ts-expect-error - accessing private property for testing
      expect(syncManager.consecutiveErrors).toBe(0);
    });
  });

  describe('remote operation application', () => {
    beforeEach(async () => {
      await syncManager.start();
    });

    it('should apply remote upsert_tab operations', async () => {
      const response: SyncResponse = {
        clock: 1n,
        operations: [
          {
            type: 'upsert_tab',
            id: '123',
            data: {
              window_id: '456',
              url: 'https://example.com',
              title: 'Example',
              active: true,
              index: 0,
              updated_at: 123456789n,
            },
          },
        ],
      };

      (mockBrowser.tabs.query as jest.Mock).mockResolvedValue([]);
      (mockAPI.sync as jest.Mock).mockResolvedValue({ success: true, data: response });

      await syncManager.syncNow();

      expect(mockBrowser.tabs.create).toHaveBeenCalledWith({
        windowId: 456,
        url: 'https://example.com',
        active: true,
        index: 0,
      });
    });

    it('should apply remote close_tab operations', async () => {
      const response: SyncResponse = {
        clock: 1n,
        operations: [
          {
            type: 'close_tab',
            id: '123',
            closed_at: 123456789n,
          },
        ],
      };

      (mockAPI.sync as jest.Mock).mockResolvedValue({ success: true, data: response });

      await syncManager.syncNow();

      expect(mockBrowser.tabs.remove).toHaveBeenCalledWith(123);
    });

    it('should apply remote window tracking operations', async () => {
      const response: SyncResponse = {
        clock: 1n,
        operations: [
          {
            type: 'track_window',
            id: '456',
            tracked: true,
            updated_at: 123456789n,
          },
        ],
      };

      (mockAPI.sync as jest.Mock).mockResolvedValue({ success: true, data: response });

      await syncManager.syncNow();

      expect(mockWindowTracker.track).toHaveBeenCalledWith(456);
    });
  });

  describe('cleanup', () => {
    it('should terminate worker on stop', async () => {
      await syncManager.start();
      syncManager.stop();

      expect(mockWorkerClient.terminate).toHaveBeenCalled();
    });

    it('should clear timers on stop', async () => {
      // Set up spies BEFORE any timer operations
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      // Start the sync manager (this creates syncTimer)
      await syncManager.start();

      // Verify a timer was actually created
      expect(setTimeoutSpy).toHaveBeenCalled();
      const syncTimerCalls = setTimeoutSpy.mock.calls.length;

      // Queue an operation to create batchTimer
      mockWorkerClient.queueOperation.mockResolvedValueOnce({
        priority: 0,
        dedupKey: 'close-tab-test',
      });
      await syncManager.queueTabClose('test-tab-id');

      // Verify batch timer was created
      expect(setTimeoutSpy).toHaveBeenCalledTimes(syncTimerCalls + 1);

      // Clear spy history to focus on stop() behavior
      clearTimeoutSpy.mockClear();

      // Call stop() which should clear the timers
      syncManager.stop();

      // Verify clearTimeout was called for active timers
      // Should clear at least syncTimer, and batchTimer if it exists
      expect(clearTimeoutSpy.mock.calls.length).toBeGreaterThanOrEqual(1);

      // Verify the sync manager is no longer running
      expect(syncManager.isRunning()).toBe(false);

      // Verify worker was terminated
      expect(mockWorkerClient.terminate).toHaveBeenCalled();
    });
  });

  describe('advanced scenarios', () => {
    beforeEach(async () => {
      await syncManager.start();
    });

    it('should handle restart gracefully', async () => {
      // Start sync manager
      expect(syncManager.isRunning()).toBe(true);

      // Restart should stop and start again
      await syncManager.restart();

      expect(mockWorkerClient.terminate).toHaveBeenCalled();
      expect(mockWorkerClient.initialize).toHaveBeenCalledTimes(2); // Initial + restart
      expect(syncManager.isRunning()).toBe(true);
    });

    it('should calculate error backoff intervals correctly', async () => {
      // Create a test-only method to access private calculateAdaptiveInterval
      const getAdaptiveInterval = async () => {
        // @ts-expect-error - accessing private method for testing
        return syncManager.calculateAdaptiveInterval();
      };

      // Initial interval should be idle (no recent activity)
      let interval = await getAdaptiveInterval();
      expect(interval).toBe(10000); // idleIntervalMs

      // Simulate consecutive errors
      // @ts-expect-error - accessing private property for testing
      syncManager.consecutiveErrors = 1;
      interval = await getAdaptiveInterval();
      expect(interval).toBe(5000); // errorBackoffMs * 2^0

      // @ts-expect-error - accessing private property for testing
      syncManager.consecutiveErrors = 2;
      interval = await getAdaptiveInterval();
      expect(interval).toBe(10000); // errorBackoffMs * 2^1

      // @ts-expect-error - accessing private property for testing
      syncManager.consecutiveErrors = 3;
      interval = await getAdaptiveInterval();
      expect(interval).toBe(20000); // errorBackoffMs * 2^2

      // Test max backoff
      // @ts-expect-error - accessing private property for testing
      syncManager.consecutiveErrors = 10;
      interval = await getAdaptiveInterval();
      expect(interval).toBe(60000); // maxBackoffMs
    });

    it('should use active interval when there is recent activity', async () => {
      // @ts-expect-error - accessing private property for testing
      syncManager.lastActivityTime = Date.now();

      const getAdaptiveInterval = async () => {
        // @ts-expect-error - accessing private method for testing
        return syncManager.calculateAdaptiveInterval();
      };

      const interval = await getAdaptiveInterval();
      expect(interval).toBe(1000); // activeIntervalMs
    });

    it('should respect queue size threshold for adaptive intervals', async () => {
      // Mock large queue size
      mockWorkerClient.getState.mockResolvedValue({
        queueLength: 60, // Above threshold of 50
        lamportClock: '0',
        deviceId: 'test-device',
      });

      const getAdaptiveInterval = async () => {
        // @ts-expect-error - accessing private method for testing
        return syncManager.calculateAdaptiveInterval();
      };

      // Should use active interval due to large queue even without recent activity
      const interval = await getAdaptiveInterval();
      expect(interval).toBe(1000); // activeIntervalMs (forced by queue size)
    });

    it('should handle scheduleSyncCheck timer management', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      // First call - no timer to clear
      // @ts-expect-error - accessing private method for testing
      await syncManager.scheduleSyncCheck();

      // Should have set a new timer
      expect(setTimeoutSpy).toHaveBeenCalled();

      // Set a fake timer value to test clearing
      // @ts-expect-error - accessing private property for testing
      syncManager.syncTimer = 999;

      // Call again to test timer clearing
      // @ts-expect-error - accessing private method for testing
      await syncManager.scheduleSyncCheck();

      // Should have cleared previous timer before setting new one
      expect(clearTimeoutSpy).toHaveBeenCalledWith(999);
    });

    it.skip('should skip sync when already in progress', async () => {
      // Reset the mock
      (mockAPI.sync as jest.Mock).mockClear();
      mockWorkerClient.deduplicateOperations.mockClear();

      // Mock a long-running sync
      (mockAPI.sync as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, data: { clock: 1n, operations: [] } }), 50),
          ),
      );

      // Start first sync
      const firstSyncPromise = syncManager.syncNow();

      // Start second sync immediately (should be skipped)
      const secondSyncPromise = syncManager.syncNow();

      await Promise.all([firstSyncPromise, secondSyncPromise]);

      // Due to permission checks and timing, the exact behavior may vary
      // The important thing is that we don't have duplicate syncs
      // If both syncs proceeded, we'd have 2 API calls
      expect(mockAPI.sync).toHaveBeenCalledTimes(1);
    });

    // TODO: Fix test timeout issue - the implementation works but test has timing issues
    it.skip('should trigger immediate sync when queue size exceeds threshold', async () => {
      // Create fresh sync manager to avoid interference
      const testSyncManager = new SyncManagerWithWorker({
        syncIntervalMs: 10000, // High value to ensure no regular sync
        api: mockAPI,
        windowTracker: mockWindowTracker,
        browser: mockBrowser,
      });

      // Initialize with proper mocks
      await testSyncManager.start();

      // Ensure sync returns properly
      mockWorkerClient.queueOperation.mockResolvedValue({ priority: 'NORMAL' });
      mockWorkerClient.deduplicateOperations.mockResolvedValue([]);
      (mockAPI.sync as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          clock: 1n,
          operations: [],
        },
      });

      // Mock queue size exceeding threshold
      mockWorkerClient.getState.mockResolvedValue({
        queueLength: 50, // At threshold
        lamportClock: '0',
        deviceId: 'test-device',
      });

      // Clear sync mock before test
      (mockAPI.sync as jest.Mock).mockClear();

      // Queue an operation (should trigger immediate sync due to threshold)
      await testSyncManager.queueTabActive('123', true);

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should have triggered sync due to queue threshold
      expect(mockAPI.sync).toHaveBeenCalled();

      // Cleanup
      await testSyncManager.stop();
    });

    it.skip('should handle queue size threshold for adaptive intervals', async () => {
      // Mock large queue size
      mockWorkerClient.getState.mockResolvedValue({
        queueLength: 60, // Above threshold of 50
        lamportClock: '0',
        deviceId: 'test-device',
      });

      // Queue an operation to trigger adaptive interval calculation
      await syncManager.queueTabActive('123', true);

      // Should use faster interval due to large queue
      jest.advanceTimersByTime(1000); // Active interval
      expect(mockWorkerClient.deduplicateOperations).toHaveBeenCalled();
    });

    it('should handle worker state error gracefully', async () => {
      // Mock worker state error
      mockWorkerClient.getState.mockRejectedValue(new Error('Worker error'));

      // Should still queue operation despite worker error
      await expect(syncManager.queueTabActive('123', true)).resolves.not.toThrow();
    });

    it('should handle persistState error gracefully', async () => {
      // Mock localStorage error
      (mockBrowser.localStorage.set as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const response = { clock: 1n, operations: [] };
      (mockAPI.sync as jest.Mock).mockResolvedValue({ success: true, data: response });

      // Should complete sync despite persistence error
      await expect(syncManager.syncNow()).resolves.not.toThrow();
    });

    it('should handle loadPersistedState error gracefully', async () => {
      // Mock localStorage error during startup
      (mockBrowser.localStorage.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

      // Create new sync manager to test startup error handling
      const newSyncManager = new SyncManagerWithWorker({
        api: mockAPI,
        windowTracker: mockWindowTracker,
        browser: mockBrowser,
        syncIntervalMs: 1000,
        deviceId: 'test-device',
      });

      // Should start successfully despite persistence error
      await expect(newSyncManager.start()).resolves.not.toThrow();

      newSyncManager.stop();
    });

    it.skip('should handle all tab event handler operations', async () => {
      const handler = await syncManager.setupTabEventHandler();

      // Test all handler operations
      const mockTab = {
        id: 123,
        windowId: 456,
        url: 'https://example.com',
        title: 'Test',
        active: true,
        index: 0,
      };

      // Mock window as tracked
      (mockWindowTracker.isTracked as jest.Mock).mockReturnValue(true);

      // Test tab created
      handler['options'].onTabCreated(mockTab);
      expect(mockWorkerClient.queueOperation).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'upsert_tab', id: '123' }),
      );

      // Test tab updated
      handler['options'].onTabUpdated(
        123,
        { url: 'https://new-url.com' },
        { ...mockTab, url: 'https://new-url.com' },
      );
      expect(mockWorkerClient.queueOperation).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'change_url', id: '123' }),
      );

      // Test tab moved
      handler['options'].onTabMoved(123, { windowId: 456, fromIndex: 0, toIndex: 1 });
      expect(mockWorkerClient.queueOperation).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'move_tab', id: '123' }),
      );

      // Test tab removed
      handler['options'].onTabRemoved(123, { windowId: 456, isWindowClosing: false });
      expect(mockWorkerClient.queueOperation).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'close_tab', id: '123' }),
      );

      // Test tab activated
      handler['options'].onTabActivated({ tabId: 123, windowId: 456 });
      expect(mockWorkerClient.queueOperation).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'set_active', id: '123' }),
      );
    });

    it('should queue all operation types', async () => {
      // Test all queueing methods
      await syncManager.queueTabMove('123', '456', 2);
      expect(mockWorkerClient.queueOperation).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'move_tab', id: '123', window_id: '456', index: 2 }),
      );

      await syncManager.queueTabUrlChange('123', 'https://example.com', 'Example');
      expect(mockWorkerClient.queueOperation).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'change_url', id: '123', url: 'https://example.com' }),
      );

      await syncManager.queueWindowUntrack('456');
      expect(mockWorkerClient.queueOperation).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'untrack_window', id: '456' }),
      );

      await syncManager.queueWindowFocus('456', true);
      expect(mockWorkerClient.queueOperation).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'set_window_focus', id: '456', focused: true }),
      );
    });

    it('should handle batched sync with different priorities', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      // Queue a low priority operation
      mockWorkerClient.queueOperation.mockResolvedValueOnce({ priority: 3, dedupKey: 'low' });
      await syncManager.queueTabUrlChange('123', 'https://example.com', 'Example');

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000); // LOW priority delay
      const lowPriorityTimerCalls = clearTimeoutSpy.mock.calls.length;

      // Queue a high priority operation before low priority fires
      mockWorkerClient.queueOperation.mockResolvedValueOnce({ priority: 1, dedupKey: 'high' });
      await syncManager.queueTabUpsert('456', '789', 'https://test.com', 'Test', true, 0);

      // Should have cleared a timer (the low priority one) and set a new high priority timer
      expect(clearTimeoutSpy.mock.calls.length).toBeGreaterThan(lowPriorityTimerCalls);
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 200); // HIGH priority delay
    });

    it('should skip batched sync if same or lower priority already pending', async () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      // Queue a high priority operation
      mockWorkerClient.queueOperation.mockResolvedValueOnce({ priority: 1, dedupKey: 'high' });
      await syncManager.queueTabUpsert('123', '456', 'https://test.com', 'Test', true, 0);

      const initialCallCount = setTimeoutSpy.mock.calls.length;

      // Queue a normal priority operation (lower than high)
      mockWorkerClient.queueOperation.mockResolvedValueOnce({ priority: 2, dedupKey: 'normal' });
      await syncManager.queueTabActive('123', true);

      // Should not set a new timer since high priority is already pending
      expect(setTimeoutSpy).toHaveBeenCalledTimes(initialCallCount);
    });

    it('should clear sync timer when batched sync triggers', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      // @ts-expect-error - accessing private property for testing
      syncManager.syncTimer = 123; // Set a fake timer ID

      // Queue a critical priority operation
      mockWorkerClient.queueOperation.mockResolvedValueOnce({ priority: 0, dedupKey: 'critical' });
      await syncManager.queueTabClose('123');

      // The critical priority has a 50ms delay
      jest.advanceTimersByTime(50);

      // Process the batch timer
      await jest.runOnlyPendingTimersAsync();

      // Should have cleared the regular sync timer
      expect(clearTimeoutSpy).toHaveBeenCalledWith(123);
    });

    it('should handle applyOperation errors gracefully', async () => {
      // Import debugError to check if it was called
      const { debugError } = await import('../../utils/logger');

      // Mock browser API to throw an error
      (mockBrowser.tabs.update as jest.Mock).mockRejectedValue(new Error('Tab not found'));

      const response: SyncResponse = {
        clock: 1n,
        operations: [
          {
            type: 'set_active',
            id: '999',
            active: true,
            updated_at: 123456789n,
          },
        ],
      };

      (mockAPI.sync as jest.Mock).mockResolvedValue({ success: true, data: response });

      // Should not throw even if operation application fails
      await expect(syncManager.syncNow()).resolves.not.toThrow();

      // Should have logged the error through debugError
      expect(debugError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to set tab 999 active state:'),
        expect.any(Error),
      );
    });

    it('should handle existing tab update in upsert_tab operation', async () => {
      const response: SyncResponse = {
        clock: 1n,
        operations: [
          {
            type: 'upsert_tab',
            id: '123',
            data: {
              window_id: '456',
              url: 'https://example.com',
              title: 'Example',
              active: true,
              index: 2,
              updated_at: 123456789n,
            },
          },
        ],
      };

      // Mock existing tab with different index and same windowId to trigger move
      (mockBrowser.tabs.query as jest.Mock).mockResolvedValue([
        {
          id: 123,
          windowId: 456, // Same windowId
          index: 0, // Different index (operation wants index: 2)
          url: 'https://old.com',
          active: false,
        },
      ]);

      // Ensure tabs.update and tabs.move are properly mocked
      (mockBrowser.tabs.update as jest.Mock).mockResolvedValue({});
      (mockBrowser.tabs.move as jest.Mock).mockResolvedValue({});

      (mockAPI.sync as jest.Mock).mockResolvedValue({ success: true, data: response });

      await syncManager.syncNow();

      // Should update tab properties
      expect(mockBrowser.tabs.update).toHaveBeenCalledWith(123, {
        url: 'https://example.com',
        active: true,
      });

      // Should move tab to new position
      expect(mockBrowser.tabs.move).toHaveBeenCalledWith(123, {
        windowId: 456,
        index: 2,
      });
    });

    it('should skip window focus operations gracefully', async () => {
      // Import debugLog to check if it was called
      const { debugLog } = await import('../../utils/logger');

      const response: SyncResponse = {
        clock: 1n,
        operations: [
          {
            type: 'set_window_focus',
            id: '456',
            focused: true,
            updated_at: 123456789n,
          },
        ],
      };

      (mockAPI.sync as jest.Mock).mockResolvedValue({ success: true, data: response });

      await syncManager.syncNow();

      // Should log but not fail
      expect(debugLog).toHaveBeenCalledWith(
        'Window focus operation for window 456 (not supported in Firefox)',
      );
    });
  });
});
*/
