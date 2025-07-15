/*
import { TabEventHandler, type TabEventCallbacks } from '../tab-event-handler';
import { WindowTracker } from '../window-tracker';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import browser from 'webextension-polyfill';
import type { Tab } from '../../browser/core';

// Mock the browser module
jest.mock('webextension-polyfill');

// Mock the logger
jest.mock('../../utils/logger', () => ({
  debugLog: jest.fn(),
  debugError: jest.fn(),
}));

describe('TabEventHandler', () => {
  let windowTracker: WindowTracker;
  let mockCallbacks: TabEventCallbacks;
  let tabEventHandler: TabEventHandler;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Ensure onActivated is mocked
    if (!browser.tabs.onActivated) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (browser.tabs as any).onActivated = {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      };
    }

    // Create window tracker
    windowTracker = new WindowTracker();

    // Create mock callbacks
    mockCallbacks = {
      onTabCreated: jest.fn(),
      onTabUpdated: jest.fn(),
      onTabMoved: jest.fn(),
      onTabRemoved: jest.fn(),
      onTabActivated: jest.fn(),
    };

    // Create tab event handler
    tabEventHandler = new TabEventHandler(windowTracker, mockCallbacks);
  });

  describe('start', () => {
    it('should set up all event listeners', () => {
      tabEventHandler.start();

      expect(browser.tabs.onCreated.addListener).toHaveBeenCalled();
      expect(browser.tabs.onRemoved.addListener).toHaveBeenCalled();
      expect(browser.tabs.onUpdated.addListener).toHaveBeenCalled();
      expect(browser.tabs.onMoved.addListener).toHaveBeenCalled();
      expect(browser.tabs.onActivated.addListener).toHaveBeenCalled();
      expect(browser.windows.onRemoved.addListener).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should remove all event listeners', () => {
      // Start to set up listeners
      tabEventHandler.start();

      // Clear mocks to check cleanup calls
      jest.clearAllMocks();

      // Cleanup
      tabEventHandler.cleanup();

      expect(browser.tabs.onCreated.removeListener).toHaveBeenCalled();
      expect(browser.tabs.onRemoved.removeListener).toHaveBeenCalled();
      expect(browser.tabs.onUpdated.removeListener).toHaveBeenCalled();
      expect(browser.tabs.onMoved.removeListener).toHaveBeenCalled();
      expect(browser.tabs.onActivated.removeListener).toHaveBeenCalled();
      expect(browser.windows.onRemoved.removeListener).toHaveBeenCalled();
    });
  });

  describe('handleTabCreated', () => {
    it('should call onTabCreated callback when tab is in tracked window', () => {
      // Track a window
      windowTracker.track(123);

      // Start the handler
      tabEventHandler.start();

      // Get the registered handler
      const handler = (browser.tabs.onCreated.addListener as jest.Mock).mock.calls[0][0];

      // Create a mock tab
      const mockTab: Tab = {
        id: 1,
        windowId: 123,
        index: 0,
        url: 'https://example.com',
        title: 'Example',
        active: true,
        pinned: false,
        incognito: false,
      };

      // Call the handler
      handler(mockTab);

      // Verify callback was called
      expect(mockCallbacks.onTabCreated).toHaveBeenCalledWith(mockTab);
    });

    it('should not call onTabCreated callback when tab is in untracked window', () => {
      // Do not track window 456
      windowTracker.track(123); // Track a different window

      // Start the handler
      tabEventHandler.start();

      // Get the registered handler
      const handler = (browser.tabs.onCreated.addListener as jest.Mock).mock.calls[0][0];

      // Create a mock tab in untracked window
      const mockTab: Tab = {
        id: 1,
        windowId: 456, // Untracked window
        index: 0,
        url: 'https://example.com',
        title: 'Example',
        active: true,
        pinned: false,
        incognito: false,
      };

      // Call the handler
      handler(mockTab);

      // Verify callback was NOT called
      expect(mockCallbacks.onTabCreated).not.toHaveBeenCalled();
    });
  });

  describe('handleTabRemoved', () => {
    it('should call onTabRemoved callback when tab is removed from tracked window', () => {
      // Track a window
      windowTracker.track(123);

      // Start the handler
      tabEventHandler.start();

      // Get the registered handler
      const handler = (browser.tabs.onRemoved.addListener as jest.Mock).mock.calls[0][0];

      // Create remove info
      const removeInfo = {
        windowId: 123,
        isWindowClosing: false,
      };

      // Call the handler
      handler(1, removeInfo);

      // Verify callback was called
      expect(mockCallbacks.onTabRemoved).toHaveBeenCalledWith(1, removeInfo);
    });

    it('should not call onTabRemoved callback when tab is removed from untracked window', () => {
      // Track a different window
      windowTracker.track(123);

      // Start the handler
      tabEventHandler.start();

      // Get the registered handler
      const handler = (browser.tabs.onRemoved.addListener as jest.Mock).mock.calls[0][0];

      // Create remove info for untracked window
      const removeInfo = {
        windowId: 456, // Untracked window
        isWindowClosing: false,
      };

      // Call the handler
      handler(1, removeInfo);

      // Verify callback was NOT called
      expect(mockCallbacks.onTabRemoved).not.toHaveBeenCalled();
    });
  });

  describe('handleTabUpdated', () => {
    it('should call onTabUpdated callback when tab is updated in tracked window', () => {
      // Track a window
      windowTracker.track(123);

      // Start the handler
      tabEventHandler.start();

      // Get the registered handler
      const handler = (browser.tabs.onUpdated.addListener as jest.Mock).mock.calls[0][0];

      // Create change info
      const changeInfo = {
        url: 'https://new-url.com',
        title: 'New Title',
      };

      // Create updated tab
      const tab: Tab = {
        id: 1,
        windowId: 123,
        index: 0,
        url: 'https://new-url.com',
        title: 'New Title',
        active: true,
        pinned: false,
        incognito: false,
      };

      // Call the handler
      handler(1, changeInfo, tab);

      // Verify callback was called
      expect(mockCallbacks.onTabUpdated).toHaveBeenCalledWith(1, changeInfo, tab);
    });

    it('should not call onTabUpdated callback when tab is updated in untracked window', () => {
      // Track a different window
      windowTracker.track(123);

      // Start the handler
      tabEventHandler.start();

      // Get the registered handler
      const handler = (browser.tabs.onUpdated.addListener as jest.Mock).mock.calls[0][0];

      // Create change info
      const changeInfo = {
        url: 'https://new-url.com',
      };

      // Create updated tab in untracked window
      const tab: Tab = {
        id: 1,
        windowId: 456, // Untracked window
        index: 0,
        url: 'https://new-url.com',
        title: 'New Title',
        active: true,
        pinned: false,
        incognito: false,
      };

      // Call the handler
      handler(1, changeInfo, tab);

      // Verify callback was NOT called
      expect(mockCallbacks.onTabUpdated).not.toHaveBeenCalled();
    });
  });

  describe('handleTabMoved', () => {
    it('should call onTabMoved callback when tab is moved in tracked window', () => {
      // Track a window
      windowTracker.track(123);

      // Start the handler
      tabEventHandler.start();

      // Get the registered handler
      const handler = (browser.tabs.onMoved.addListener as jest.Mock).mock.calls[0][0];

      // Create move info
      const moveInfo = {
        windowId: 123,
        fromIndex: 0,
        toIndex: 2,
      };

      // Call the handler
      handler(1, moveInfo);

      // Verify callback was called
      expect(mockCallbacks.onTabMoved).toHaveBeenCalledWith(1, moveInfo);
    });

    it('should not call onTabMoved callback when tab is moved in untracked window', () => {
      // Track a different window
      windowTracker.track(123);

      // Start the handler
      tabEventHandler.start();

      // Get the registered handler
      const handler = (browser.tabs.onMoved.addListener as jest.Mock).mock.calls[0][0];

      // Create move info for untracked window
      const moveInfo = {
        windowId: 456, // Untracked window
        fromIndex: 0,
        toIndex: 2,
      };

      // Call the handler
      handler(1, moveInfo);

      // Verify callback was NOT called
      expect(mockCallbacks.onTabMoved).not.toHaveBeenCalled();
    });
  });

  describe('handleTabActivated', () => {
    it('should call onTabActivated callback when tab is activated in tracked window', () => {
      // Track a window
      windowTracker.track(123);

      // Start the handler
      tabEventHandler.start();

      // Get the registered handler
      const handler = (browser.tabs.onActivated.addListener as jest.Mock).mock.calls[0][0];

      // Create active info
      const activeInfo = {
        tabId: 1,
        windowId: 123,
      };

      // Call the handler
      handler(activeInfo);

      // Verify callback was called
      expect(mockCallbacks.onTabActivated).toHaveBeenCalledWith(activeInfo);
    });

    it('should not call onTabActivated callback when tab is activated in untracked window', () => {
      // Track a different window
      windowTracker.track(123);

      // Start the handler
      tabEventHandler.start();

      // Get the registered handler
      const handler = (browser.tabs.onActivated.addListener as jest.Mock).mock.calls[0][0];

      // Create active info for untracked window
      const activeInfo = {
        tabId: 1,
        windowId: 456, // Untracked window
      };

      // Call the handler
      handler(activeInfo);

      // Verify callback was NOT called
      expect(mockCallbacks.onTabActivated).not.toHaveBeenCalled();
    });
  });

  describe('handleWindowRemoved', () => {
    it('should untrack window when window is removed', () => {
      // Track a window
      windowTracker.track(123);

      // Start the handler
      tabEventHandler.start();

      // Get the registered handler
      const handler = (browser.windows.onRemoved.addListener as jest.Mock).mock.calls[0][0];

      // Verify window is tracked
      expect(windowTracker.isTracked(123)).toBe(true);

      // Call the handler
      handler(123);

      // Verify window is no longer tracked
      expect(windowTracker.isTracked(123)).toBe(false);
    });
  });
});
*/
