import { describe, it, expect } from '@jest/globals';
import { config as development } from '../development';
import { config as production } from '../production';
import { config as staging } from '../staging';

describe('Environment configurations', () => {
  describe('development config', () => {
    it('should have correct values', () => {
      expect(development.serverUrl).toBe('http://localhost:3000');
    });
  });

  describe('production config', () => {
    it('should have correct values', () => {
      expect(production.serverUrl).toBeDefined();
      expect(typeof production.serverUrl).toBe('string');
    });
  });

  describe('staging config', () => {
    it('should have correct values', () => {
      expect(staging.serverUrl).toBeDefined();
      expect(typeof staging.serverUrl).toBe('string');
    });
  });

  it('should have consistent config shape across environments', () => {
    const configs = [development, production, staging];

    configs.forEach((config) => {
      expect(config).toHaveProperty('serverUrl');
      expect(typeof config.serverUrl).toBe('string');
    });
  });
});
