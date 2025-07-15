/*
import type { Tab } from '../core';
import { BrowserTabs } from '../tabs';

// Mock webextension-polyfill
jest.mock('webextension-polyfill', () => ({
  tabs: {
    query: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    move: jest.fn(),
    onCreated: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onUpdated: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onRemoved: {
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
}));

describe('BrowserTabs', () => {
  let tabs: BrowserTabs;
  let mockBrowser: {
    tabs: {
      query: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      remove: jest.Mock;
      move: jest.Mock;
      onCreated: {
        addListener: jest.Mock;
        removeListener: jest.Mock;
      };
      onUpdated: {
        addListener: jest.Mock;
        removeListener: jest.Mock;
      };
      onRemoved: {
        addListener: jest.Mock;
        removeListener: jest.Mock;
      };
      onMoved: {
        addListener: jest.Mock;
        removeListener: jest.Mock;
      };
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    tabs = new BrowserTabs();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mockBrowser = require('webextension-polyfill');
  });

  describe('query', () => {
    it('should query tabs with given parameters', async () => {
      const mockTabs: Tab[] = [
        {
          id: 1,
          windowId: 1,
          index: 0,
          url: 'https://example.com',
          title: 'Example',
          active: true,
          pinned: false,
        },
      ];

      mockBrowser.tabs.query.mockResolvedValue(mockTabs);

      const result = await tabs.query({ active: true });

      expect(mockBrowser.tabs.query).toHaveBeenCalledWith({ active: true });
      expect(result).toEqual(mockTabs);
    });

    it('should handle empty query results', async () => {
      mockBrowser.tabs.query.mockResolvedValue([]);

      const result = await tabs.query({ windowId: 999 });

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a new tab', async () => {
      const createProps = { url: 'https://example.com' };
      const mockTab: Tab = {
        id: 1,
        windowId: 1,
        index: 0,
        url: 'https://example.com',
        active: true,
        pinned: false,
      };

      mockBrowser.tabs.create.mockResolvedValue(mockTab);

      const result = await tabs.create(createProps);

      expect(mockBrowser.tabs.create).toHaveBeenCalledWith(createProps);
      expect(result).toEqual(mockTab);
    });
  });

  describe('update', () => {
    it('should update a tab', async () => {
      const tabId = 1;
      const updateProps = { url: 'https://updated.com' };
      const mockTab: Tab = {
        id: 1,
        windowId: 1,
        index: 0,
        url: 'https://updated.com',
        active: true,
        pinned: false,
      };

      mockBrowser.tabs.update.mockResolvedValue(mockTab);

      const result = await tabs.update(tabId, updateProps);

      expect(mockBrowser.tabs.update).toHaveBeenCalledWith(tabId, updateProps);
      expect(result).toEqual(mockTab);
    });
  });

  describe('remove', () => {
    it('should remove a tab', async () => {
      mockBrowser.tabs.remove.mockResolvedValue(undefined);

      await tabs.remove(1);

      expect(mockBrowser.tabs.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('move', () => {
    it('should move a tab', async () => {
      const moveInfo = { index: 2 };
      const mockTab: Tab = {
        id: 1,
        windowId: 1,
        index: 2,
        url: 'https://example.com',
        active: true,
        pinned: false,
      };

      mockBrowser.tabs.move.mockResolvedValue(mockTab);

      const result = await tabs.move(1, moveInfo);

      expect(mockBrowser.tabs.move).toHaveBeenCalledWith(1, moveInfo);
      expect(result).toEqual(mockTab);
    });
  });

  describe('event listeners', () => {
    it('should expose onCreated event', () => {
      expect(tabs.onCreated).toBe(mockBrowser.tabs.onCreated);
    });

    it('should expose onUpdated event', () => {
      expect(tabs.onUpdated).toBe(mockBrowser.tabs.onUpdated);
    });

    it('should expose onRemoved event', () => {
      expect(tabs.onRemoved).toBe(mockBrowser.tabs.onRemoved);
    });

    it('should expose onMoved event', () => {
      expect(tabs.onMoved).toBe(mockBrowser.tabs.onMoved);
    });
  });
});
*/
