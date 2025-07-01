import { TanakaAPI, browserTabToSyncTab, parseSyncTab } from './api';
import { ExtensionError } from '../error/types';
import type { Tab as BrowserTab } from '../browser/core';

// Mock fetch globally
global.fetch = jest.fn();

describe('TanakaAPI', () => {
  let api: TanakaAPI;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    api = new TanakaAPI('https://api.tanaka.test', { enableRetry: false });
  });

  describe('constructor', () => {
    it('should initialize with valid URL', () => {
      expect(() => new TanakaAPI('https://api.tanaka.test')).not.toThrow();
    });

    it('should throw ExtensionError for invalid URL', () => {
      expect(() => new TanakaAPI('invalid-url')).toThrow(ExtensionError);
      expect(() => new TanakaAPI('invalid-url')).toThrow('Invalid server URL');
    });
  });

  describe('setAuthToken', () => {
    it('should set auth token', () => {
      expect(() => api.setAuthToken('test-token')).not.toThrow();
    });

    it('should throw ExtensionError for empty token', () => {
      expect(() => api.setAuthToken('')).toThrow(ExtensionError);
      expect(() => api.setAuthToken('')).toThrow('Authentication token is missing');
    });
  });

  describe('sync', () => {
    beforeEach(() => {
      api.setAuthToken('test-token');
    });

    it('should sync operations successfully', async () => {
      const mockRequest = {
        clock: 10n,
        device_id: 'test-device',
        since_clock: 5n,
        operations: [],
      };

      const mockResponse = {
        clock: '15',
        operations: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      } as Response);

      const result = await api.sync(mockRequest);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.tanaka.test/sync',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            clock: '10',
            device_id: 'test-device',
            since_clock: '5',
            operations: [],
          }),
        }),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.clock).toBe(15n);
        expect(result.data.operations).toEqual([]);
      }
    });

    it('should return error result on server error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const result = await api.sync({
        clock: 0n,
        device_id: 'test',
        since_clock: null,
        operations: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ExtensionError);
        expect(result.error.code).toBe('NETWORK_FAILURE');
      }
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Network error'));

      const result = await api.sync({
        clock: 0n,
        device_id: 'test',
        since_clock: null,
        operations: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ExtensionError);
        expect(result.error.code).toBe('NETWORK_FAILURE');
      }
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

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('should return error when server is unhealthy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      } as Response);

      const result = await api.checkHealth();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ExtensionError);
        expect(result.error.code).toBe('NETWORK_FAILURE');
      }
    });

    it('should return error on network error', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Network error'));

      const result = await api.checkHealth();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ExtensionError);
        expect(result.error.code).toBe('NETWORK_FAILURE');
      }
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

  it('should throw ExtensionError for invalid JSON', () => {
    const syncTab = {
      id: 'tab-123',
      windowId: 'window-456',
      data: 'invalid-json',
      updatedAt: Date.now(),
    };

    expect(() => parseSyncTab(syncTab)).toThrow(ExtensionError);
    expect(() => parseSyncTab(syncTab)).toThrow('Failed to parse tab data');
  });

  it('should throw ExtensionError for missing required fields', () => {
    const syncTab = {
      id: 'tab-123',
      windowId: 'window-456',
      data: JSON.stringify({ title: 'Test' }), // missing url
      updatedAt: Date.now(),
    };

    expect(() => parseSyncTab(syncTab)).toThrow(ExtensionError);
    expect(() => parseSyncTab(syncTab)).toThrow('Tab data is missing required fields');
  });
});
