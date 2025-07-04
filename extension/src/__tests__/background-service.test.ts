import 'reflect-metadata';
import { createTestContainer } from '../test/test-container';
import { BackgroundService } from '../background';
import { createMockBrowser } from '../browser/__mocks__';
import type { IBrowser } from '../browser/core';
import { TanakaAPI } from '../api/api';
import {
  SyncManager,
  TabEventHandler,
  MessageHandler,
  UserSettingsManager,
  WindowTracker,
} from '../sync';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../api/api');
jest.mock('../utils/logger', () => ({
  debugLog: jest.fn(),
  debugError: jest.fn(),
}));

// Mock webextension-polyfill
jest.mock('webextension-polyfill', () => ({
  __esModule: true,
  default: {
    tabs: {
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
    },
  },
}));

describe('BackgroundService with Sync v2', () => {
  let backgroundService: BackgroundService;
  let testContainer: ReturnType<typeof createTestContainer>;
  let mockBrowser: IBrowser;
  let mockApi: TanakaAPI;
  let mockSyncManager: SyncManager;
  let mockTabEventHandler: TabEventHandler;
  let mockUserSettingsManager: UserSettingsManager;
  let mockMessageHandler: MessageHandler;
  let mockWindowTracker: WindowTracker;

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
      syncV2: jest.fn(() =>
        Promise.resolve({ success: true, data: { clock: 1n, operations: [] } }),
      ),
      checkHealth: jest.fn(),
    } as unknown as TanakaAPI;

    mockSyncManager = {
      syncNow: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      restart: jest.fn(),
      isRunning: jest.fn(() => false),
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

    mockWindowTracker = {
      track: jest.fn(),
      untrack: jest.fn(),
      isTracked: jest.fn(() => true),
      getTrackedWindows: jest.fn(() => [1, 2]),
      getTrackedCount: jest.fn(() => 2),
      clear: jest.fn(),
    } as unknown as WindowTracker;

    // Register mocks
    testContainer.registerInstance(TanakaAPI, mockApi);
    testContainer.registerInstance(SyncManager, mockSyncManager);
    testContainer.registerInstance(TabEventHandler, mockTabEventHandler);
    testContainer.registerInstance(UserSettingsManager, mockUserSettingsManager);
    testContainer.registerInstance(MessageHandler, mockMessageHandler);
    testContainer.registerInstance(WindowTracker, mockWindowTracker);

    // Create background service
    backgroundService = new BackgroundService(testContainer);
  });

  describe('initialization', () => {
    it('initializes with Sync manager', async () => {
      await backgroundService.initialize();

      expect(mockApi.setAuthToken).toHaveBeenCalledWith('test-token');
      // The old sync manager's stop should be called during initialization
      expect(mockSyncManager.stop).toHaveBeenCalled();
    });

    it('reinitializes when settings change', async () => {
      await backgroundService.initialize();

      // Get the message listener
      const messageListener = (mockBrowser.runtime.onMessage.addListener as jest.Mock).mock
        .calls[0][0] as (message: unknown) => Promise<unknown>;

      // Change settings
      (mockUserSettingsManager.load as jest.Mock).mockResolvedValue({
        authToken: 'new-token',
        syncInterval: 10000,
      });

      await messageListener({ type: 'SETTINGS_UPDATED' });

      // Should have stopped the old sync manager
      expect(mockSyncManager.stop).toHaveBeenCalled();
    });
  });
});
