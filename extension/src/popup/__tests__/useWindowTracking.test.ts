import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { useWindowTracking } from '../hooks/useWindowTracking';

// Mock browser
jest.mock('webextension-polyfill');

describe('useWindowTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial loading state', () => {
    const result = useWindowTracking();

    expect(result.isLoading).toBe(true);
    expect(result.isTracked).toBe(false);
    expect(result.error).toBeNull();
    expect(typeof result.toggleTracking).toBe('function');
  });

  it('should provide toggleTracking function', () => {
    const result = useWindowTracking();

    expect(typeof result.toggleTracking).toBe('function');
  });
});
