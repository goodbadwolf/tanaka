import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { TanakaAPI, APIError, browserTabToSyncTab, parseSyncTab } from '../api';
import type { Tab } from '../models';

// Mock fetch globally
(globalThis as { fetch: typeof fetch }).fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('TanakaAPI', () => {
  let api: TanakaAPI;
  const mockFetch = (globalThis as { fetch: typeof fetch }).fetch as jest.MockedFunction<
    typeof fetch
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    api = new TanakaAPI('https://api.example.com');
    api.setAuthToken('test-token');
  });

  describe('constructor', () => {
    it('should create instance with valid URL', () => {
      expect(() => new TanakaAPI('https://api.example.com')).not.toThrow();
    });

    it('should throw APIError with invalid URL', () => {
      expect(() => new TanakaAPI('not-a-url')).toThrow(APIError);
      expect(() => new TanakaAPI('not-a-url')).toThrow('Invalid server URL');
    });
  });

  describe('setAuthToken', () => {
    it('should set auth token', () => {
      api.setAuthToken('new-token');
      // Token is set internally, we'll verify in request tests
      expect(() => api.setAuthToken('valid-token')).not.toThrow();
    });

    it('should throw error for empty token', () => {
      expect(() => api.setAuthToken('')).toThrow(APIError);
      expect(() => api.setAuthToken('')).toThrow('Invalid token');
    });
  });

  describe('syncTabs', () => {
    it('should sync tabs successfully', async () => {
      const mockTabs: Tab[] = [
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
        'https://api.example.com/sync',
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

    it('should handle sync errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(api.syncTabs([])).rejects.toThrow(APIError);
    });

    it('should log and rethrow errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const error = new Error('Network error');
      mockFetch.mockRejectedValueOnce(error);

      await expect(api.syncTabs([])).rejects.toThrow('Network error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Sync failed:', error);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('checkHealth', () => {
    it('should return true when health check succeeds', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
      } as Response);

      const result = await api.checkHealth();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/health',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
      expect(result).toBe(true);
    });

    it('should return false when health check fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await api.checkHealth();
      expect(result).toBe(false);
    });
  });
});

describe('browserTabToSyncTab', () => {
  it('should convert browser tab to sync tab', () => {
    const browserTab = {
      id: 123,
      url: 'https://example.com',
      title: 'Example',
      favIconUrl: 'https://example.com/favicon.ico',
      index: 0,
      pinned: false,
      active: true,
    };

    const result = browserTabToSyncTab(
      browserTab as Parameters<typeof browserTabToSyncTab>[0],
      456,
    );

    expect(result).toEqual({
      id: 'tab-123',
      windowId: 'window-456',
      data: expect.any(String),
      updatedAt: expect.any(Number),
    });

    const parsedData = JSON.parse(result?.data ?? '{}');
    expect(parsedData).toEqual({
      url: 'https://example.com',
      title: 'Example',
      favIconUrl: 'https://example.com/favicon.ico',
      index: 0,
      pinned: false,
      active: true,
    });
  });

  it('should return null for tabs without id', () => {
    const browserTab = { url: 'https://example.com' };
    expect(
      browserTabToSyncTab(browserTab as Parameters<typeof browserTabToSyncTab>[0], 1),
    ).toBeNull();
  });

  it('should return null for tabs without url', () => {
    const browserTab = { id: 123 };
    expect(
      browserTabToSyncTab(browserTab as Parameters<typeof browserTabToSyncTab>[0], 1),
    ).toBeNull();
  });

  it('should handle missing optional fields', () => {
    const browserTab = {
      id: 123,
      url: 'https://example.com',
      index: 0,
      pinned: false,
      active: false,
    };

    const result = browserTabToSyncTab(
      browserTab as Parameters<typeof browserTabToSyncTab>[0],
      456,
    );
    const parsedData = JSON.parse(result?.data ?? '{}');

    expect(parsedData.title).toBe('');
    expect(parsedData.favIconUrl).toBe('');
  });
});

describe('parseSyncTab', () => {
  it('should parse valid sync tab data', () => {
    const tab: Tab = {
      id: 'tab-1',
      windowId: 'window-1',
      data: JSON.stringify({
        url: 'https://example.com',
        title: 'Example',
        favIconUrl: 'https://example.com/favicon.ico',
        index: 0,
        pinned: false,
        active: true,
      }),
      updatedAt: Date.now(),
    };

    const result = parseSyncTab(tab);

    expect(result).toEqual({
      url: 'https://example.com',
      title: 'Example',
      favIconUrl: 'https://example.com/favicon.ico',
      index: 0,
      pinned: false,
      active: true,
    });
  });

  it('should return null for invalid JSON', () => {
    const tab: Tab = {
      id: 'tab-1',
      windowId: 'window-1',
      data: 'invalid json',
      updatedAt: Date.now(),
    };

    expect(parseSyncTab(tab)).toBeNull();
  });
});
