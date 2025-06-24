import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the @env module
jest.mock('@env');

describe('config/index', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should return config from @env module', async () => {
    const mockConfig = {
      serverUrl: 'https://test.tanaka.com',
      environment: 'test',
    };

    jest.doMock('@env', () => ({
      config: mockConfig,
    }));

    const { getConfig } = await import('../index');
    const config = getConfig();

    expect(config).toEqual(mockConfig);
    expect(config.serverUrl).toBe('https://test.tanaka.com');
    expect(config.environment).toBe('test');
  });

  it('should export Config type', async () => {
    const module = await import('../index');

    // Just verify the exports exist
    expect(typeof module.getConfig).toBe('function');
  });
});
