import browser from 'webextension-polyfill';

export interface TabData {
  url: string;
  title: string;
  favIconUrl: string;
  index: number;
  pinned: boolean;
  active: boolean;
}

export interface Tab {
  id: string;
  window_id: string;
  data: string;
  updated_at: number;
}

interface SyncRequest {
  tabs: Tab[];
}

interface SyncResponse {
  tabs: Tab[];
}

export class APIError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly statusText?: string,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class TanakaAPI {
  private baseUrl: URL;
  private token: string;

  constructor(baseUrl: string = 'http://localhost:3000', token: string = 'tanaka-secret-token') {
    try {
      this.baseUrl = new URL(baseUrl);
    } catch {
      throw new APIError(`Invalid server URL: ${baseUrl}`);
    }
    this.token = token;
  }

  updateConfig(baseUrl: string, token: string) {
    if (!baseUrl) {
      throw new APIError('Invalid base URL');
    }
    if (!token) {
      throw new APIError('Invalid token');
    }

    try {
      this.baseUrl = new URL(baseUrl);
    } catch {
      throw new APIError(`Invalid server URL: ${baseUrl}`);
    }
    this.token = token;
  }

  private getHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      ...additionalHeaders,
    };
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = new URL(path, this.baseUrl);

    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        ...this.getHeaders(options.headers as Record<string, string>),
      },
    });

    if (!response.ok) {
      throw new APIError(
        `Server error: ${response.status} ${response.statusText}`,
        response.status,
        response.statusText,
      );
    }

    if (response.headers.get('content-type')?.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    return response as unknown as T;
  }

  async syncTabs(tabs: Tab[]): Promise<Tab[]> {
    try {
      const data = await this.request<SyncResponse>('/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tabs } as SyncRequest),
      });

      return data.tabs;
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.request('/health');
      return true;
    } catch {
      return false;
    }
  }
}

export function browserTabToSyncTab(tab: browser.Tabs.Tab, windowId: number): Tab | null {
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
    window_id: `window-${windowId}`,
    data: JSON.stringify(tabData),
    updated_at: Date.now(),
  };
}

export function parseSyncTab(tab: Tab): TabData | null {
  try {
    return JSON.parse(tab.data) as TabData;
  } catch {
    return null;
  }
}
