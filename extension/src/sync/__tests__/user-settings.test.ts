/*
import { createTestContainer } from '../../test/test-container';
import { UserSettingsManager } from '../user-settings';
import { createMockBrowser } from '../../browser/__mocks__';
import type { IBrowser } from '../../browser/core';
import type { DependencyContainer } from 'tsyringe';
import { beforeEach, describe, expect, it } from '@jest/globals';

describe('UserSettingsManager', () => {
  let container: DependencyContainer;
  let userSettingsManager: UserSettingsManager;
  let mockBrowser: IBrowser;

  beforeEach(() => {
    container = createTestContainer();
    mockBrowser = createMockBrowser();

    // Clear all existing registrations for IBrowser
    container.clearInstances();

    // Force override the IBrowser registration
    container.register<IBrowser>('IBrowser', {
      useValue: mockBrowser,
    });

    userSettingsManager = container.resolve(UserSettingsManager);
  });

  describe('load', () => {
    it('returns default settings when storage is empty', async () => {
      const settings = await userSettingsManager.load();

      expect(settings).toEqual({
        authToken: 'unset-token',
        syncInterval: 5000,
      });
      expect(mockBrowser.localStorage.get).toHaveBeenCalledWith(['authToken', 'syncInterval']);
    });

    it('merges stored settings with defaults', async () => {
      (mockBrowser.localStorage.get as jest.Mock).mockResolvedValue({
        authToken: 'my-token',
      });

      const settings = await userSettingsManager.load();

      expect(settings).toEqual({
        authToken: 'my-token',
        syncInterval: 5000,
      });
    });

    it('returns all stored settings when complete', async () => {
      (mockBrowser.localStorage.get as jest.Mock).mockResolvedValue({
        authToken: 'custom-token',
        syncInterval: 10000,
      });

      const settings = await userSettingsManager.load();

      expect(settings).toEqual({
        authToken: 'custom-token',
        syncInterval: 10000,
      });
    });
  });

  describe('save', () => {
    it('saves partial settings to storage', async () => {
      await userSettingsManager.save({ authToken: 'new-token' });

      expect(mockBrowser.localStorage.set).toHaveBeenCalledWith({
        authToken: 'new-token',
      });
    });

    it('saves multiple settings to storage', async () => {
      await userSettingsManager.save({
        authToken: 'new-token',
        syncInterval: 3000,
      });

      expect(mockBrowser.localStorage.set).toHaveBeenCalledWith({
        authToken: 'new-token',
        syncInterval: 3000,
      });
    });

    it('handles empty settings object', async () => {
      await userSettingsManager.save({});

      expect(mockBrowser.localStorage.set).toHaveBeenCalledWith({});
    });
  });

  describe('clear', () => {
    it('removes all settings from storage', async () => {
      await userSettingsManager.clear();

      expect(mockBrowser.localStorage.remove).toHaveBeenCalledWith(['authToken', 'syncInterval']);
    });
  });
});
*/
