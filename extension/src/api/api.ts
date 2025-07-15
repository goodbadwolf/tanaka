import type { Tab as BrowserTab } from '../browser/core';
import type { Tab } from './models';
import type { SyncRequest, SyncResponse } from './sync';
import { type AsyncResult, ErrorFactories, ExtensionError, createResult } from '../error/types';
import { createRetryableFunction } from '../utils/retry';

export interface TabData {
  url: string;
  title: string;
  favIconUrl: string;
  index: number;
  pinned: boolean;
  active: boolean;
}

export interface TanakaAPIOptions {
  /**
   * Enable retry logic for API calls
   */
  enableRetry?: boolean;

  /**
   * Maximum number of retry attempts
   */
  maxRetryAttempts?: number;

  /**
   * Enable circuit breaker
   */
  enableCircuitBreaker?: boolean;
}

export class TanakaAPI {
  private baseUrl: URL;
  private token = 'unset-token';
  private readonly options: TanakaAPIOptions;
  private readonly retryableRequest: <T>(path: string, options?: RequestInit) => Promise<T>;

  constructor(baseUrl: string, options: TanakaAPIOptions = {}) {
    try {
      this.baseUrl = new URL(baseUrl);
    } catch {
      throw ErrorFactories.invalidServerUrl(baseUrl);
    }

    // Set default options
    this.options = {
      enableRetry: true,
      maxRetryAttempts: 3,
      enableCircuitBreaker: true,
      ...options,
    };

    // Create retryable version of request method
    if (this.options.enableRetry) {
      const retryFn = createRetryableFunction(
        <T>(path: string, options?: RequestInit) => this.request<T>(path, options),
        {
          maxAttempts: this.options.maxRetryAttempts ?? 3,
          circuitBreaker: this.options.enableCircuitBreaker
            ? {
                failureThreshold: 5,
                resetTimeout: 60000, // 1 minute
                successThreshold: 2,
              }
            : undefined,
        },
      );
      this.retryableRequest = (path: string, options?: RequestInit) => retryFn(path, options);
    } else {
      this.retryableRequest = <T>(path: string, options?: RequestInit) =>
        this.request<T>(path, options);
    }
  }

  setAuthToken(token: string) {
    if (!token) {
      throw ErrorFactories.authTokenMissing();
    }

    this.token = token;
  }

  async sync(request: SyncRequest): AsyncResult<SyncResponse, ExtensionError> {
    return createResult(async () => {
      // Convert bigint values to strings for JSON serialization
      const jsonRequest = {
        ...request,
        clock: request.clock.toString(),
        since_clock: request.since_clock ? request.since_clock.toString() : null,
        operations: request.operations.map((op) => {
          // Convert bigint fields in operations to strings
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const jsonOp: any = { ...op };
          if ('updated_at' in jsonOp) {
            jsonOp.updated_at = jsonOp.updated_at.toString();
          }
          if ('closed_at' in jsonOp) {
            jsonOp.closed_at = jsonOp.closed_at.toString();
          }
          if ('data' in jsonOp && jsonOp.data.updated_at) {
            jsonOp.data = {
              ...jsonOp.data,
              updated_at: jsonOp.data.updated_at.toString(),
            };
          }
          return jsonOp;
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await this.retryableRequest<any>('/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonRequest),
      });

      // Convert string values back to bigint in response
      return {
        clock: BigInt(response.clock),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        operations: response.operations.map((op: any) => {
          const resultOp = { ...op };
          if ('updated_at' in resultOp) {
            resultOp.updated_at = BigInt(resultOp.updated_at);
          }
          if ('closed_at' in resultOp) {
            resultOp.closed_at = BigInt(resultOp.closed_at);
          }
          if ('data' in resultOp && resultOp.data.updated_at) {
            resultOp.data = {
              ...resultOp.data,
              updated_at: BigInt(resultOp.data.updated_at),
            };
          }
          return resultOp;
        }),
      } as SyncResponse;
    });
  }

  async checkHealth(): AsyncResult<boolean, ExtensionError> {
    return createResult(async () => {
      await this.retryableRequest('/health');
      return true;
    });
  }

  private getHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      ...additionalHeaders,
    };
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = new URL(path, this.baseUrl);
    const requestStart = performance.now();

    try {
      const response = await fetch(url.toString(), {
        ...options,
        headers: {
          ...this.getHeaders(options.headers as Record<string, string>),
        },
      });

      const responseTime = performance.now() - requestStart;

      if (!response.ok) {
        // Try to parse error response from server
        let serverErrorResponse;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            serverErrorResponse = await response.json();
          }
        } catch {
          // Ignore JSON parsing errors
        }

        // Map HTTP status codes to appropriate error factories
        if (response.status === 401) {
          throw ErrorFactories.authTokenInvalid(
            serverErrorResponse?.error?.message ?? response.statusText,
          );
        } else if (response.status === 403) {
          throw new ExtensionError('PERMISSION_DENIED', `Access denied: ${response.statusText}`, {
            context: {
              url: url.toString(),
              method: options.method ?? 'GET',
              statusCode: response.status,
              responseTime,
            },
            source: 'api',
            severity: 'high',
            recoverable: false,
          });
        } else if (response.status >= 500) {
          throw ErrorFactories.networkFailure(url.toString(), response.status);
        } else {
          throw ErrorFactories.networkFailure(url.toString(), response.status);
        }
      }

      if (response.headers.get('content-type')?.includes('application/json')) {
        return response.json() as Promise<T>;
      }

      return response as unknown as T;
    } catch (error) {
      // If it's already an ExtensionError, re-throw it
      if (error instanceof ExtensionError) {
        throw error;
      }

      // Handle network errors (TypeError is common for network failures)
      if (error instanceof TypeError) {
        throw ErrorFactories.networkFailure(url.toString());
      }

      // Handle other errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new ExtensionError('SERVER_ERROR', `Request failed: ${errorMessage}`, {
        context: {
          url: url.toString(),
          method: options.method ?? 'GET',
          responseTime: performance.now() - requestStart,
        },
        source: 'api',
        cause: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }
}

export function browserTabToSyncTab(tab: BrowserTab, windowId: number): Tab | null {
  if (!tab.id || !tab.url) return null;

  return {
    id: `tab-${tab.id}`,
    windowId: `window-${windowId}`,
    url: tab.url,
    title: tab.title ?? '',
    active: tab.active,
    index: BigInt(tab.index),
    updatedAt: Date.now(),
  };
}

export function parseSyncTab(tab: Tab): TabData {
  // Validate the tab has required fields
  if (!tab.url || typeof tab.title !== 'string') {
    throw new ExtensionError('INVALID_DATA', 'Tab data is missing required fields', {
      context: { tabId: tab.id },
      source: 'parser',
      severity: 'medium',
      recoverable: false,
    });
  }

  // Convert Tab to TabData - note that Tab doesn't have all fields that TabData has
  return {
    url: tab.url,
    title: tab.title,
    favIconUrl: '', // Not available in the new Tab model
    index: Number(tab.index), // Convert bigint to number
    pinned: false, // Not available in the new Tab model
    active: tab.active,
  };
}
