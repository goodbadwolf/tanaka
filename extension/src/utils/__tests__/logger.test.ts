import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { debugLog, debugError, debugWarn } from '../logger';

describe('logger', () => {
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let consoleWarnSpy: jest.SpiedFunction<typeof console.warn>;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  describe('in development environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('debugLog should log messages with prefix', () => {
      debugLog('test message', { data: 'value' });

      expect(consoleLogSpy).toHaveBeenCalledWith('[Tanaka Debug]', 'test message', {
        data: 'value',
      });
    });

    it('debugError should log errors with prefix', () => {
      const error = new Error('test error');
      debugError('Error occurred:', error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('[Tanaka Error]', 'Error occurred:', error);
    });

    it('debugWarn should log warnings with prefix', () => {
      debugWarn('Warning:', 'something might be wrong');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Tanaka Warning]',
        'Warning:',
        'something might be wrong',
      );
    });
  });

  describe('in production environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('debugLog should not log messages', () => {
      debugLog('test message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('debugError should not log errors', () => {
      debugError('test error');

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('debugWarn should not log warnings', () => {
      debugWarn('test warning');

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('with multiple arguments', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should handle multiple arguments correctly', () => {
      debugLog('arg1', 'arg2', 123, { key: 'value' }, null, undefined);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Tanaka Debug]',
        'arg1',
        'arg2',
        123,
        { key: 'value' },
        null,
        undefined,
      );
    });

    it('should handle no arguments', () => {
      debugLog();

      expect(consoleLogSpy).toHaveBeenCalledWith('[Tanaka Debug]');
    });
  });
});
