import browser from 'webextension-polyfill';
import { TanakaAPI, browserTabToSyncTab, type Tab } from '../api/api';
import type { WindowTracker } from './window-tracker';

export class SyncManager {
  private syncInterval: number | null = null;
  private readonly SYNC_INTERVAL_MS = 5000;

  constructor(
    private readonly api: TanakaAPI,
    private readonly windowTracker: WindowTracker,
  ) {}

  async syncNow(): Promise<void> {
    if (this.windowTracker.getTrackedCount() === 0) return;

    try {
      const localTabs = await this.collectTrackedTabs();
      const allTabs = await this.api.syncTabs(localTabs);
      console.log(`Synced ${localTabs.length} local tabs, received ${allTabs.length} total tabs`);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  start(): void {
    if (this.syncInterval) return;

    this.syncNow();

    this.syncInterval = window.setInterval(() => {
      this.syncNow();
    }, this.SYNC_INTERVAL_MS);
  }

  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  isRunning(): boolean {
    return this.syncInterval !== null;
  }

  private async collectTrackedTabs(): Promise<Tab[]> {
    const tabs: Parameters<typeof browserTabToSyncTab>[0][] = [];

    for (const windowId of this.windowTracker.getTrackedWindows()) {
      try {
        const windowTabs = await browser.tabs.query({ windowId });
        tabs.push(...windowTabs);
      } catch (error) {
        console.error(`Failed to get tabs for window ${windowId}:`, error);
      }
    }

    return tabs
      .map((tab) => (tab.windowId ? browserTabToSyncTab(tab, tab.windowId) : null))
      .filter((tab): tab is Tab => tab !== null);
  }
}
