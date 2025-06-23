import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { MessageHandler } from '../message-handler';
import type { WindowTracker } from '../window-tracker';
import type { SyncManager } from '../sync-manager';

// Mock core module
jest.mock('../../core', () => ({
  asMessage: jest.fn((msg: unknown) => {
    if (typeof msg === 'object' && msg !== null && 'type' in msg && 'windowId' in msg) {
      return msg;
    }
    if (typeof msg === 'object' && msg !== null && 'type' in msg) {
      return msg;
    }
    return null;
  }),
}));

describe('MessageHandler', () => {
  let messageHandler: MessageHandler;
  let mockWindowTracker: jest.Mocked<WindowTracker>;
  let mockSyncManager: jest.Mocked<SyncManager>;
  let consoleLogSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup console spy
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

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

    messageHandler = new MessageHandler(mockWindowTracker, mockSyncManager);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('handleMessage', () => {
    it('should return error for invalid message format', async () => {
      const result = await messageHandler.handleMessage(null);
      expect(result).toEqual({ error: 'Invalid message format' });
    });

    it('should return error for unknown message type', async () => {
      const result = await messageHandler.handleMessage({ type: 'UNKNOWN_TYPE' });
      expect(result).toEqual({ error: 'Unknown message type' });
    });
  });

  describe('TRACK_WINDOW message', () => {
    it('should track window and start sync manager', async () => {
      const message = { type: 'TRACK_WINDOW', windowId: 123 };
      const result = await messageHandler.handleMessage(message);

      expect(mockWindowTracker.track).toHaveBeenCalledWith(123);
      expect(consoleLogSpy).toHaveBeenCalledWith('Now tracking window:', 123);
      expect(mockSyncManager.start).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should handle multiple window tracking', async () => {
      await messageHandler.handleMessage({ type: 'TRACK_WINDOW', windowId: 123 });
      await messageHandler.handleMessage({ type: 'TRACK_WINDOW', windowId: 456 });

      expect(mockWindowTracker.track).toHaveBeenCalledTimes(2);
      expect(mockWindowTracker.track).toHaveBeenCalledWith(123);
      expect(mockWindowTracker.track).toHaveBeenCalledWith(456);
      expect(mockSyncManager.start).toHaveBeenCalledTimes(2);
    });
  });

  describe('UNTRACK_WINDOW message', () => {
    it('should untrack window and sync if other windows remain', async () => {
      mockWindowTracker.getTrackedCount.mockReturnValue(1);
      const message = { type: 'UNTRACK_WINDOW', windowId: 123 };
      const result = await messageHandler.handleMessage(message);

      expect(mockWindowTracker.untrack).toHaveBeenCalledWith(123);
      expect(consoleLogSpy).toHaveBeenCalledWith('Stopped tracking window:', 123);
      expect(mockSyncManager.syncNow).toHaveBeenCalled();
      expect(mockSyncManager.stop).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should stop sync manager when no windows remain', async () => {
      mockWindowTracker.getTrackedCount.mockReturnValue(0);
      const message = { type: 'UNTRACK_WINDOW', windowId: 123 };
      const result = await messageHandler.handleMessage(message);

      expect(mockWindowTracker.untrack).toHaveBeenCalledWith(123);
      expect(mockSyncManager.stop).toHaveBeenCalled();
      expect(mockSyncManager.syncNow).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should handle sync errors gracefully', async () => {
      mockWindowTracker.getTrackedCount.mockReturnValue(2);
      mockSyncManager.syncNow.mockRejectedValue(new Error('Sync failed'));
      
      const message = { type: 'UNTRACK_WINDOW', windowId: 123 };
      await expect(messageHandler.handleMessage(message)).rejects.toThrow('Sync failed');
    });
  });

  describe('GET_TRACKED_WINDOWS message', () => {
    it('should return tracked window IDs', async () => {
      const trackedWindows = [123, 456, 789];
      mockWindowTracker.getTrackedWindows.mockReturnValue(trackedWindows);

      const message = { type: 'GET_TRACKED_WINDOWS' };
      const result = await messageHandler.handleMessage(message);

      expect(mockWindowTracker.getTrackedWindows).toHaveBeenCalled();
      expect(result).toEqual({ windowIds: trackedWindows });
    });

    it('should return empty array when no windows tracked', async () => {
      mockWindowTracker.getTrackedWindows.mockReturnValue([]);

      const message = { type: 'GET_TRACKED_WINDOWS' };
      const result = await messageHandler.handleMessage(message);

      expect(result).toEqual({ windowIds: [] });
    });
  });

  describe('edge cases', () => {
    it('should handle string messages', async () => {
      const result = await messageHandler.handleMessage('invalid');
      expect(result).toEqual({ error: 'Invalid message format' });
    });

    it('should handle messages without windowId for TRACK_WINDOW', async () => {
      const message = { type: 'TRACK_WINDOW' };
      const result = await messageHandler.handleMessage(message);
      expect(result).toEqual({ error: 'Invalid message format' });
    });

    it('should handle messages without windowId for UNTRACK_WINDOW', async () => {
      const message = { type: 'UNTRACK_WINDOW' };
      const result = await messageHandler.handleMessage(message);
      expect(result).toEqual({ error: 'Invalid message format' });
    });
  });
});