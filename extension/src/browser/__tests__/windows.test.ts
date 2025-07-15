/*
import type { Window } from '../core';
import { BrowserWindows } from '../windows';

// Mock webextension-polyfill
jest.mock('webextension-polyfill', () => ({
  windows: {
    getAll: jest.fn(),
    getCurrent: jest.fn(),
    onCreated: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onRemoved: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
}));

describe('BrowserWindows', () => {
  let windows: BrowserWindows;
  let mockBrowser: {
    windows: {
      getAll: jest.Mock;
      getCurrent: jest.Mock;
      onCreated: {
        addListener: jest.Mock;
        removeListener: jest.Mock;
      };
      onRemoved: {
        addListener: jest.Mock;
        removeListener: jest.Mock;
      };
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    windows = new BrowserWindows();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mockBrowser = require('webextension-polyfill');
  });

  describe('getAll', () => {
    it('should get all windows', async () => {
      const mockWindows: Window[] = [
        {
          id: 1,
          focused: true,
          incognito: false,
          type: 'normal',
        },
        {
          id: 2,
          focused: false,
          incognito: false,
          type: 'normal',
        },
      ];

      mockBrowser.windows.getAll.mockResolvedValue(mockWindows);

      const result = await windows.getAll();

      expect(mockBrowser.windows.getAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockWindows);
    });

    it('should get all windows with populate tabs', async () => {
      const getInfo = { populate: true };
      const mockWindows: Window[] = [
        {
          id: 1,
          focused: true,
          incognito: false,
          type: 'normal',
          tabs: [
            {
              id: 1,
              windowId: 1,
              index: 0,
              url: 'https://example.com',
              active: true,
              pinned: false,
            },
          ],
        },
      ];

      mockBrowser.windows.getAll.mockResolvedValue(mockWindows);

      const result = await windows.getAll(getInfo);

      expect(mockBrowser.windows.getAll).toHaveBeenCalledWith(getInfo);
      expect(result).toEqual(mockWindows);
    });
  });

  describe('getCurrent', () => {
    it('should get current window', async () => {
      const mockWindow: Window = {
        id: 1,
        focused: true,
        incognito: false,
        type: 'normal',
      };

      mockBrowser.windows.getCurrent.mockResolvedValue(mockWindow);

      const result = await windows.getCurrent();

      expect(mockBrowser.windows.getCurrent).toHaveBeenCalled();
      expect(result).toEqual(mockWindow);
    });
  });

  describe('event listeners', () => {
    it('should expose onRemoved event', () => {
      expect(windows.onRemoved).toBe(mockBrowser.windows.onRemoved);
    });
  });
});
*/
