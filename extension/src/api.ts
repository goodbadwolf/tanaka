import browser from 'webextension-polyfill';

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

export class TanakaAPI {
  private serverUrl: string;
  private token: string;

  constructor(serverUrl: string = 'http://localhost:3000', token: string = 'tanaka-secret-token') {
    this.serverUrl = serverUrl.replace(/\/$/, ''); // Remove trailing slash
    this.token = token;
  }

  updateConfig(serverUrl: string, token: string) {
    this.serverUrl = serverUrl.replace(/\/$/, ''); // Remove trailing slash
    this.token = token;
  }

  async syncTabs(tabs: Tab[]): Promise<Tab[]> {
    try {
      const response = await fetch(`${this.serverUrl}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ tabs } as SyncRequest),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data: SyncResponse = await response.json();
      return data.tabs;
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Convert browser tab to our Tab format
export function browserTabToSyncTab(tab: browser.Tabs.Tab, windowId: number): Tab | null {
  if (!tab.id || !tab.url) return null;

  return {
    id: `tab-${tab.id}`,
    window_id: `window-${windowId}`,
    data: JSON.stringify({
      url: tab.url,
      title: tab.title || '',
      favIconUrl: tab.favIconUrl || '',
      index: tab.index,
      pinned: tab.pinned,
      active: tab.active,
    }),
    updated_at: Date.now(),
  };
}
