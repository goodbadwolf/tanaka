import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock webextension-polyfill before imports
jest.mock('webextension-polyfill');

import browser from 'webextension-polyfill';
import { UserSettingsManager, type UserSettings } from '../user-settings';

describe('UserSettingsManager', () => {
  let userSettingsManager: UserSettingsManager;
  let mockStorage: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock browser.storage.local
    mockStorage = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    
    const mockBrowser = browser as any;
    mockBrowser.storage = {
      local: mockStorage,
    };

    userSettingsManager = new UserSettingsManager();
  });

  describe('load', () => {
    it('should return default settings when storage is empty', async () => {
      mockStorage.get.mockResolvedValue({});

      const settings = await userSettingsManager.load();

      expect(mockStorage.get).toHaveBeenCalledWith(['authToken', 'syncInterval']);
      expect(settings).toEqual({
        authToken: 'unset-token',
        syncInterval: 5000,
      });
    });

    it('should merge stored settings with defaults', async () => {
      mockStorage.get.mockResolvedValue({
        authToken: 'custom-token',
      });

      const settings = await userSettingsManager.load();

      expect(settings).toEqual({
        authToken: 'custom-token',
        syncInterval: 5000, // Default value
      });
    });

    it('should override all defaults with stored values', async () => {
      mockStorage.get.mockResolvedValue({
        authToken: 'my-auth-token',
        syncInterval: 10000,
      });

      const settings = await userSettingsManager.load();

      expect(settings).toEqual({
        authToken: 'my-auth-token',
        syncInterval: 10000,
      });
    });

    it('should handle storage errors', async () => {
      const error = new Error('Storage error');
      mockStorage.get.mockRejectedValue(error);

      await expect(userSettingsManager.load()).rejects.toThrow('Storage error');
    });
  });

  describe('save', () => {
    it('should save partial settings', async () => {
      const partialSettings: Partial<UserSettings> = {
        authToken: 'new-token',
      };

      await userSettingsManager.save(partialSettings);

      expect(mockStorage.set).toHaveBeenCalledWith(partialSettings);
    });

    it('should save all settings', async () => {
      const fullSettings: UserSettings = {
        authToken: 'new-token',
        syncInterval: 7500,
      };

      await userSettingsManager.save(fullSettings);

      expect(mockStorage.set).toHaveBeenCalledWith(fullSettings);
    });

    it('should handle empty settings', async () => {
      await userSettingsManager.save({});

      expect(mockStorage.set).toHaveBeenCalledWith({});
    });

    it('should handle save errors', async () => {
      const error = new Error('Save error');
      mockStorage.set.mockRejectedValue(error);

      await expect(userSettingsManager.save({ authToken: 'token' })).rejects.toThrow('Save error');
    });
  });

  describe('clear', () => {
    it('should remove all settings keys', async () => {
      await userSettingsManager.clear();

      expect(mockStorage.remove).toHaveBeenCalledWith(['authToken', 'syncInterval']);
    });

    it('should handle clear errors', async () => {
      const error = new Error('Clear error');
      mockStorage.remove.mockRejectedValue(error);

      await expect(userSettingsManager.clear()).rejects.toThrow('Clear error');
    });
  });

  describe('integration', () => {
    it('should handle save and load cycle', async () => {
      // Initial load returns defaults
      mockStorage.get.mockResolvedValue({});
      const initialSettings = await userSettingsManager.load();
      expect(initialSettings.authToken).toBe('unset-token');

      // Save new settings
      const newSettings = { authToken: 'updated-token' };
      await userSettingsManager.save(newSettings);

      // Next load returns saved settings
      mockStorage.get.mockResolvedValue(newSettings);
      const loadedSettings = await userSettingsManager.load();
      expect(loadedSettings).toEqual({
        authToken: 'updated-token',
        syncInterval: 5000,
      });
    });

    it('should handle clear and load cycle', async () => {
      // Save some settings
      mockStorage.get.mockResolvedValue({
        authToken: 'saved-token',
        syncInterval: 8000,
      });

      // Clear settings
      await userSettingsManager.clear();

      // Load should return defaults
      mockStorage.get.mockResolvedValue({});
      const settings = await userSettingsManager.load();
      expect(settings).toEqual({
        authToken: 'unset-token',
        syncInterval: 5000,
      });
    });
  });
});