/*
import { ExtensionError } from '../../error/types';
import { CircuitBreaker, createRetryableFunction, withRetry } from '../retry';

describe('Retry Utility', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Mock Date.now for circuit breaker tests
    jest.spyOn(Date, 'now').mockReturnValue(0);
  });

  afterEach(() => {
    jest.spyOn(Date, 'now').mockRestore();
    jest.useRealTimers();
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await withRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new ExtensionError('NETWORK_FAILURE'))
        .mockRejectedValueOnce(new ExtensionError('NETWORK_FAILURE'))
        .mockResolvedValue('success');

      const promise = withRetry(operation, {
        maxAttempts: 3,
        initialDelay: 100,
        jitter: false,
      });

      // Advance timers to process retries
      await jest.runAllTimersAsync();

      const result = await promise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it.skip('should throw after max attempts', async () => {
      const error = new Error('Network error');
      const operation = jest.fn().mockRejectedValue(error);

      const promise = withRetry(operation, {
        maxAttempts: 2,
        initialDelay: 100,
        jitter: false,
        isRetryable: () => true,
      });

      // Allow all retries to complete
      try {
        await jest.runAllTimersAsync();
        await promise;
      } catch {
        // Expected to throw
      }

      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const error = new ExtensionError('AUTH_TOKEN_INVALID');
      const operation = jest.fn().mockRejectedValue(error);

      await expect(withRetry(operation)).rejects.toThrow(error);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry callback', async () => {
      const error = new ExtensionError('NETWORK_FAILURE');
      const operation = jest.fn().mockRejectedValueOnce(error).mockResolvedValue('success');
      const onRetry = jest.fn();

      const promise = withRetry(operation, {
        onRetry,
        initialDelay: 100,
        jitter: false,
      });

      // Wait for first attempt and retry
      await jest.runAllTimersAsync();

      const result = await promise;

      expect(result).toBe('success');
      expect(onRetry).toHaveBeenCalledWith(error, 1);
    });

    it.skip('should respect abort signal', async () => {
      const controller = new AbortController();
      const error = new Error('Network error');
      const operation = jest.fn().mockRejectedValueOnce(error).mockResolvedValue('success');

      const promise = withRetry(operation, {
        signal: controller.signal,
        initialDelay: 100,
        jitter: false,
        isRetryable: () => true,
      });

      // Abort immediately after first attempt
      setTimeout(() => controller.abort(), 0);

      try {
        await jest.runAllTimersAsync();
        await promise;
      } catch (e) {
        expect(e).toBeInstanceOf(ExtensionError);
        expect(e.message).toBe('Operation aborted');
      }

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it.skip('should apply exponential backoff', async () => {
      const error = new Error('Network error');
      const operation = jest.fn().mockRejectedValue(error);

      const promise = withRetry(operation, {
        maxAttempts: 4,
        initialDelay: 100,
        backoffMultiplier: 2,
        jitter: false,
        isRetryable: () => true,
      });

      // Allow all retries to complete
      try {
        await jest.runAllTimersAsync();
        await promise;
      } catch {
        // Expected to throw
      }

      expect(operation).toHaveBeenCalledTimes(4);
    });

    it.skip('should respect maxDelay', async () => {
      const error = new Error('Network error');
      const operation = jest.fn().mockRejectedValue(error);

      const promise = withRetry(operation, {
        maxAttempts: 3,
        initialDelay: 1000,
        backoffMultiplier: 10,
        maxDelay: 2000,
        jitter: false,
        isRetryable: () => true,
      });

      // Allow all retries to complete
      try {
        await jest.runAllTimersAsync();
        await promise;
      } catch {
        // Expected to throw
      }

      expect(operation).toHaveBeenCalledTimes(3);
    });
  });

  describe('CircuitBreaker', () => {
    it('should allow operations when closed', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 1000,
        successThreshold: 2,
      });

      const operation = jest.fn().mockResolvedValue('success');

      const result = await breaker.execute(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(breaker.getState().state).toBe('closed');
    });

    it('should open after failure threshold', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 1000,
        successThreshold: 2,
      });

      const operation = jest.fn().mockRejectedValue(new Error('fail'));

      // First two failures
      await expect(breaker.execute(operation)).rejects.toThrow('fail');
      await expect(breaker.execute(operation)).rejects.toThrow('fail');

      // Circuit should be open now
      expect(breaker.getState().state).toBe('open');

      // Next call should fail immediately
      await expect(breaker.execute(operation)).rejects.toThrow('Circuit breaker is open');
      expect(operation).toHaveBeenCalledTimes(2); // Not called on third attempt
    });

    it('should transition to half-open after timeout', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeout: 1000,
        successThreshold: 2,
      });

      let currentTime = 0;
      jest.spyOn(Date, 'now').mockImplementation(() => currentTime);

      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      // Open the circuit
      await expect(breaker.execute(operation)).rejects.toThrow('fail');
      expect(breaker.getState().state).toBe('open');

      // Advance time to allow half-open
      currentTime = 1000;

      // Should try operation again
      const result = await breaker.execute(operation);
      expect(result).toBe('success');
      expect(breaker.getState().state).toBe('half-open');
    });

    it('should close after success threshold in half-open', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeout: 100,
        successThreshold: 2,
      });

      let currentTime = 0;
      jest.spyOn(Date, 'now').mockImplementation(() => currentTime);

      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      // Open the circuit
      await expect(breaker.execute(operation)).rejects.toThrow('fail');

      // Wait for reset timeout
      currentTime = 100;

      // Two successes should close the circuit
      await breaker.execute(operation);
      expect(breaker.getState().state).toBe('half-open');

      await breaker.execute(operation);
      expect(breaker.getState().state).toBe('closed');
    });

    it('should reopen on failure in half-open', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeout: 100,
        successThreshold: 2,
      });

      let currentTime = 0;
      jest.spyOn(Date, 'now').mockImplementation(() => currentTime);

      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail1'))
        .mockResolvedValueOnce('success')
        .mockRejectedValueOnce(new Error('fail2'));

      // Open the circuit
      await expect(breaker.execute(operation)).rejects.toThrow('fail1');

      // Wait for reset timeout
      currentTime = 100;

      // Success moves to half-open
      await breaker.execute(operation);
      expect(breaker.getState().state).toBe('half-open');

      // Failure reopens
      await expect(breaker.execute(operation)).rejects.toThrow('fail2');
      expect(breaker.getState().state).toBe('open');
    });

    it('should reset state', () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeout: 1000,
        successThreshold: 2,
      });

      // Manually set to open
      const operation = jest.fn().mockRejectedValue(new Error('fail'));
      breaker.execute(operation).catch(() => undefined); // Open circuit

      breaker.reset();

      const state = breaker.getState();
      expect(state.state).toBe('closed');
      expect(state.failureCount).toBe(0);
      expect(state.lastFailureTime).toBe(0);
    });
  });

  describe('createRetryableFunction', () => {
    it('should create a function with retry logic', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new ExtensionError('NETWORK_FAILURE'))
        .mockResolvedValue('success');

      const retryableFn = createRetryableFunction(fn, {
        maxAttempts: 2,
        initialDelay: 100,
        jitter: false,
      });

      const promise = retryableFn('arg1', 'arg2');

      // Allow retry to complete
      await jest.runAllTimersAsync();

      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should integrate with circuit breaker', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));

      const retryableFn = createRetryableFunction(fn, {
        maxAttempts: 1,
        circuitBreaker: {
          failureThreshold: 2,
          resetTimeout: 1000,
          successThreshold: 2,
        },
      });

      // Two failures should open circuit
      await expect(retryableFn()).rejects.toThrow('fail');
      await expect(retryableFn()).rejects.toThrow('fail');

      // Circuit should be open
      await expect(retryableFn()).rejects.toThrow('Circuit breaker is open');
      expect(fn).toHaveBeenCalledTimes(2); // Not called on third attempt
    });
  });
});
*/
