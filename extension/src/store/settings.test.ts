import { effect } from '@preact/signals';
import {
  settings,
  authToken,
  syncInterval,
  isAuthenticated,
  isLoading,
  isSaving,
  saveStatus,
  updateSettings,
  setLoadingState,
  setSavingState,
  setSaveStatus,
  loadSettings,
  saveSettings,
  resetSettings,
  enablePersistence,
  getSettingsForExport,
} from './settings';
import { waitForSignal, mockSignalStorage } from '../test-utils/signals';

describe('Settings Store', () => {
  beforeEach(() => {
    resetSettings();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Initial State', () => {
    it('has default values', () => {
      expect(settings.value).toEqual({
        authToken: 'unset-token',
        syncInterval: 5000,
      });
      expect(isLoading.value).toBe(false);
      expect(isSaving.value).toBe(false);
      expect(saveStatus.value).toBeNull();
    });

    it('is not authenticated by default', () => {
      expect(isAuthenticated.value).toBe(false);
    });
  });

  describe('Settings Updates', () => {
    it('updates settings partially', () => {
      updateSettings({ authToken: 'new-token' });

      expect(authToken.value).toBe('new-token');
      expect(syncInterval.value).toBe(5000);
    });

    it('updates authentication state', () => {
      expect(isAuthenticated.value).toBe(false);

      updateSettings({ authToken: 'valid-token' });
      expect(isAuthenticated.value).toBe(true);

      updateSettings({ authToken: '' });
      expect(isAuthenticated.value).toBe(false);

      updateSettings({ authToken: '   ' });
      expect(isAuthenticated.value).toBe(false);
    });
  });

  describe('Loading Settings', () => {
    it('loads settings from storage', async () => {
      const mockStorage = mockSignalStorage();
      mockStorage.setItem('authToken', 'stored-token');
      mockStorage.setItem('syncInterval', '10000');

      await loadSettings(mockStorage);

      expect(settings.value).toEqual({
        authToken: 'stored-token',
        syncInterval: 10000,
      });
      expect(isLoading.value).toBe(false);
    });

    it('uses defaults for missing values', async () => {
      const mockStorage = mockSignalStorage();
      mockStorage.setItem('authToken', 'partial-token');

      await loadSettings(mockStorage);

      expect(settings.value).toEqual({
        authToken: 'partial-token',
        syncInterval: 5000,
      });
    });

    it('handles load errors', async () => {
      const mockStorage = {
        get: jest.fn().mockRejectedValue(new Error('Storage error')),
      };

      await expect(loadSettings(mockStorage)).rejects.toThrow('Storage error');

      expect(isLoading.value).toBe(false);
      expect(saveStatus.value).toEqual({
        type: 'error',
        message: 'Failed to load settings',
      });
    });
  });

  describe('Saving Settings', () => {
    it('saves settings to storage', async () => {
      const mockStorage = mockSignalStorage();

      await saveSettings({ authToken: 'new-token' }, mockStorage);

      expect(mockStorage.setItem).toHaveBeenCalledWith('authToken', 'new-token');
      expect(authToken.value).toBe('new-token');
      expect(saveStatus.value).toEqual({
        type: 'success',
        message: 'Settings saved successfully',
      });
    });

    it('trims auth token before saving', async () => {
      const mockStorage = mockSignalStorage();

      await saveSettings({ authToken: '  token-with-spaces  ' }, mockStorage);

      expect(mockStorage.setItem).toHaveBeenCalledWith('authToken', 'token-with-spaces');
      expect(authToken.value).toBe('token-with-spaces');
    });

    it('validates auth token', async () => {
      const mockStorage = mockSignalStorage();

      await expect(saveSettings({ authToken: '' }, mockStorage)).rejects.toThrow(
        'Auth token is required',
      );

      expect(saveStatus.value).toEqual({
        type: 'error',
        message: 'Auth token is required',
      });
      expect(mockStorage.setItem).not.toHaveBeenCalled();
    });

    it('handles save errors', async () => {
      const mockStorage = {
        set: jest.fn().mockRejectedValue(new Error('Storage error')),
      };

      await expect(saveSettings({ authToken: 'token' }, mockStorage)).rejects.toThrow(
        'Storage error',
      );

      expect(isSaving.value).toBe(false);
      expect(saveStatus.value).toEqual({
        type: 'error',
        message: 'Failed to save settings',
      });
    });
  });

  describe('State Management', () => {
    it('manages loading state', () => {
      setLoadingState(true);
      expect(isLoading.value).toBe(true);

      setLoadingState(false);
      expect(isLoading.value).toBe(false);
    });

    it('manages saving state', () => {
      setSavingState(true);
      expect(isSaving.value).toBe(true);

      setSavingState(false);
      expect(isSaving.value).toBe(false);
    });

    it('auto-clears save status after timeout', async () => {
      jest.useFakeTimers();

      setSaveStatus({ type: 'success', message: 'Test' });
      expect(saveStatus.value).not.toBeNull();

      jest.advanceTimersByTime(3000);
      expect(saveStatus.value).toBeNull();

      jest.useRealTimers();
    });

    it('cancels previous timer when setting new status', () => {
      jest.useFakeTimers();

      setSaveStatus({ type: 'success', message: 'First' });
      jest.advanceTimersByTime(1000);

      setSaveStatus({ type: 'error', message: 'Second' });
      jest.advanceTimersByTime(2500);

      expect(saveStatus.value).toEqual({ type: 'error', message: 'Second' });

      jest.advanceTimersByTime(500);
      expect(saveStatus.value).toBeNull();

      jest.useRealTimers();
    });
  });

  describe('Persistence', () => {
    it('enables auto-persistence', async () => {
      const mockStorage = mockSignalStorage();
      const dispose = enablePersistence(mockStorage);

      updateSettings({ authToken: 'auto-saved' });

      await waitForSignal(settings, () => true);

      expect(mockStorage.setItem).toHaveBeenCalledWith('authToken', 'auto-saved');
      expect(mockStorage.setItem).toHaveBeenCalledWith('syncInterval', 5000);

      dispose();
    });

    it('does not persist during loading', async () => {
      const mockStorage = mockSignalStorage();
      setLoadingState(true);

      const dispose = enablePersistence(mockStorage);
      updateSettings({ authToken: 'should-not-save' });

      await waitForSignal(settings, () => true);

      expect(mockStorage.setItem).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe('Export', () => {
    it('exports current settings', () => {
      updateSettings({ authToken: 'export-token', syncInterval: 7000 });

      const exported = getSettingsForExport();
      expect(exported).toEqual({
        authToken: 'export-token',
        syncInterval: 7000,
      });

      exported.authToken = 'modified';
      expect(authToken.value).toBe('export-token');
    });
  });

  describe('Signal Subscriptions', () => {
    it('notifies subscribers on settings changes', async () => {
      const updates: string[] = [];
      const dispose = effect(() => {
        updates.push(authToken.value);
      });

      updateSettings({ authToken: 'token1' });
      updateSettings({ authToken: 'token2' });

      await waitForSignal(authToken, (token) => token === 'token2');

      expect(updates).toEqual(['unset-token', 'token1', 'token2']);
      dispose();
    });

    it('notifies subscribers on authentication changes', async () => {
      const updates: boolean[] = [];
      const dispose = effect(() => {
        const authValue = isAuthenticated.value;
        updates.push(authValue);
      });

      updateSettings({ authToken: 'valid' });
      updateSettings({ authToken: '' });
      updateSettings({ authToken: 'valid2' });

      await waitForSignal(isAuthenticated, (auth) => auth === true);

      expect(updates).toEqual([false, true, false, true]);
      dispose();
    });
  });
});
