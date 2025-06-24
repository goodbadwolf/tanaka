import 'reflect-metadata';
import { createTestContainer } from '../test/test-container';
import { BackgroundService } from '../background';
import { createMockBrowser } from '../browser/__mocks__';
import type { IBrowser } from '../browser/core';
import { TanakaAPI } from '../api/api';
import { SyncManager, TabEventHandler, MessageHandler, UserSettingsManager } from '../sync';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

jest.mock('../api/api');
jest.mock('../utils/logger', () => ({
  debugLog: jest.fn(),
  debugError: jest.fn(),
}));

describe('BackgroundService', () => {
  let backgroundService: BackgroundService;
  let testContainer: ReturnType<typeof createTestContainer>;
  let mockBrowser: IBrowser;
  let mockApi: TanakaAPI;
  let mockSyncManager: SyncManager;
  let mockTabEventHandler: TabEventHandler;
  let mockUserSettingsManager: UserSettingsManager;
  let mockMessageHandler: MessageHandler;
  let messageListener: (message: unknown) => Promise<unknown>;

  beforeEach(() => {
    testContainer = createTestContainer();
    testContainer.clearInstances();
    mockBrowser = createMockBrowser();

    // Register browser
    testContainer.register<IBrowser>('IBrowser', {
      useValue: mockBrowser,
    });

    // Create mocks
    mockApi = {
      setAuthToken: jest.fn(),
      syncTabs: jest.fn(),
      checkHealth: jest.fn(),
    } as unknown as TanakaAPI;

    mockSyncManager = {
      syncNow: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      restart: jest.fn(),
      isRunning: jest.fn(),
    } as unknown as SyncManager;

    mockTabEventHandler = {
      setupListeners: jest.fn(),
      cleanup: jest.fn(),
    } as unknown as TabEventHandler;

    mockUserSettingsManager = {
      load: jest.fn(() =>
        Promise.resolve({
          authToken: 'test-token',
          syncInterval: 5000,
        }),
      ),
      save: jest.fn(() => Promise.resolve()),
      clear: jest.fn(() => Promise.resolve()),
    } as unknown as UserSettingsManager;

    mockMessageHandler = {
      handleMessage: jest.fn(() => Promise.resolve({ success: true })),
    } as unknown as MessageHandler;

    // Register mocks
    testContainer.registerInstance(TanakaAPI, mockApi);
    testContainer.registerInstance(SyncManager, mockSyncManager);
    testContainer.registerInstance(TabEventHandler, mockTabEventHandler);
    testContainer.registerInstance(UserSettingsManager, mockUserSettingsManager);
    testContainer.registerInstance(MessageHandler, mockMessageHandler);

    // Create background service
    backgroundService = new BackgroundService(testContainer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('loads settings and sets up listeners', async () => {
      await backgroundService.initialize();

      expect(mockUserSettingsManager.load).toHaveBeenCalled();
      expect(mockApi.setAuthToken).toHaveBeenCalledWith('test-token');
      expect(mockTabEventHandler.setupListeners).toHaveBeenCalled();
      expect(mockBrowser.runtime.onMessage.addListener).toHaveBeenCalled();
    });

    it('handles settings with different auth token', async () => {
      (mockUserSettingsManager.load as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          authToken: 'different-token',
          syncInterval: 10000,
        }),
      );

      await backgroundService.initialize();

      expect(mockApi.setAuthToken).toHaveBeenCalledWith('different-token');
    });
  });

  describe('message handling', () => {
    beforeEach(async () => {
      await backgroundService.initialize();
      // Get the message listener that was registered
      messageListener = (mockBrowser.runtime.onMessage.addListener as jest.Mock).mock
        .calls[0][0] as (message: unknown) => Promise<unknown>;
    });

    it('delegates non-settings messages to MessageHandler', async () => {
      const message = { type: 'TRACK_WINDOW', windowId: 123 };
      (mockMessageHandler.handleMessage as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          success: true,
        }),
      );

      const response = await messageListener(message);

      expect(mockMessageHandler.handleMessage).toHaveBeenCalledWith(message);
      expect(response).toEqual({ success: true });
    });

    it('handles SETTINGS_UPDATED message directly', async () => {
      const message = { type: 'SETTINGS_UPDATED' };
      (mockSyncManager.isRunning as jest.Mock).mockReturnValue(true);

      const response = await messageListener(message);

      expect(mockUserSettingsManager.load).toHaveBeenCalledTimes(2); // Once in init, once in reinitialize
      expect(mockApi.setAuthToken).toHaveBeenCalledTimes(2);
      expect(mockSyncManager.isRunning).toHaveBeenCalled();
      expect(mockSyncManager.restart).toHaveBeenCalled();
      expect(response).toEqual({ success: true });
    });

    it('does not restart sync manager if not running', async () => {
      const message = { type: 'SETTINGS_UPDATED' };
      (mockSyncManager.isRunning as jest.Mock).mockReturnValue(false);

      await messageListener(message);

      expect(mockSyncManager.isRunning).toHaveBeenCalled();
      expect(mockSyncManager.restart).not.toHaveBeenCalled();
    });

    it('handles invalid messages', async () => {
      const message = null;
      (mockMessageHandler.handleMessage as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          error: 'Invalid message format',
        }),
      );

      const response = await messageListener(message);

      expect(mockMessageHandler.handleMessage).toHaveBeenCalledWith(null);
      expect(response).toEqual({ error: 'Invalid message format' });
    });
  });

  describe('cleanup', () => {
    it('cleans up event handlers and stops sync', () => {
      backgroundService.cleanup();

      expect(mockTabEventHandler.cleanup).toHaveBeenCalled();
      expect(mockSyncManager.stop).toHaveBeenCalled();
    });

    it('can be called multiple times safely', () => {
      backgroundService.cleanup();
      backgroundService.cleanup();

      expect(mockTabEventHandler.cleanup).toHaveBeenCalledTimes(2);
      expect(mockSyncManager.stop).toHaveBeenCalledTimes(2);
    });
  });

  describe('integration scenarios', () => {
    it('handles full lifecycle', async () => {
      // Initialize
      await backgroundService.initialize();
      expect(mockTabEventHandler.setupListeners).toHaveBeenCalled();

      // Get message listener
      messageListener = (mockBrowser.runtime.onMessage.addListener as jest.Mock).mock
        .calls[0][0] as (message: unknown) => Promise<unknown>;

      // Track a window
      await messageListener({ type: 'TRACK_WINDOW', windowId: 123 });
      expect(mockMessageHandler.handleMessage).toHaveBeenCalled();

      // Update settings
      (mockSyncManager.isRunning as jest.Mock).mockReturnValue(true);
      await messageListener({ type: 'SETTINGS_UPDATED' });
      expect(mockSyncManager.restart).toHaveBeenCalled();

      // Cleanup
      backgroundService.cleanup();
      expect(mockTabEventHandler.cleanup).toHaveBeenCalled();
      expect(mockSyncManager.stop).toHaveBeenCalled();
    });

    it('handles settings update with new token', async () => {
      await backgroundService.initialize();
      messageListener = (mockBrowser.runtime.onMessage.addListener as jest.Mock).mock
        .calls[0][0] as (message: unknown) => Promise<unknown>;

      // Change settings
      (mockUserSettingsManager.load as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          authToken: 'new-token',
          syncInterval: 3000,
        }),
      );
      (mockSyncManager.isRunning as jest.Mock).mockReturnValue(true);

      await messageListener({ type: 'SETTINGS_UPDATED' });

      expect(mockApi.setAuthToken).toHaveBeenCalledWith('new-token');
      expect(mockSyncManager.restart).toHaveBeenCalled();
    });
  });
});
