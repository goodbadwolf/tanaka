import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock browser
jest.mock('webextension-polyfill');

import browser from 'webextension-polyfill';
import { useSettings } from './useSettings';

describe('useSettings', () => {
  const mockBrowser = jest.mocked(browser);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return initial state', () => {
    const result = useSettings();

    expect(result.authToken).toBe('');
    expect(result.isSaving).toBe(false);
    expect(result.saveStatus).toBeNull();
    expect(typeof result.saveAuthToken).toBe('function');
  });

  it('should validate empty auth token', async () => {
    const result = useSettings();

    await result.saveAuthToken('');

    expect(result.saveStatus).toEqual({
      type: 'error',
      message: 'Auth token is required',
    });
    expect(mockBrowser.storage.local.set).not.toHaveBeenCalled();
  });

  it('should validate whitespace-only auth token', async () => {
    const result = useSettings();

    await result.saveAuthToken('   ');

    expect(result.saveStatus).toEqual({
      type: 'error',
      message: 'Auth token is required',
    });
    expect(mockBrowser.storage.local.set).not.toHaveBeenCalled();
  });

  it('should save valid auth token', async () => {
    mockBrowser.storage.local.set.mockResolvedValue(undefined);
    mockBrowser.runtime.sendMessage.mockResolvedValue(undefined);

    const result = useSettings();

    await result.saveAuthToken('valid-token');

    expect(mockBrowser.storage.local.set).toHaveBeenCalledWith({
      authToken: 'valid-token',
    });
    expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'SETTINGS_UPDATED',
    });
  });

  it('should trim auth token before saving', async () => {
    mockBrowser.storage.local.set.mockResolvedValue(undefined);
    mockBrowser.runtime.sendMessage.mockResolvedValue(undefined);

    const result = useSettings();

    await result.saveAuthToken('  valid-token  ');

    expect(mockBrowser.storage.local.set).toHaveBeenCalledWith({
      authToken: 'valid-token',
    });
  });

  it('should handle save errors gracefully', async () => {
    const error = new Error('Storage error');
    mockBrowser.storage.local.set.mockRejectedValue(error);

    const result = useSettings();

    await result.saveAuthToken('valid-token');

    expect(result.saveStatus).toEqual({
      type: 'error',
      message: 'Failed to save authentication',
    });
  });

  it('should clear status message after timeout', async () => {
    const result = useSettings();

    await result.saveAuthToken('');

    expect(result.saveStatus).not.toBeNull();

    // Fast-forward time
    jest.advanceTimersByTime(3000);

    expect(result.saveStatus).toBeNull();
  });
});
