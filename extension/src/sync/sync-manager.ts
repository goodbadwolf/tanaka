import browser from 'webextension-polyfill';
import { TanakaAPI, browserTabToSyncTab, type Tab } from '../api/api';
import type { WindowTracker } from './window-tracker';
import type { UserSettingsManager } from './user-settings';
import { debugLog, debugError } from '../utils/logger';

export class SyncManager {
  private syncInterval: number | null = null;
  private currentIntervalMs = 5000;

  constructor(
    private readonly api: TanakaAPI,
    private readonly windowTracker: WindowTracker,
    private readonly settingsManager: UserSettingsManager,
  ) {}

  async syncNow(): Promise<void> {
    if (this.windowTracker.getTrackedCount() === 0) return;

    try {
      const localTabs = await this.collectTrackedTabs();
      const allTabs = await this.api.syncTabs(localTabs);
      debugLog(`Synced ${localTabs.length} local tabs, received ${allTabs.length} total tabs`);
    } catch (error) {
      debugError('Sync failed:', error);
    }
  }

  async start(): Promise<void> {
    if (this.syncInterval) return;

    // Load settings and use syncInterval
    const settings = await this.settingsManager.load();
    this.currentIntervalMs = settings.syncInterval;

    this.syncNow();

    this.syncInterval = window.setInterval(() => {
      this.syncNow();
    }, this.currentIntervalMs);
  }

  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async restart(): Promise<void> {
    this.stop();
    await this.start();
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
        debugError(`Failed to get tabs for window ${windowId}:`, error);
      }
    }

    return tabs
      .map((tab) => (tab.windowId ? browserTabToSyncTab(tab, tab.windowId) : null))
      .filter((tab): tab is Tab => tab !== null);
  }
}
