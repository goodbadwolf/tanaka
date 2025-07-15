import { SyncManagerWithWorker } from '../sync/sync-manager-with-worker';
import { createMockBrowser } from '../browser/__mocks__';
import { EXTENSION_PERMISSION_DENIED } from '../api/errors';
import type { TanakaAPI } from '../api/api';
import type { WindowTracker } from '../sync/window-tracker';

// Mock the CrdtWorkerClient
jest.mock('../workers/crdt-worker-client', () => ({
  CrdtWorkerClient: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    queueOperation: jest.fn().mockResolvedValue(undefined),
    deduplicateOperations: jest.fn().mockResolvedValue([]),
    updateState: jest.fn().mockResolvedValue(undefined),
    terminate: jest.fn(),
  })),
}));

describe('SyncManagerWithWorker - Permission Checks', () => {
  let syncManager: SyncManagerWithWorker;
  let mockBrowser: ReturnType<typeof createMockBrowser>;
  let mockApi: jest.Mocked<TanakaAPI>;
  let mockWindowTracker: jest.Mocked<WindowTracker>;

  beforeEach(() => {
    mockBrowser = createMockBrowser();

    mockApi = {
      sync: jest.fn().mockResolvedValue({ success: true, data: { clock: 1n, operations: [] } }),
      testConnection: jest
        .fn()
        .mockResolvedValue({ success: true, data: { message: 'OK', timestamp: Date.now() } }),
    } as jest.Mocked<TanakaAPI>;

    mockWindowTracker = {
      getTrackedWindows: jest.fn().mockResolvedValue([]),
      trackWindow: jest.fn().mockResolvedValue(undefined),
      untrackWindow: jest.fn().mockResolvedValue(undefined),
      isWindowTracked: jest.fn().mockResolvedValue(false),
    } as jest.Mocked<WindowTracker>;

    // Set up default permission behavior
    mockBrowser.permissions.contains = jest.fn().mockResolvedValue(true);
    mockBrowser.permissions.getAll = jest.fn().mockResolvedValue({
      permissions: ['tabs', 'storage'],
      origins: [],
    });

    syncManager = new SyncManagerWithWorker({
      api: mockApi,
      windowTracker: mockWindowTracker,
      browser: mockBrowser,
      syncIntervalMs: 5000,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sync with permission checks', () => {
    it('should sync successfully when all permissions are granted', async () => {
      mockBrowser.permissions.contains = jest.fn().mockResolvedValue(true);

      const result = await syncManager.sync();

      expect(result.isOk()).toBe(true);
      expect(mockBrowser.permissions.contains).toHaveBeenCalledWith({
        permissions: ['tabs', 'storage'],
      });
      expect(mockApi.sync).toHaveBeenCalled();
    });

    it('should fail sync when permissions are missing', async () => {
      mockBrowser.permissions.contains = jest.fn().mockResolvedValue(false);
      mockBrowser.permissions.getAll = jest.fn().mockResolvedValue({
        permissions: ['storage'], // Missing 'tabs'
        origins: [],
      });

      const result = await syncManager.sync();

      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error.code).toBe(EXTENSION_PERMISSION_DENIED);
      expect(error.message).toBe('Missing required permissions for sync');
      expect(error.context?.missingPermissions).toEqual(['tabs']);
      expect(mockApi.sync).not.toHaveBeenCalled();
    });

    it('should fail sync when permission check throws error', async () => {
      const permissionError = new Error('Permission API unavailable');
      mockBrowser.permissions.contains = jest.fn().mockRejectedValue(permissionError);

      const result = await syncManager.sync();

      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error.code).toBe(EXTENSION_PERMISSION_DENIED);
      expect(error.message).toBe('Failed to check permissions');
      expect(mockApi.sync).not.toHaveBeenCalled();
    });

    it('should include recovery actions when permissions are missing', async () => {
      mockBrowser.permissions.contains = jest.fn().mockResolvedValue(false);

      const result = await syncManager.sync();

      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error.recoveryActions).toContain('Grant the required permissions');
      expect(error.recoveryActions).toContain(
        'Click the extension icon and follow the permission prompt',
      );
    });

    it('should check permissions on every sync attempt', async () => {
      mockBrowser.permissions.contains = jest.fn().mockResolvedValue(true);

      // First sync
      await syncManager.sync();
      expect(mockBrowser.permissions.contains).toHaveBeenCalledTimes(1);

      // Second sync
      await syncManager.sync();
      expect(mockBrowser.permissions.contains).toHaveBeenCalledTimes(2);
    });

    it('should handle concurrent sync attempts with permission checks', async () => {
      mockBrowser.permissions.contains = jest.fn().mockResolvedValue(true);

      // Simulate a slow sync operation
      mockApi.sync = jest
        .fn()
        .mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(
                () => resolve({ success: true, data: { clock: 1n, operations: [] } }),
                100,
              ),
            ),
        );

      // Start first sync
      const sync1 = syncManager.sync();

      // Wait a tiny bit to ensure the first sync has set isSyncing = true
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Try to start second sync (should be skipped)
      const sync2 = syncManager.sync();

      const [result1, result2] = await Promise.all([sync1, sync2]);

      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);

      // Due to timing, permission check might happen once or twice
      // The important thing is that only one actual sync happens
      expect(mockApi.sync).toHaveBeenCalledTimes(1);
    });
  });
});
