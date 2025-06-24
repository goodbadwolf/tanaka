import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { useExtensionState } from '../useExtensionState';

// Mock browser
jest.mock('webextension-polyfill');

// Mock config
jest.mock('../../config/index.js', () => ({
  getConfig: jest.fn(() => ({
    serverUrl: 'https://test.server.com',
  })),
}));

describe('useExtensionState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial loading state', () => {
    const result = useExtensionState();

    expect(result.isLoading).toBe(true);
    expect(result.isConfigured).toBe(false);
    expect(result.serverUrl).toBe('');
    expect(result.error).toBeNull();
  });

  it('should return all expected properties', () => {
    const result = useExtensionState();

    expect(result).toHaveProperty('isLoading');
    expect(result).toHaveProperty('isConfigured');
    expect(result).toHaveProperty('serverUrl');
    expect(result).toHaveProperty('error');
  });
});
