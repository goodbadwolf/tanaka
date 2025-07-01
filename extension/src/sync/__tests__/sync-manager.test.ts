import { SyncManager } from '../sync-manager';
import { TanakaAPI } from '../../api/api';
import { WindowTracker } from '../window-tracker';
import { createMockBrowser } from '../../browser/__mocks__';
import type { IBrowser } from '../../browser/core';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { SyncResponse, CrdtOperation } from '../../api/sync';
import { ExtensionError } from '../../error/types';

// Mock dependencies
jest.mock('../../api/api');
jest.mock('../../utils/logger', () => ({
  debugLog: jest.fn(),
  debugError: jest.fn(),
}));

describe('SyncManager', () => {
  let syncManager: SyncManager;
  let mockApi: jest.Mocked<TanakaAPI>;
  let mockBrowser: IBrowser;
  let windowTracker: WindowTracker;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Mock webextension-polyfill for TabEventHandler
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const browser = require('webextension-polyfill');
    if (!browser.tabs.onActivated) {
      browser.tabs.onActivated = {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      };
    }

    // Create mocks
    mockApi = new TanakaAPI('', '') as jest.Mocked<TanakaAPI>;
    mockBrowser = createMockBrowser();
    windowTracker = new WindowTracker();

    // Setup default mock responses
    (mockBrowser.localStorage.get as jest.Mock).mockResolvedValue({});
    (mockBrowser.localStorage.set as jest.Mock).mockResolvedValue(undefined);

    // Create SyncManager instance
    syncManager = new SyncManager({
      api: mockApi,
      windowTracker,
      browser: mockBrowser,
      syncIntervalMs: 5000,
      deviceId: 'test-device-123',
    });
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      const customSyncManager = new SyncManager({
        api: mockApi,
        windowTracker,
        browser: mockBrowser,
        syncIntervalMs: 10000,
        deviceId: 'custom-device-456',
      });

      expect(customSyncManager).toBeDefined();
    });

    it('should use default values when not provided', () => {
      const defaultSyncManager = new SyncManager({
        api: mockApi,
        windowTracker,
        browser: mockBrowser,
      });

      expect(defaultSyncManager).toBeDefined();
    });
  });

  describe('start', () => {
    it('should load persisted state and schedule sync check', async () => {
      // Setup persisted state
      (mockBrowser.localStorage.get as jest.Mock).mockResolvedValue({
        deviceId: 'persisted-device-789',
        lamportClock: '100',
        lastSyncClock: '95',
      });

      // Use fake timers
      jest.useFakeTimers();

      // Start sync manager
      syncManager.start();

      // Wait for loadPersistedState to complete
      await Promise.resolve();

      // Verify localStorage.get was called
      expect(mockBrowser.localStorage.get).toHaveBeenCalledWith([
        'deviceId',
        'lamportClock',
        'lastSyncClock',
      ]);

      // Verify timer was scheduled
      expect(jest.getTimerCount()).toBe(1);

      // Cleanup
      jest.useRealTimers();
    });
  });

  describe('stop', () => {
    it('should clear sync timer', () => {
      // Use fake timers
      jest.useFakeTimers();

      // Start sync manager
      syncManager.start();

      // Verify timer is set
      expect(jest.getTimerCount()).toBe(1);

      // Stop sync manager
      syncManager.stop();

      // Verify timer is cleared
      expect(jest.getTimerCount()).toBe(0);

      // Cleanup
      jest.useRealTimers();
    });
  });

  describe('restart', () => {
    it('should stop and start sync manager', async () => {
      // Use fake timers
      jest.useFakeTimers();

      // Start sync manager
      syncManager.start();

      // Verify timer is set
      expect(jest.getTimerCount()).toBe(1);

      // Restart sync manager
      await syncManager.restart();

      // Verify timer is still set (stop + start)
      expect(jest.getTimerCount()).toBe(1);

      // Cleanup
      jest.useRealTimers();
    });
  });

  describe('isRunning', () => {
    it('should return false when not started', () => {
      expect(syncManager.isRunning()).toBe(false);
    });

    it('should return true when started', () => {
      jest.useFakeTimers();

      syncManager.start();
      expect(syncManager.isRunning()).toBe(true);

      jest.useRealTimers();
    });

    it('should return false when stopped', () => {
      jest.useFakeTimers();

      syncManager.start();
      syncManager.stop();
      expect(syncManager.isRunning()).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('sync', () => {
    it('should successfully sync with server', async () => {
      // Mock successful API response
      const mockResponse: SyncResponse = {
        clock: 200n,
        operations: [],
      };

      mockApi.sync.mockResolvedValue({
        success: true,
        data: mockResponse,
      });

      // Start sync manager
      syncManager.start();

      // Perform sync
      const result = await syncManager.syncNow();

      // Verify result
      expect(result.isOk()).toBe(true);

      // Verify API was called
      expect(mockApi.sync).toHaveBeenCalledWith({
        clock: 0n,
        device_id: 'test-device-123',
        since_clock: null,
        operations: [],
      });

      // Verify state was persisted
      expect(mockBrowser.localStorage.set).toHaveBeenCalledWith({
        deviceId: 'test-device-123',
        lamportClock: '200',
        lastSyncClock: '200',
      });
    });

    it('should handle sync failure', async () => {
      // Mock API failure
      const error = new ExtensionError('NETWORK_FAILURE', 'Network error');
      mockApi.sync.mockResolvedValue({
        success: false,
        error,
      });

      // Perform sync
      const result = await syncManager.syncNow();

      // Verify result
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe(error);
    });

    it('should send queued operations', async () => {
      // Queue some operations
      syncManager.queueTabUpsert('tab-1', 'window-1', 'https://example.com', 'Example', true, 0);
      syncManager.queueTabClose('tab-2');

      // Mock successful API response
      const mockResponse: SyncResponse = {
        clock: 202n,
        operations: [],
      };

      mockApi.sync.mockResolvedValue({
        success: true,
        data: mockResponse,
      });

      // Perform sync
      const result = await syncManager.syncNow();

      // Verify result
      expect(result.isOk()).toBe(true);

      // Verify API was called with operations
      expect(mockApi.sync).toHaveBeenCalledWith({
        clock: 2n, // Two operations queued
        device_id: 'test-device-123',
        since_clock: null,
        operations: [
          {
            type: 'upsert_tab',
            id: 'tab-1',
            data: {
              window_id: 'window-1',
              url: 'https://example.com',
              title: 'Example',
              active: true,
              index: 0,
              updated_at: expect.any(BigInt),
            },
          },
          {
            type: 'close_tab',
            id: 'tab-2',
            closed_at: expect.any(BigInt),
          },
        ],
      });
    });

    it('should re-queue operations on failure', async () => {
      // Queue some operations
      syncManager.queueTabUpsert('tab-1', 'window-1', 'https://example.com', 'Example', true, 0);

      // Mock API failure
      const error = new ExtensionError('NETWORK_FAILURE', 'Network error');
      mockApi.sync.mockResolvedValue({
        success: false,
        error,
      });

      // Perform sync
      const result = await syncManager.syncNow();

      // Verify result is error
      expect(result.isErr()).toBe(true);

      // Mock successful API response for second sync
      const mockResponse: SyncResponse = {
        clock: 201n,
        operations: [],
      };

      mockApi.sync.mockResolvedValue({
        success: true,
        data: mockResponse,
      });

      // Perform sync again
      const result2 = await syncManager.syncNow();

      // Verify result is success
      expect(result2.isOk()).toBe(true);

      // Verify operations were sent again
      expect(mockApi.sync).toHaveBeenLastCalledWith(
        expect.objectContaining({
          operations: [
            expect.objectContaining({
              type: 'upsert_tab',
              id: 'tab-1',
            }),
          ],
        }),
      );
    });
  });

  describe('queueTabUpsert', () => {
    it('should queue tab upsert operation', () => {
      syncManager.queueTabUpsert('tab-1', 'window-1', 'https://example.com', 'Example', true, 0);

      // Verify operation was queued by syncing
      mockApi.sync.mockResolvedValue({
        success: true,
        data: { clock: 201n, operations: [] },
      });

      syncManager.syncNow();

      expect(mockApi.sync).toHaveBeenCalledWith(
        expect.objectContaining({
          operations: [
            expect.objectContaining({
              type: 'upsert_tab',
              id: 'tab-1',
              data: expect.objectContaining({
                window_id: 'window-1',
                url: 'https://example.com',
                title: 'Example',
                active: true,
                index: 0,
              }),
            }),
          ],
        }),
      );
    });
  });

  describe('queueTabClose', () => {
    it('should queue tab close operation', () => {
      syncManager.queueTabClose('tab-1');

      // Verify operation was queued by syncing
      mockApi.sync.mockResolvedValue({
        success: true,
        data: { clock: 201n, operations: [] },
      });

      syncManager.syncNow();

      expect(mockApi.sync).toHaveBeenCalledWith(
        expect.objectContaining({
          operations: [
            expect.objectContaining({
              type: 'close_tab',
              id: 'tab-1',
              closed_at: expect.any(BigInt),
            }),
          ],
        }),
      );
    });
  });

  describe('queueTabActive', () => {
    it('should queue tab active operation', () => {
      syncManager.queueTabActive('tab-1', true);

      // Verify operation was queued by syncing
      mockApi.sync.mockResolvedValue({
        success: true,
        data: { clock: 201n, operations: [] },
      });

      syncManager.syncNow();

      expect(mockApi.sync).toHaveBeenCalledWith(
        expect.objectContaining({
          operations: [
            expect.objectContaining({
              type: 'set_active',
              id: 'tab-1',
              active: true,
              updated_at: expect.any(BigInt),
            }),
          ],
        }),
      );
    });
  });

  describe('queueTabMove', () => {
    it('should queue tab move operation', () => {
      syncManager.queueTabMove('tab-1', 'window-2', 3);

      // Verify operation was queued by syncing
      mockApi.sync.mockResolvedValue({
        success: true,
        data: { clock: 201n, operations: [] },
      });

      syncManager.syncNow();

      expect(mockApi.sync).toHaveBeenCalledWith(
        expect.objectContaining({
          operations: [
            expect.objectContaining({
              type: 'move_tab',
              id: 'tab-1',
              window_id: 'window-2',
              index: 3,
              updated_at: expect.any(BigInt),
            }),
          ],
        }),
      );
    });
  });

  describe('queueTabUrlChange', () => {
    it('should queue tab URL change operation', () => {
      syncManager.queueTabUrlChange('tab-1', 'https://new-url.com', 'New Title');

      // Verify operation was queued by syncing
      mockApi.sync.mockResolvedValue({
        success: true,
        data: { clock: 201n, operations: [] },
      });

      syncManager.syncNow();

      expect(mockApi.sync).toHaveBeenCalledWith(
        expect.objectContaining({
          operations: [
            expect.objectContaining({
              type: 'change_url',
              id: 'tab-1',
              url: 'https://new-url.com',
              title: 'New Title',
              updated_at: expect.any(BigInt),
            }),
          ],
        }),
      );
    });
  });

  describe('queueWindowTrack', () => {
    it('should queue window track operation', () => {
      syncManager.queueWindowTrack('window-1', true);

      // Verify operation was queued by syncing
      mockApi.sync.mockResolvedValue({
        success: true,
        data: { clock: 201n, operations: [] },
      });

      syncManager.syncNow();

      expect(mockApi.sync).toHaveBeenCalledWith(
        expect.objectContaining({
          operations: [
            expect.objectContaining({
              type: 'track_window',
              id: 'window-1',
              tracked: true,
              updated_at: expect.any(BigInt),
            }),
          ],
        }),
      );
    });
  });

  describe('queueWindowUntrack', () => {
    it('should queue window untrack operation', () => {
      syncManager.queueWindowUntrack('window-1');

      // Verify operation was queued by syncing
      mockApi.sync.mockResolvedValue({
        success: true,
        data: { clock: 201n, operations: [] },
      });

      syncManager.syncNow();

      expect(mockApi.sync).toHaveBeenCalledWith(
        expect.objectContaining({
          operations: [
            expect.objectContaining({
              type: 'untrack_window',
              id: 'window-1',
              updated_at: expect.any(BigInt),
            }),
          ],
        }),
      );
    });
  });

  describe('queueWindowFocus', () => {
    it('should queue window focus operation', () => {
      syncManager.queueWindowFocus('window-1', true);

      // Verify operation was queued by syncing
      mockApi.sync.mockResolvedValue({
        success: true,
        data: { clock: 201n, operations: [] },
      });

      syncManager.syncNow();

      expect(mockApi.sync).toHaveBeenCalledWith(
        expect.objectContaining({
          operations: [
            expect.objectContaining({
              type: 'set_window_focus',
              id: 'window-1',
              focused: true,
              updated_at: expect.any(BigInt),
            }),
          ],
        }),
      );
    });
  });

  describe('setupTabEventHandler', () => {
    it('should create and start tab event handler', async () => {
      // Track a window
      windowTracker.track(123);

      // Setup tab event handler
      const handler = await syncManager.setupTabEventHandler();

      // Verify handler was created
      expect(handler).toBeDefined();

      // Verify handler has correct callbacks - we'll test the integration
      // by checking that operations are queued when events happen
    });
  });

  describe('loadPersistedState', () => {
    it('should handle missing persisted state', async () => {
      // Mock empty storage
      (mockBrowser.localStorage.get as jest.Mock).mockResolvedValue({});

      // Create new sync manager which will call loadPersistedState
      const newSyncManager = new SyncManager({
        api: mockApi,
        windowTracker,
        browser: mockBrowser,
        deviceId: 'test-device-456',
      });

      newSyncManager.start();

      // Wait for async operations
      await Promise.resolve();

      // Verify device ID was persisted
      expect(mockBrowser.localStorage.set).toHaveBeenCalledWith({
        deviceId: 'test-device-456',
      });
    });

    it('should handle errors in loadPersistedState', async () => {
      // Mock storage error
      (mockBrowser.localStorage.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

      // Create new sync manager
      const newSyncManager = new SyncManager({
        api: mockApi,
        windowTracker,
        browser: mockBrowser,
      });

      // Start should not throw even if loadPersistedState fails
      expect(() => newSyncManager.start()).not.toThrow();
    });
  });

  describe('persistState', () => {
    it('should handle errors in persistState', async () => {
      // Mock storage error
      (mockBrowser.localStorage.set as jest.Mock).mockRejectedValue(new Error('Storage error'));

      // Mock successful sync response
      const mockResponse: SyncResponse = {
        clock: 200n,
        operations: [],
      };

      mockApi.sync.mockResolvedValue({
        success: true,
        data: mockResponse,
      });

      // Perform sync - should not throw even if persistState fails
      const result = await syncManager.syncNow();

      // Verify sync succeeded despite storage error
      expect(result.isOk()).toBe(true);
    });
  });

  describe('applyOperation', () => {
    it('should apply upsert_tab operation for new tab', async () => {
      // Mock no existing tabs
      (mockBrowser.tabs.query as jest.Mock).mockResolvedValue([]);
      (mockBrowser.tabs.create as jest.Mock).mockResolvedValue({ id: 1 });

      // Apply operation
      const operation: CrdtOperation = {
        type: 'upsert_tab',
        id: '1',
        data: {
          window_id: '123',
          url: 'https://example.com',
          title: 'Example',
          active: true,
          index: 0,
          updated_at: BigInt(Date.now()),
        },
      };

      // Use reflection to test private method
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (syncManager as any).applyOperation(operation);

      // Verify tab was created
      expect(mockBrowser.tabs.create).toHaveBeenCalledWith({
        windowId: 123,
        url: 'https://example.com',
        active: true,
        index: 0,
      });
    });

    it('should apply upsert_tab operation for existing tab', async () => {
      // Mock existing tab
      const existingTab = { id: 1, windowId: 123, index: 0 };
      (mockBrowser.tabs.query as jest.Mock).mockResolvedValue([existingTab]);
      (mockBrowser.tabs.update as jest.Mock).mockResolvedValue({ id: 1 });
      (mockBrowser.tabs.move as jest.Mock).mockResolvedValue({ id: 1 });

      // Apply operation with different index
      const operation: CrdtOperation = {
        type: 'upsert_tab',
        id: '1',
        data: {
          window_id: '123',
          url: 'https://updated.com',
          title: 'Updated',
          active: false,
          index: 2,
          updated_at: BigInt(Date.now()),
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (syncManager as any).applyOperation(operation);

      // Verify tab was updated and moved
      expect(mockBrowser.tabs.update).toHaveBeenCalledWith(1, {
        url: 'https://updated.com',
        active: false,
      });
      expect(mockBrowser.tabs.move).toHaveBeenCalledWith(1, {
        windowId: 123,
        index: 2,
      });
    });

    it('should apply close_tab operation', async () => {
      (mockBrowser.tabs.remove as jest.Mock).mockResolvedValue(undefined);

      const operation: CrdtOperation = {
        type: 'close_tab',
        id: '5',
        closed_at: BigInt(Date.now()),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (syncManager as any).applyOperation(operation);

      expect(mockBrowser.tabs.remove).toHaveBeenCalledWith(5);
    });

    it('should handle error when closing non-existent tab', async () => {
      (mockBrowser.tabs.remove as jest.Mock).mockRejectedValue(new Error('Tab not found'));

      const operation: CrdtOperation = {
        type: 'close_tab',
        id: '999',
        closed_at: BigInt(Date.now()),
      };

      // Should not throw
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect((syncManager as any).applyOperation(operation)).resolves.not.toThrow();
    });

    it('should apply set_active operation', async () => {
      (mockBrowser.tabs.update as jest.Mock).mockResolvedValue({ id: 3 });

      const operation: CrdtOperation = {
        type: 'set_active',
        id: '3',
        active: true,
        updated_at: BigInt(Date.now()),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (syncManager as any).applyOperation(operation);

      expect(mockBrowser.tabs.update).toHaveBeenCalledWith(3, { active: true });
    });

    it('should apply move_tab operation', async () => {
      (mockBrowser.tabs.move as jest.Mock).mockResolvedValue({ id: 4 });

      const operation: CrdtOperation = {
        type: 'move_tab',
        id: '4',
        window_id: '456',
        index: 2,
        updated_at: BigInt(Date.now()),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (syncManager as any).applyOperation(operation);

      expect(mockBrowser.tabs.move).toHaveBeenCalledWith(4, {
        windowId: 456,
        index: 2,
      });
    });

    it('should apply change_url operation', async () => {
      (mockBrowser.tabs.update as jest.Mock).mockResolvedValue({ id: 5 });

      const operation: CrdtOperation = {
        type: 'change_url',
        id: '5',
        url: 'https://newurl.com',
        title: 'New Title',
        updated_at: BigInt(Date.now()),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (syncManager as any).applyOperation(operation);

      expect(mockBrowser.tabs.update).toHaveBeenCalledWith(5, {
        url: 'https://newurl.com',
      });
    });

    it('should apply track_window operation', async () => {
      const operation: CrdtOperation = {
        type: 'track_window',
        id: '789',
        tracked: true,
        updated_at: BigInt(Date.now()),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (syncManager as any).applyOperation(operation);

      expect(windowTracker.isTracked(789)).toBe(true);
    });

    it('should apply untrack_window operation', async () => {
      // First track the window
      windowTracker.track(999);
      expect(windowTracker.isTracked(999)).toBe(true);

      const operation: CrdtOperation = {
        type: 'untrack_window',
        id: '999',
        updated_at: BigInt(Date.now()),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (syncManager as any).applyOperation(operation);

      expect(windowTracker.isTracked(999)).toBe(false);
    });

    it('should apply set_window_focus operation (no-op in Firefox)', async () => {
      const operation: CrdtOperation = {
        type: 'set_window_focus',
        id: '123',
        focused: true,
        updated_at: BigInt(Date.now()),
      };

      // Should not throw (it's a no-op)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect((syncManager as any).applyOperation(operation)).resolves.not.toThrow();
    });
  });
});
