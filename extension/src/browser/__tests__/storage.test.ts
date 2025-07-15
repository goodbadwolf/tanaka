/*
import { BrowserStorage } from '../storage';

// Mock webextension-polyfill
jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
  },
}));

describe('BrowserStorage', () => {
  let storage: BrowserStorage;
  let mockBrowser: {
    storage: {
      local: {
        get: jest.Mock;
        set: jest.Mock;
        remove: jest.Mock;
        clear: jest.Mock;
      };
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    storage = new BrowserStorage();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mockBrowser = require('webextension-polyfill');
  });

  describe('get', () => {
    it('should get items by string key', async () => {
      const mockData = { key1: 'value1' };
      mockBrowser.storage.local.get.mockResolvedValue(mockData);

      const result = await storage.get('key1');

      expect(mockBrowser.storage.local.get).toHaveBeenCalledWith('key1');
      expect(result).toEqual(mockData);
    });

    it('should get items by array of keys', async () => {
      const mockData = { key1: 'value1', key2: 'value2' };
      mockBrowser.storage.local.get.mockResolvedValue(mockData);

      const result = await storage.get(['key1', 'key2']);

      expect(mockBrowser.storage.local.get).toHaveBeenCalledWith(['key1', 'key2']);
      expect(result).toEqual(mockData);
    });

    it('should get all items when no keys provided', async () => {
      const mockData = { key1: 'value1', key2: 'value2', key3: 'value3' };
      mockBrowser.storage.local.get.mockResolvedValue(mockData);

      const result = await storage.get();

      expect(mockBrowser.storage.local.get).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockData);
    });

    it('should handle null keys', async () => {
      const mockData = { key1: 'value1', key2: 'value2' };
      mockBrowser.storage.local.get.mockResolvedValue(mockData);

      const result = await storage.get(null);

      expect(mockBrowser.storage.local.get).toHaveBeenCalledWith(null);
      expect(result).toEqual(mockData);
    });
  });

  describe('set', () => {
    it('should set items in storage', async () => {
      const items = { key1: 'value1', key2: 'value2' };
      mockBrowser.storage.local.set.mockResolvedValue(undefined);

      await storage.set(items);

      expect(mockBrowser.storage.local.set).toHaveBeenCalledWith(items);
    });

    it('should handle errors from set', async () => {
      const items = { key1: 'value1' };
      const error = new Error('Storage error');
      mockBrowser.storage.local.set.mockRejectedValue(error);

      await expect(storage.set(items)).rejects.toThrow(error);
    });
  });

  describe('remove', () => {
    it('should remove single key', async () => {
      mockBrowser.storage.local.remove.mockResolvedValue(undefined);

      await storage.remove('key1');

      expect(mockBrowser.storage.local.remove).toHaveBeenCalledWith('key1');
    });

    it('should remove multiple keys', async () => {
      const keys = ['key1', 'key2', 'key3'];
      mockBrowser.storage.local.remove.mockResolvedValue(undefined);

      await storage.remove(keys);

      expect(mockBrowser.storage.local.remove).toHaveBeenCalledWith(keys);
    });
  });

  describe('clear', () => {
    it('should clear all storage', async () => {
      mockBrowser.storage.local.clear.mockResolvedValue(undefined);

      await storage.clear();

      expect(mockBrowser.storage.local.clear).toHaveBeenCalled();
    });

    it('should handle errors from clear', async () => {
      const error = new Error('Clear failed');
      mockBrowser.storage.local.clear.mockRejectedValue(error);

      await expect(storage.clear()).rejects.toThrow(error);
    });
  });
});
*/
