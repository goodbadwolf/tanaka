import { describe, it, expect, jest, beforeAll, beforeEach } from '@jest/globals';
import {
  createMockTanakaAPI,
  createMockWindowTracker,
  createMockSyncManager,
  createMockTabEventHandler,
  createMockUserSettingsManager,
  createMockMessageHandler,
} from '../test-utils/mock-factories';

// Create mock instances that will be reused
const mockTanakaAPIInstance = createMockTanakaAPI();
const mockWindowTrackerInstance = createMockWindowTracker();
const mockSyncManagerInstance = createMockSyncManager();
const mockTabEventHandlerInstance = createMockTabEventHandler();
const mockUserSettingsManagerInstance = createMockUserSettingsManager();
const mockMessageHandlerInstance = createMockMessageHandler();

// Create a messageListener variable
let messageListener: ((message: unknown) => Promise<unknown>) | undefined;

// Mock all dependencies before imports
jest.mock('webextension-polyfill', () => ({
  runtime: {
    onMessage: {
      addListener: jest.fn((listener: (message: unknown) => Promise<unknown>) => {
        messageListener = listener;
      }),
      removeListener: jest.fn(),
      hasListener: jest.fn(),
    },
  },
}));
jest.mock('../api/api', () => ({
  TanakaAPI: jest.fn(() => mockTanakaAPIInstance),
  browserTabToSyncTab: jest.fn(),
}));
jest.mock('../config/index', () => ({
  getConfig: jest.fn(() => ({
    serverUrl: 'https://test.tanaka.com',
  })),
}));
jest.mock('../sync', () => ({
  WindowTracker: jest.fn(() => mockWindowTrackerInstance),
  SyncManager: jest.fn(() => mockSyncManagerInstance),
  TabEventHandler: jest.fn(() => mockTabEventHandlerInstance),
  UserSettingsManager: jest.fn(() => mockUserSettingsManagerInstance),
  MessageHandler: jest.fn(() => mockMessageHandlerInstance),
}));
jest.mock('../utils/logger');

describe('BackgroundService', () => {
  beforeAll(async () => {
    // Import the background service once for all tests
    await import('../background');
    // Allow async initialization
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  describe('initialization', () => {
    it('should initialize all services with correct dependencies', async () => {
      // Import mocked modules to check they were called
      const { TanakaAPI } = await import('../api/api');
      const { WindowTracker, SyncManager, TabEventHandler, UserSettingsManager, MessageHandler } =
        await import('../sync');

      // Verify all services were instantiated
      expect(TanakaAPI).toHaveBeenCalledWith('https://test.tanaka.com');
      expect(WindowTracker).toHaveBeenCalled();
      expect(SyncManager).toHaveBeenCalledWith(mockTanakaAPIInstance, mockWindowTrackerInstance);
      expect(TabEventHandler).toHaveBeenCalledWith(
        mockWindowTrackerInstance,
        mockSyncManagerInstance,
      );
      expect(UserSettingsManager).toHaveBeenCalled();
      expect(MessageHandler).toHaveBeenCalledWith(
        mockWindowTrackerInstance,
        mockSyncManagerInstance,
      );
    });

    it('should load user settings and set auth token', () => {
      expect(mockUserSettingsManagerInstance.load).toHaveBeenCalled();
      expect(mockTanakaAPIInstance.setAuthToken).toHaveBeenCalledWith('test-token');
    });

    it('should setup listeners', async () => {
      const browser = await import('webextension-polyfill');

      // Verify tab event handler setup was called
      expect(mockTabEventHandlerInstance.setupListeners).toHaveBeenCalled();

      // Verify browser message listener was added
      expect(browser.default.runtime.onMessage.addListener).toHaveBeenCalled();
      expect(messageListener).toBeDefined();
    });

    it('should log initialization message', async () => {
      const { debugLog } = await import('../utils/logger');
      expect(debugLog).toHaveBeenCalledWith('Tanaka background service initialized');
    });
  });

  describe('message handling', () => {
    beforeEach(() => {
      // Clear mocks before message handling tests
      jest.clearAllMocks();
    });

    it('should handle SETTINGS_UPDATED message', async () => {
      expect(messageListener).toBeDefined();
      if (!messageListener) throw new Error('Message listener not set up');

      const message = { type: 'SETTINGS_UPDATED' };
      const result = await messageListener(message);

      // Should have reloaded settings
      expect(mockUserSettingsManagerInstance.load).toHaveBeenCalledTimes(1);
      expect(mockTanakaAPIInstance.setAuthToken).toHaveBeenCalledTimes(1);

      const { debugLog } = await import('../utils/logger');
      expect(debugLog).toHaveBeenCalledWith('Reinitialized with updated settings');
      expect(result).toEqual({ success: true });
    });

    it('should delegate other messages to MessageHandler', async () => {
      expect(messageListener).toBeDefined();
      if (!messageListener) throw new Error('Message listener not set up');

      const message = { type: 'OTHER_MESSAGE' };
      const expectedResponse = { success: true, data: 'test' };

      mockMessageHandlerInstance.handleMessage.mockResolvedValue(expectedResponse);

      const result = await messageListener(message);

      expect(mockMessageHandlerInstance.handleMessage).toHaveBeenCalledWith(message);
      expect(result).toEqual(expectedResponse);
    });
  });
});
