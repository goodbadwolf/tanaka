import type { Tab as BrowserTab } from '../browser/core';
import type { Tab, SyncRequest, SyncResponse } from './models';
import { ExtensionError, ErrorFactories, type AsyncResult, createResult } from '../error/types';

export type { Tab, SyncRequest, SyncResponse };

export interface TabData {
  url: string;
  title: string;
  favIconUrl: string;
  index: number;
  pinned: boolean;
  active: boolean;
}

export class TanakaAPI {
  private baseUrl: URL;
  private token = 'unset-token';

  constructor(baseUrl: string) {
    try {
      this.baseUrl = new URL(baseUrl);
    } catch {
      throw ErrorFactories.invalidServerUrl(baseUrl);
    }
  }

  setAuthToken(token: string) {
    if (!token) {
      throw ErrorFactories.authTokenMissing();
    }

    this.token = token;
  }

  async syncTabs(tabs: Tab[]): AsyncResult<Tab[], ExtensionError> {
    return createResult(async () => {
      const data = await this.request<SyncResponse>('/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tabs } satisfies SyncRequest),
      });

      return data.tabs;
    });
  }

  async checkHealth(): AsyncResult<boolean, ExtensionError> {
    return createResult(async () => {
      await this.request('/health');
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
            serverErrorResponse?.error?.message || response.statusText,
          );
        } else if (response.status === 403) {
          throw new ExtensionError('PERMISSION_DENIED', `Access denied: ${response.statusText}`, {
            context: {
              url: url.toString(),
              method: options.method || 'GET',
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
          method: options.method || 'GET',
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

  const tabData: TabData = {
    url: tab.url,
    title: tab.title || '',
    favIconUrl: tab.favIconUrl || '',
    index: tab.index,
    pinned: tab.pinned,
    active: tab.active,
  };

  return {
    id: `tab-${tab.id}`,
    windowId: `window-${windowId}`,
    data: JSON.stringify(tabData),
    updatedAt: Date.now(),
  };
}

export function parseSyncTab(tab: Tab): TabData {
  try {
    const parsed = JSON.parse(tab.data) as TabData;

    // Validate the parsed data has required fields
    if (!parsed.url || typeof parsed.title !== 'string') {
      throw new ExtensionError('INVALID_DATA', 'Tab data is missing required fields', {
        context: { tabId: tab.id, data: tab.data },
        source: 'parser',
        severity: 'medium',
        recoverable: false,
      });
    }

    return parsed;
  } catch (error) {
    if (error instanceof ExtensionError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new ExtensionError('INVALID_DATA', `Failed to parse tab data: ${errorMessage}`, {
      context: { tabId: tab.id, data: tab.data },
      source: 'parser',
      cause: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
