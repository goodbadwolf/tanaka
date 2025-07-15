/**
 * Retry utility with exponential backoff and circuit breaker
 */

import { ExtensionError, isExtensionError } from '../error/types';

/**
 * Retry configuration
 */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts
   */
  maxAttempts: number;

  /**
   * Initial delay in milliseconds
   */
  initialDelay: number;

  /**
   * Multiplier for exponential backoff
   */
  backoffMultiplier: number;

  /**
   * Maximum delay in milliseconds
   */
  maxDelay: number;

  /**
   * Add jitter to delay
   */
  jitter: boolean;
}

/**
 * Options for retry operation
 */
export interface RetryOptions extends Partial<RetryConfig> {
  /**
   * Callback function called before each retry attempt
   */
  onRetry?: (error: ExtensionError, attempt: number) => void;

  /**
   * Callback function to determine if error is retryable
   */
  isRetryable?: (error: ExtensionError) => boolean;

  /**
   * Abort signal to cancel retries
   */
  signal?: AbortSignal;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryConfig> = {
  maxAttempts: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 30000,
  jitter: true,
};

/**
 * Calculate delay for next retry with exponential backoff and optional jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  backoffMultiplier: number,
  maxDelay: number,
  jitter: boolean,
): number {
  // Calculate exponential delay
  let delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);

  // Apply jitter if enabled (±10% randomization)
  if (jitter) {
    const jitterAmount = delay * 0.1;
    delay += (Math.random() * 2 - 1) * jitterAmount;
  }

  // Cap at max delay
  return Math.min(delay, maxDelay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute an operation with retry logic
 *
 * @param operation - The async operation to execute
 * @param options - Retry options
 * @returns The result of the operation or throws the last error
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  const { maxAttempts, initialDelay, backoffMultiplier, maxDelay, jitter } = config;

  let lastError: ExtensionError | Error | undefined;

  // Retry loop must be sequential
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Check abort signal
      if (options.signal?.aborted) {
        throw new ExtensionError('NETWORK_FAILURE', 'Operation aborted', {
          context: { attempt },
          source: 'retry',
          recoverable: false,
        });
      }

      // Execute operation
      // eslint-disable-next-line no-await-in-loop
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Convert to ExtensionError if needed
      const extensionError = isExtensionError(lastError)
        ? lastError
        : new ExtensionError('SERVER_ERROR', lastError.message, {
            cause: lastError,
            source: 'retry',
          });

      // Check if error is retryable
      const isRetryable = options.isRetryable
        ? options.isRetryable(extensionError)
        : extensionError.isRetryable();

      // Don't retry if not retryable or last attempt
      if (!isRetryable || attempt === maxAttempts) {
        throw extensionError;
      }

      // Calculate delay for next attempt
      const delay = extensionError.getRetryDelay
        ? extensionError.getRetryDelay(attempt)
        : calculateDelay(attempt, initialDelay, backoffMultiplier, maxDelay, jitter);

      // Call retry callback if provided
      if (options.onRetry) {
        options.onRetry(extensionError, attempt);
      }

      // Wait before retrying
      // eslint-disable-next-line no-await-in-loop
      await sleep(delay);
    }
  }

  // Should never reach here, but throw last error just in case
  throw lastError ?? new Error('Retry failed with unknown error');
}

/**
 * Circuit breaker state
 */
export interface CircuitBreakerState {
  failureCount: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
}

/**
 * Circuit breaker options
 */
export interface CircuitBreakerOptions {
  /**
   * Number of failures before opening circuit
   */
  failureThreshold: number;

  /**
   * Time in ms before attempting to close circuit
   */
  resetTimeout: number;

  /**
   * Success threshold to close circuit from half-open state
   */
  successThreshold: number;
}

/**
 * Circuit breaker implementation
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = {
    failureCount: 0,
    lastFailureTime: 0,
    state: 'closed',
  };

  private successCount = 0;

  constructor(private options: CircuitBreakerOptions) {}

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.state.lastFailureTime;

      // Check if we should try half-open
      if (timeSinceLastFailure >= this.options.resetTimeout) {
        this.state.state = 'half-open';
        this.successCount = 0;
      } else {
        throw new ExtensionError('SERVER_UNAVAILABLE', 'Circuit breaker is open', {
          context: {
            failureCount: this.state.failureCount,
            timeUntilReset: this.options.resetTimeout - timeSinceLastFailure,
          },
          source: 'circuit-breaker',
          severity: 'high',
          recoverable: true,
        });
      }
    }

    try {
      const result = await operation();

      // Success - update circuit state
      if (this.state.state === 'half-open') {
        this.successCount++;

        if (this.successCount >= this.options.successThreshold) {
          // Close circuit
          this.state = {
            failureCount: 0,
            lastFailureTime: 0,
            state: 'closed',
          };
        }
      } else if (this.state.state === 'closed') {
        // Reset failure count on success
        this.state.failureCount = 0;
      }

      return result;
    } catch (error) {
      // Failure - update circuit state
      this.state.failureCount++;
      this.state.lastFailureTime = Date.now();

      if (
        this.state.state === 'half-open' ||
        this.state.failureCount >= this.options.failureThreshold
      ) {
        // Open circuit
        this.state.state = 'open';
      }

      throw error;
    }
  }

  /**
   * Get current circuit state
   */
  getState(): Readonly<CircuitBreakerState> {
    return { ...this.state };
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = {
      failureCount: 0,
      lastFailureTime: 0,
      state: 'closed',
    };
    this.successCount = 0;
  }
}

/**
 * Create a retry-enabled function with circuit breaker
 */
export function createRetryableFunction<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: RetryOptions & { circuitBreaker?: CircuitBreakerOptions } = {},
): (...args: TArgs) => Promise<TResult> {
  const circuitBreaker = options.circuitBreaker
    ? new CircuitBreaker(options.circuitBreaker)
    : undefined;

  return async (...args: TArgs): Promise<TResult> => {
    const operation = () => fn(...args);

    if (circuitBreaker) {
      return circuitBreaker.execute(() => withRetry(operation, options));
    }

    return withRetry(operation, options);
  };
}
