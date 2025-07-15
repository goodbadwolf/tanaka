/*
import { MessageHandler } from '../message-handler';
import { WindowTracker } from '../window-tracker';
import { SyncManager } from '../index';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../window-tracker');
jest.mock('../sync-manager-with-worker');
jest.mock('../../utils/logger', () => ({
  debugLog: jest.fn(),
  debugError: jest.fn(),
}));

describe('MessageHandler', () => {
  let messageHandler: MessageHandler;
  let mockWindowTracker: WindowTracker;
  let mockSyncManager: SyncManager;

  beforeEach(() => {
    mockWindowTracker = {
      isTracked: jest.fn(),
      track: jest.fn(),
      untrack: jest.fn(),
      getTrackedCount: jest.fn(),
      getTrackedWindows: jest.fn(),
      clear: jest.fn(),
    } as unknown as WindowTracker;

    mockSyncManager = {
      syncNow: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      restart: jest.fn(),
      isRunning: jest.fn(),
    } as unknown as SyncManager;

    messageHandler = new MessageHandler(mockWindowTracker, mockSyncManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleMessage', () => {
    it('returns error for invalid message format', async () => {
      const response = await messageHandler.handleMessage(null);
      expect(response).toEqual({ error: 'Invalid message format' });
    });

    it('returns error for message without type', async () => {
      const response = await messageHandler.handleMessage({ data: 'test' });
      expect(response).toEqual({ error: 'Invalid message format' });
    });

    it('returns error for unknown message type', async () => {
      const response = await messageHandler.handleMessage({ type: 'UNKNOWN_TYPE' });
      // asMessage returns null for unknown types, so we get "Invalid message format"
      expect(response).toEqual({ error: 'Invalid message format' });
    });
  });

  describe('TRACK_WINDOW message', () => {
    it('tracks window and starts sync manager', async () => {
      const message = { type: 'TRACK_WINDOW', windowId: 123 };

      const response = await messageHandler.handleMessage(message);

      expect(mockWindowTracker.track).toHaveBeenCalledWith(123);
      expect(mockSyncManager.start).toHaveBeenCalledTimes(1);
      expect(response).toEqual({ success: true });
    });

    it('returns error for TRACK_WINDOW without windowId', async () => {
      const message = { type: 'TRACK_WINDOW' };

      const response = await messageHandler.handleMessage(message);

      expect(response).toEqual({ error: 'Invalid message format' });
      expect(mockWindowTracker.track).not.toHaveBeenCalled();
      expect(mockSyncManager.start).not.toHaveBeenCalled();
    });

    it('returns error for TRACK_WINDOW with invalid windowId', async () => {
      const message = { type: 'TRACK_WINDOW', windowId: 'not-a-number' };

      const response = await messageHandler.handleMessage(message);

      expect(response).toEqual({ error: 'Invalid message format' });
      expect(mockWindowTracker.track).not.toHaveBeenCalled();
      expect(mockSyncManager.start).not.toHaveBeenCalled();
    });
  });

  describe('UNTRACK_WINDOW message', () => {
    it('untracks window and stops sync when no windows remain', async () => {
      const message = { type: 'UNTRACK_WINDOW', windowId: 123 };
      (mockWindowTracker.getTrackedCount as jest.Mock).mockReturnValue(0);

      const response = await messageHandler.handleMessage(message);

      expect(mockWindowTracker.untrack).toHaveBeenCalledWith(123);
      expect(mockWindowTracker.getTrackedCount).toHaveBeenCalled();
      expect(mockSyncManager.stop).toHaveBeenCalledTimes(1);
      expect(mockSyncManager.syncNow).not.toHaveBeenCalled();
      expect(response).toEqual({ success: true });
    });

    it('untracks window and syncs when other windows remain', async () => {
      const message = { type: 'UNTRACK_WINDOW', windowId: 123 };
      (mockWindowTracker.getTrackedCount as jest.Mock).mockReturnValue(2);

      const response = await messageHandler.handleMessage(message);

      expect(mockWindowTracker.untrack).toHaveBeenCalledWith(123);
      expect(mockWindowTracker.getTrackedCount).toHaveBeenCalled();
      expect(mockSyncManager.stop).not.toHaveBeenCalled();
      expect(mockSyncManager.syncNow).toHaveBeenCalledTimes(1);
      expect(response).toEqual({ success: true });
    });

    it('returns error for UNTRACK_WINDOW without windowId', async () => {
      const message = { type: 'UNTRACK_WINDOW' };

      const response = await messageHandler.handleMessage(message);

      expect(response).toEqual({ error: 'Invalid message format' });
      expect(mockWindowTracker.untrack).not.toHaveBeenCalled();
    });

    it('returns error for UNTRACK_WINDOW with invalid windowId', async () => {
      const message = { type: 'UNTRACK_WINDOW', windowId: 'not-a-number' };

      const response = await messageHandler.handleMessage(message);

      expect(response).toEqual({ error: 'Invalid message format' });
      expect(mockWindowTracker.untrack).not.toHaveBeenCalled();
    });
  });

  describe('GET_TRACKED_WINDOWS message', () => {
    it('returns tracked window IDs', async () => {
      const message = { type: 'GET_TRACKED_WINDOWS' };
      (mockWindowTracker.getTrackedWindows as jest.Mock).mockReturnValue([123, 456, 789]);

      const response = await messageHandler.handleMessage(message);

      expect(mockWindowTracker.getTrackedWindows).toHaveBeenCalled();
      expect(response).toEqual({ windowIds: [123, 456, 789] });
    });

    it('returns empty array when no windows are tracked', async () => {
      const message = { type: 'GET_TRACKED_WINDOWS' };
      (mockWindowTracker.getTrackedWindows as jest.Mock).mockReturnValue([]);

      const response = await messageHandler.handleMessage(message);

      expect(mockWindowTracker.getTrackedWindows).toHaveBeenCalled();
      expect(response).toEqual({ windowIds: [] });
    });

    it('returns response matching new MessageResponse type format', async () => {
      const message = { type: 'GET_TRACKED_WINDOWS' };
      (mockWindowTracker.getTrackedWindows as jest.Mock).mockReturnValue([123]);

      const response = await messageHandler.handleMessage(message);

      // Verify response matches { windowIds: number[]; titles?: string[] } format
      expect(response).toHaveProperty('windowIds');
      expect(Array.isArray(response.windowIds)).toBe(true);
      expect(response.windowIds).toEqual([123]);

      // Titles should be optional (undefined is fine)
      expect(response.titles).toBeUndefined();

      // Response should not have success or error properties for GET_TRACKED_WINDOWS
      expect(response).not.toHaveProperty('success');
      expect(response).not.toHaveProperty('error');
    });
  });

  describe('edge cases', () => {
    it('handles multiple messages in sequence', async () => {
      const trackMessage = { type: 'TRACK_WINDOW', windowId: 123 };
      const getWindowsMessage = { type: 'GET_TRACKED_WINDOWS' };
      const untrackMessage = { type: 'UNTRACK_WINDOW', windowId: 123 };

      (mockWindowTracker.getTrackedWindows as jest.Mock).mockReturnValue([123]);
      (mockWindowTracker.getTrackedCount as jest.Mock).mockReturnValue(0);

      const response1 = await messageHandler.handleMessage(trackMessage);
      expect(response1).toEqual({ success: true });

      const response2 = await messageHandler.handleMessage(getWindowsMessage);
      expect(response2).toEqual({ windowIds: [123] });

      const response3 = await messageHandler.handleMessage(untrackMessage);
      expect(response3).toEqual({ success: true });

      expect(mockSyncManager.start).toHaveBeenCalledTimes(1);
      expect(mockSyncManager.stop).toHaveBeenCalledTimes(1);
    });

    it('handles concurrent track requests for same window', async () => {
      const message = { type: 'TRACK_WINDOW', windowId: 123 };

      await Promise.all([
        messageHandler.handleMessage(message),
        messageHandler.handleMessage(message),
        messageHandler.handleMessage(message),
      ]);

      expect(mockWindowTracker.track).toHaveBeenCalledTimes(3);
      expect(mockWindowTracker.track).toHaveBeenCalledWith(123);
      expect(mockSyncManager.start).toHaveBeenCalledTimes(3);
    });
  });
});
*/
