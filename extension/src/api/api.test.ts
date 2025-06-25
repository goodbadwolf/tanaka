import { TanakaAPI, APIError, browserTabToSyncTab, parseSyncTab } from './api';
import type { Tab as BrowserTab } from '../browser/core';

// Mock fetch globally
global.fetch = jest.fn();

describe('TanakaAPI', () => {
  let api: TanakaAPI;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    api = new TanakaAPI('https://api.tanaka.test');
  });

  describe('constructor', () => {
    it('should initialize with valid URL', () => {
      expect(() => new TanakaAPI('https://api.tanaka.test')).not.toThrow();
    });

    it('should throw APIError for invalid URL', () => {
      expect(() => new TanakaAPI('invalid-url')).toThrow(APIError);
      expect(() => new TanakaAPI('invalid-url')).toThrow('Invalid server base URL');
    });
  });

  describe('setAuthToken', () => {
    it('should set auth token', () => {
      expect(() => api.setAuthToken('test-token')).not.toThrow();
    });

    it('should throw APIError for empty token', () => {
      expect(() => api.setAuthToken('')).toThrow(APIError);
      expect(() => api.setAuthToken('')).toThrow('Invalid token');
    });
  });

  describe('syncTabs', () => {
    beforeEach(() => {
      api.setAuthToken('test-token');
    });

    it('should sync tabs successfully', async () => {
      const mockTabs = [
        {
          id: 'tab-1',
          windowId: 'window-1',
          data: JSON.stringify({ url: 'https://example.com' }),
          updatedAt: Date.now(),
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ tabs: mockTabs }),
      } as Response);

      const result = await api.syncTabs(mockTabs);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.tanaka.test/sync',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ tabs: mockTabs }),
        }),
      );

      expect(result).toEqual(mockTabs);
    });

    it('should throw APIError on server error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(api.syncTabs([])).rejects.toThrow(APIError);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(api.syncTabs([])).rejects.toThrow('Network error');
    });
  });

  describe('checkHealth', () => {
    beforeEach(() => {
      api.setAuthToken('test-token');
    });

    it('should return true when server is healthy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
      } as Response);

      const result = await api.checkHealth();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.tanaka.test/health',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );

      expect(result).toBe(true);
    });

    it('should return false when server is unhealthy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      } as Response);

      const result = await api.checkHealth();
      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await api.checkHealth();
      expect(result).toBe(false);
    });
  });
});

describe('browserTabToSyncTab', () => {
  it('should convert browser tab to sync tab', () => {
    const browserTab: BrowserTab = {
      id: 123,
      url: 'https://example.com',
      title: 'Example',
      favIconUrl: 'https://example.com/favicon.ico',
      index: 0,
      pinned: false,
      active: true,
      windowId: 456,
    };

    const result = browserTabToSyncTab(browserTab, 456);

    expect(result).toEqual({
      id: 'tab-123',
      windowId: 'window-456',
      data: JSON.stringify({
        url: 'https://example.com',
        title: 'Example',
        favIconUrl: 'https://example.com/favicon.ico',
        index: 0,
        pinned: false,
        active: true,
      }),
      updatedAt: expect.any(Number),
    });
  });

  it('should return null for tab without id', () => {
    const browserTab = {
      url: 'https://example.com',
    } as BrowserTab;

    const result = browserTabToSyncTab(browserTab, 456);
    expect(result).toBeNull();
  });

  it('should return null for tab without url', () => {
    const browserTab = {
      id: 123,
    } as BrowserTab;

    const result = browserTabToSyncTab(browserTab, 456);
    expect(result).toBeNull();
  });

  it('should handle tabs with missing optional fields', () => {
    const browserTab: BrowserTab = {
      id: 123,
      url: 'https://example.com',
      index: 0,
      pinned: false,
      active: true,
      windowId: 456,
    };

    const result = browserTabToSyncTab(browserTab, 456);

    expect(result).toEqual({
      id: 'tab-123',
      windowId: 'window-456',
      data: JSON.stringify({
        url: 'https://example.com',
        title: '',
        favIconUrl: '',
        index: 0,
        pinned: false,
        active: true,
      }),
      updatedAt: expect.any(Number),
    });
  });
});

describe('parseSyncTab', () => {
  it('should parse valid sync tab data', () => {
    const tabData = {
      url: 'https://example.com',
      title: 'Example',
      favIconUrl: 'https://example.com/favicon.ico',
      index: 0,
      pinned: false,
      active: true,
    };

    const syncTab = {
      id: 'tab-123',
      windowId: 'window-456',
      data: JSON.stringify(tabData),
      updatedAt: Date.now(),
    };

    const result = parseSyncTab(syncTab);
    expect(result).toEqual(tabData);
  });

  it('should return null for invalid JSON', () => {
    const syncTab = {
      id: 'tab-123',
      windowId: 'window-456',
      data: 'invalid-json',
      updatedAt: Date.now(),
    };

    const result = parseSyncTab(syncTab);
    expect(result).toBeNull();
  });
});
