import browser from 'webextension-polyfill';
import type { WindowTracker } from './window-tracker.js';
import type { SyncManager } from './sync-manager.js';
import { debugLog } from '../utils/logger.js';

export class TabEventHandler {
  constructor(
    private readonly windowTracker: WindowTracker,
    private readonly syncManager: SyncManager,
  ) {}

  setupListeners(): void {
    browser.tabs.onCreated.addListener(this.handleTabCreated.bind(this));
    browser.tabs.onRemoved.addListener(this.handleTabRemoved.bind(this));
    browser.tabs.onUpdated.addListener(this.handleTabUpdated.bind(this));
    browser.tabs.onMoved.addListener(this.handleTabMoved.bind(this));
    browser.windows.onRemoved.addListener(this.handleWindowRemoved.bind(this));
  }

  private async handleTabCreated(tab: browser.Tabs.Tab): Promise<void> {
    if (tab.windowId && this.windowTracker.isTracked(tab.windowId)) {
      debugLog('Tab created:', tab);
      await this.syncManager.syncNow();
    }
  }

  private async handleTabRemoved(
    tabId: number,
    removeInfo: browser.Tabs.OnRemovedRemoveInfoType,
  ): Promise<void> {
    if (this.windowTracker.isTracked(removeInfo.windowId)) {
      debugLog('Tab removed:', tabId);
      await this.syncManager.syncNow();
    }
  }

  private async handleTabUpdated(
    tabId: number,
    changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
    tab: browser.Tabs.Tab,
  ): Promise<void> {
    if (tab.windowId && this.windowTracker.isTracked(tab.windowId) && changeInfo.url) {
      debugLog('Tab updated:', tabId, changeInfo);
      await this.syncManager.syncNow();
    }
  }

  private async handleTabMoved(
    tabId: number,
    moveInfo: browser.Tabs.OnMovedMoveInfoType,
  ): Promise<void> {
    if (this.windowTracker.isTracked(moveInfo.windowId)) {
      debugLog('Tab moved:', tabId, moveInfo);
      await this.syncManager.syncNow();
    }
  }

  private async handleWindowRemoved(windowId: number): Promise<void> {
    if (this.windowTracker.isTracked(windowId)) {
      this.windowTracker.untrack(windowId);
      debugLog('Tracked window removed:', windowId);

      if (this.windowTracker.getTrackedCount() === 0) {
        this.syncManager.stop();
      } else {
        await this.syncManager.syncNow();
      }
    }
  }
}
