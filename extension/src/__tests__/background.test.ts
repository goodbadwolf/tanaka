import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock all dependencies before imports
jest.mock('webextension-polyfill');
jest.mock('../api/api');
jest.mock('../config/index');
jest.mock('../sync');

// Import mocked dependencies
import browser from 'webextension-polyfill';
import { TanakaAPI } from '../api/api';
import {
  WindowTracker,
  SyncManager,
  TabEventHandler,
  MessageHandler,
  UserSettingsManager,
} from '../sync';

// Get mocked constructors
const MockedTanakaAPI = TanakaAPI as jest.MockedClass<typeof TanakaAPI>;
const MockedWindowTracker = WindowTracker as jest.MockedClass<typeof WindowTracker>;
const MockedSyncManager = SyncManager as jest.MockedClass<typeof SyncManager>;
const MockedTabEventHandler = TabEventHandler as jest.MockedClass<typeof TabEventHandler>;
const MockedMessageHandler = MessageHandler as jest.MockedClass<typeof MessageHandler>;
const MockedUserSettingsManager = UserSettingsManager as jest.MockedClass<
  typeof UserSettingsManager
>;

describe('BackgroundService', () => {
  let mockBrowser: typeof browser;
  let mockApi: jest.Mocked<TanakaAPI>;
  let mockWindowTracker: jest.Mocked<WindowTracker>;
  let mockSyncManager: jest.Mocked<SyncManager>;
  let mockTabEventHandler: jest.Mocked<TabEventHandler>;
  let mockMessageHandler: jest.Mocked<MessageHandler>;
  let mockUserSettingsManager: jest.Mocked<UserSettingsManager>;
  let consoleLogSpy: ReturnType<typeof jest.spyOn>;

  // Store message listener for testing
  let messageListener: (message: unknown) => Promise<unknown>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup console spy
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    // Mock browser runtime
    mockBrowser = browser;
    (mockBrowser as unknown) = {
      ...mockBrowser,
      runtime: {
        ...mockBrowser.runtime,
        onMessage: {
          addListener: jest.fn((listener: (message: unknown) => Promise<unknown>) => {
            messageListener = listener;
          }),
        },
      },
    };

    // Config is already mocked via @env module mock

    // Mock API
    mockApi = {
      setAuthToken: jest.fn(),
    } as unknown as jest.Mocked<TanakaAPI>;
    MockedTanakaAPI.mockImplementation(() => mockApi);

    // Mock WindowTracker
    mockWindowTracker = {} as unknown as jest.Mocked<WindowTracker>;
    MockedWindowTracker.mockImplementation(() => mockWindowTracker);

    // Mock SyncManager
    mockSyncManager = {} as unknown as jest.Mocked<SyncManager>;
    MockedSyncManager.mockImplementation(() => mockSyncManager);

    // Mock TabEventHandler
    mockTabEventHandler = {
      setupListeners: jest.fn(),
    } as unknown as jest.Mocked<TabEventHandler>;
    MockedTabEventHandler.mockImplementation(() => mockTabEventHandler);

    // Mock MessageHandler
    mockMessageHandler = {
      handleMessage: jest.fn(),
    } as unknown as jest.Mocked<MessageHandler>;
    MockedMessageHandler.mockImplementation(() => mockMessageHandler);

    // Mock UserSettingsManager
    mockUserSettingsManager = {
      load: jest.fn(),
    } as unknown as jest.Mocked<UserSettingsManager>;
    mockUserSettingsManager.load.mockResolvedValue({
      authToken: 'test-token',
      syncInterval: 5000,
    });
    MockedUserSettingsManager.mockImplementation(() => mockUserSettingsManager);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    // Clean up the imported module to ensure fresh instance on next test
    jest.resetModules();
  });

  describe('initialization', () => {
    it('should initialize all services with correct dependencies', async () => {
      // Dynamically import to get fresh instance
      await import('../background');

      // Allow async initialization to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(MockedTanakaAPI).toHaveBeenCalledWith('https://test.tanaka.com');
      expect(MockedWindowTracker).toHaveBeenCalled();
      expect(MockedSyncManager).toHaveBeenCalledWith(mockApi, mockWindowTracker);
      expect(MockedTabEventHandler).toHaveBeenCalledWith(mockWindowTracker, mockSyncManager);
      expect(MockedUserSettingsManager).toHaveBeenCalled();
      expect(MockedMessageHandler).toHaveBeenCalledWith(mockWindowTracker, mockSyncManager);
    });

    it('should load user settings and set auth token', async () => {
      await import('../background');
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockUserSettingsManager.load).toHaveBeenCalled();
      expect(mockApi.setAuthToken).toHaveBeenCalledWith('test-token');
    });

    it('should setup listeners', async () => {
      await import('../background');
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockTabEventHandler.setupListeners).toHaveBeenCalled();
      expect(mockBrowser.runtime.onMessage.addListener).toHaveBeenCalled();
    });

    it('should log initialization message', async () => {
      await import('../background');
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(consoleLogSpy).toHaveBeenCalledWith('Tanaka background service initialized');
    });
  });

  describe('message handling', () => {
    beforeEach(async () => {
      await import('../background');
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    it('should handle SETTINGS_UPDATED message', async () => {
      const message = { type: 'SETTINGS_UPDATED' };
      const result = await messageListener(message);

      expect(mockUserSettingsManager.load).toHaveBeenCalledTimes(2); // Once on init, once on update
      expect(mockApi.setAuthToken).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy).toHaveBeenCalledWith('Reinitialized with updated settings');
      expect(result).toEqual({ success: true });
    });

    it('should delegate other messages to MessageHandler', async () => {
      const message = { type: 'OTHER_MESSAGE' };
      const expectedResponse = { success: true, data: 'test' };
      mockMessageHandler.handleMessage.mockResolvedValue(expectedResponse);

      const result = await messageListener(message);

      expect(mockMessageHandler.handleMessage).toHaveBeenCalledWith(message);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle null messages', async () => {
      const expectedResponse = { success: false };
      mockMessageHandler.handleMessage.mockResolvedValue(expectedResponse);

      const result = await messageListener(null);

      expect(mockMessageHandler.handleMessage).toHaveBeenCalledWith(null);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle settings update with new auth token', async () => {
      // Update the mock to return a different token
      mockUserSettingsManager.load.mockResolvedValue({
        authToken: 'new-test-token',
        syncInterval: 5000,
      });

      const message = { type: 'SETTINGS_UPDATED' };
      await messageListener(message);

      expect(mockApi.setAuthToken).toHaveBeenLastCalledWith('new-test-token');
    });
  });
});
