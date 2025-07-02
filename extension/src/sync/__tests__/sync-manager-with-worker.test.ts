import { SyncManagerWithWorker } from '../sync-manager-with-worker';
import type { TanakaAPI } from '../../api/api';
import type { WindowTracker } from '../window-tracker';
import type { IBrowser } from '../../browser/core';
import type { CrdtOperation, SyncResponse } from '../../api/sync';
// Removed neverthrow imports since API uses different format
import { ExtensionError } from '../../error/types';

jest.mock('../../../src/workers/crdt-worker-client');

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
    jest.useRealTimers();
    syncManager.stop();
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
      await syncManager.queueTabActive('123', true);

      jest.advanceTimersByTime(1000);

      expect(mockWorkerClient.deduplicateOperations).toHaveBeenCalled();
    });

    it('should use error backoff on sync failures', async () => {
      // Mock first call to fail, second to succeed
      (mockAPI.sync as jest.Mock)
        .mockResolvedValueOnce({ success: false, error: ExtensionError.NetworkFailure })
        .mockResolvedValueOnce({ success: true, data: { clock: 1n, operations: [] } });

      // First sync should fail
      await syncManager.syncNow();
      expect(mockWorkerClient.deduplicateOperations).toHaveBeenCalledTimes(1);

      // Advance timers and run all pending timers
      jest.advanceTimersByTime(5000);
      jest.runAllTimers();

      // Allow promises to resolve
      await Promise.resolve();

      // Second sync should happen automatically due to timer
      expect(mockWorkerClient.deduplicateOperations).toHaveBeenCalledTimes(2);
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
      await syncManager.start();

      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      syncManager.stop();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });
});
