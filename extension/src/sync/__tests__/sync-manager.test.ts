import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { SyncManager } from '../sync-manager';
import type { TanakaAPI } from '../../api/api';
import type { WindowTracker } from '../window-tracker';
import type { IBrowser } from '../../browser/core';
import type { SyncRequest, SyncResponse } from '../../api/sync';
import { ExtensionError } from '../../error/types';

describe('SyncManager', () => {
  let mockApi: jest.Mocked<TanakaAPI>;
  let mockWindowTracker: jest.Mocked<WindowTracker>;
  let mockBrowser: jest.Mocked<IBrowser>;
  let syncManager: SyncManager;

  beforeEach(() => {
    jest.useFakeTimers();

    mockApi = {
      sync: jest.fn(),
      isConnected: jest.fn().mockReturnValue(true),
    } as unknown as jest.Mocked<TanakaAPI>;

    mockWindowTracker = {
      isTracked: jest.fn().mockReturnValue(true),
      track: jest.fn(),
      untrack: jest.fn(),
    } as unknown as jest.Mocked<WindowTracker>;

    mockBrowser = {
      localStorage: {
        get: jest.fn().mockResolvedValue({}),
        set: jest.fn().mockResolvedValue(undefined),
      },
      tabs: {
        query: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue(undefined),
        move: jest.fn().mockResolvedValue(undefined),
        create: jest.fn().mockResolvedValue(undefined),
        remove: jest.fn().mockResolvedValue(undefined),
      },
    } as unknown as jest.Mocked<IBrowser>;

    syncManager = new SyncManager({
      syncIntervalMs: 5000,
      api: mockApi,
      windowTracker: mockWindowTracker,
      browser: mockBrowser,
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Adaptive Intervals', () => {
    it('should use active interval when there is recent activity', async () => {
      const mockResponse: SyncResponse = {
        clock: 1n,
        operations: [],
      };
      let syncCallCount = 0;
      mockApi.sync.mockImplementation(async () => {
        syncCallCount++;
        return { success: true, data: { ...mockResponse, clock: BigInt(syncCallCount) } };
      });

      syncManager.start();
      syncManager.queueTabClose('123');

      // First sync happens after 50ms (CRITICAL priority)
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      await Promise.resolve();

      expect(mockApi.sync).toHaveBeenCalledTimes(1);

      // Let the sync complete and schedule the next one
      await Promise.resolve(); // sync completes
      await Promise.resolve(); // then() executes
      await Promise.resolve(); // scheduleSyncCheck runs

      // Now wait for the active interval (1000ms)
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();

      expect(mockApi.sync).toHaveBeenCalledTimes(2);
    });

    it('should use idle interval when there is no recent activity', async () => {
      const mockResponse: SyncResponse = {
        clock: 1n,
        operations: [],
      };
      mockApi.sync.mockResolvedValue({ success: true, data: mockResponse });

      syncManager.start();

      // Add an operation to trigger initial sync
      syncManager.queueTabUrlChange('1', 'https://example.com', 'Example');

      // Wait for LOW priority batch delay (1000ms)
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();
      expect(mockApi.sync).toHaveBeenCalledTimes(1);

      // Let the sync complete and schedule the next one
      await Promise.resolve(); // sync completes
      await Promise.resolve(); // then() executes
      await Promise.resolve(); // scheduleSyncCheck runs

      // Simulate idle period (35 seconds) - beyond activity threshold
      jest.advanceTimersByTime(35000);
      await Promise.resolve();

      // Next sync should use idle interval (10 seconds)
      jest.advanceTimersByTime(10000);
      await Promise.resolve();
      await Promise.resolve();
      expect(mockApi.sync).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff on errors', async () => {
      const error: ExtensionError = {
        code: 'NETWORK_ERROR',
        message: 'Network error',
      };
      mockApi.sync.mockResolvedValue({ success: false, error });

      syncManager.start();
      syncManager.queueTabClose('123');

      // First sync attempt
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      await Promise.resolve();
      expect(mockApi.sync).toHaveBeenCalledTimes(1);

      // Second sync with 5s backoff
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
      await Promise.resolve();
      expect(mockApi.sync).toHaveBeenCalledTimes(2);

      // Third sync with 10s backoff (exponential)
      jest.advanceTimersByTime(10000);
      await Promise.resolve();
      await Promise.resolve();
      expect(mockApi.sync).toHaveBeenCalledTimes(3);
    });
  });

  describe('Priority-based Batching', () => {
    it('should batch operations with different delays based on priority', async () => {
      const mockResponse: SyncResponse = {
        clock: 1n,
        operations: [],
      };
      mockApi.sync.mockResolvedValue({ success: true, data: mockResponse });

      syncManager.start();

      syncManager.queueTabUrlChange('1', 'https://example.com', 'Example');
      jest.advanceTimersByTime(100);
      expect(mockApi.sync).not.toHaveBeenCalled();

      syncManager.queueTabUpsert('2', '100', 'https://test.com', 'Test', false, 0);
      jest.advanceTimersByTime(100);
      expect(mockApi.sync).not.toHaveBeenCalled();

      syncManager.queueTabClose('3');
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      expect(mockApi.sync).toHaveBeenCalledTimes(1);

      const request = mockApi.sync.mock.calls[0][0] as SyncRequest;
      expect(request.operations).toHaveLength(3);
      expect(request.operations[0].type).toBe('close_tab');
      expect(request.operations[1].type).toBe('upsert_tab');
      expect(request.operations[2].type).toBe('change_url');
    });

    it('should override lower priority batch timers with higher priority operations', async () => {
      const mockResponse: SyncResponse = {
        clock: 1n,
        operations: [],
      };
      mockApi.sync.mockResolvedValue({ success: true, data: mockResponse });

      syncManager.start();

      syncManager.queueTabUrlChange('1', 'https://example.com', 'Example');
      jest.advanceTimersByTime(500);
      expect(mockApi.sync).not.toHaveBeenCalled();

      syncManager.queueWindowUntrack('100');
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      expect(mockApi.sync).toHaveBeenCalledTimes(1);
    });
  });

  describe('Operation Deduplication', () => {
    it('should deduplicate operations with the same dedup key', async () => {
      const mockResponse: SyncResponse = {
        clock: 1n,
        operations: [],
      };
      mockApi.sync.mockResolvedValue({ success: true, data: mockResponse });

      syncManager.start();

      // Queue multiple URL changes for the same tab
      syncManager.queueTabUrlChange('1', 'https://example.com', 'Example');

      // Small delay to ensure different timestamps
      jest.advanceTimersByTime(10);
      syncManager.queueTabUrlChange('1', 'https://example.com/page', 'Example Page');

      jest.advanceTimersByTime(10);
      syncManager.queueTabUrlChange('1', 'https://example.com/final', 'Final Page');

      // Wait for LOW priority batch delay
      jest.advanceTimersByTime(980); // 1000ms total
      await Promise.resolve();
      await Promise.resolve();

      expect(mockApi.sync).toHaveBeenCalledTimes(1);
      const request = mockApi.sync.mock.calls[0][0] as SyncRequest;
      expect(request.operations).toHaveLength(1);
      expect(request.operations[0].type).toBe('change_url');
      // Check that we got the latest URL change
      const urlOp = request.operations[0] as { url: string };
      expect(urlOp.url).toBe('https://example.com/final');
    });

    it('should not deduplicate operations with different dedup keys', async () => {
      const mockResponse: SyncResponse = {
        clock: 1n,
        operations: [],
      };
      mockApi.sync.mockResolvedValue({ success: true, data: mockResponse });

      syncManager.start();

      syncManager.queueTabUrlChange('1', 'https://example.com', 'Example');
      syncManager.queueTabUrlChange('2', 'https://test.com', 'Test');
      syncManager.queueTabUrlChange('3', 'https://demo.com', 'Demo');

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(mockApi.sync).toHaveBeenCalledTimes(1);
      const request = mockApi.sync.mock.calls[0][0] as SyncRequest;
      expect(request.operations).toHaveLength(3);
    });
  });

  describe('Queue Size Management', () => {
    it('should trigger sync early when queue size exceeds threshold', async () => {
      const mockResponse: SyncResponse = {
        clock: 1n,
        operations: [],
      };
      mockApi.sync.mockResolvedValue({ success: true, data: mockResponse });

      syncManager.start();

      for (let i = 0; i < 60; i++) {
        syncManager.queueTabUrlChange(`tab-${i}`, `https://example.com/${i}`, `Page ${i}`);
      }

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(mockApi.sync).toHaveBeenCalledTimes(1);
    });

    it('should drop oldest operations when queue is full', async () => {
      const mockResponse: SyncResponse = {
        clock: 1n,
        operations: [],
      };
      mockApi.sync
        .mockResolvedValueOnce({
          success: false,
          error: { code: 'NETWORK_ERROR', message: 'Error' },
        })
        .mockResolvedValueOnce({ success: true, data: mockResponse });

      syncManager.start();

      for (let i = 0; i < 1005; i++) {
        syncManager.queueTabUrlChange(`tab-${i}`, `https://example.com/${i}`, `Page ${i}`);
      }

      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();

      expect(mockApi.sync).toHaveBeenCalledTimes(1);

      // Sync again after backoff
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
      await Promise.resolve();

      expect(mockApi.sync).toHaveBeenCalledTimes(2);
      const request = mockApi.sync.mock.calls[1][0] as SyncRequest;
      expect(request.operations.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Error Recovery', () => {
    it('should re-queue operations on sync failure', async () => {
      const error: ExtensionError = {
        code: 'NETWORK_ERROR',
        message: 'Network error',
      };
      const mockResponse: SyncResponse = {
        clock: 2n,
        operations: [],
      };

      mockApi.sync
        .mockResolvedValueOnce({ success: false, error })
        .mockResolvedValueOnce({ success: true, data: mockResponse });

      syncManager.start();
      syncManager.queueTabClose('123');

      jest.advanceTimersByTime(50);
      await Promise.resolve();
      await Promise.resolve();
      expect(mockApi.sync).toHaveBeenCalledTimes(1);

      // Second sync with error backoff
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
      await Promise.resolve();
      expect(mockApi.sync).toHaveBeenCalledTimes(2);

      const request2 = mockApi.sync.mock.calls[1][0] as SyncRequest;
      expect(request2.operations).toHaveLength(1);
      expect(request2.operations[0].type).toBe('close_tab');
    });
  });
});
