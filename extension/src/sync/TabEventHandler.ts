import browser from 'webextension-polyfill';
import type { WindowTracker } from './WindowTracker.js';
import type { SyncManager } from './SyncManager.js';

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
      console.log('Tab created:', tab);
      await this.syncManager.syncNow();
    }
  }

  private async handleTabRemoved(
    tabId: number,
    removeInfo: browser.Tabs.OnRemovedRemoveInfoType,
  ): Promise<void> {
    if (this.windowTracker.isTracked(removeInfo.windowId)) {
      console.log('Tab removed:', tabId);
      await this.syncManager.syncNow();
    }
  }

  private async handleTabUpdated(
    tabId: number,
    changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
    tab: browser.Tabs.Tab,
  ): Promise<void> {
    if (tab.windowId && this.windowTracker.isTracked(tab.windowId) && changeInfo.url) {
      console.log('Tab updated:', tabId, changeInfo);
      await this.syncManager.syncNow();
    }
  }

  private async handleTabMoved(
    tabId: number,
    moveInfo: browser.Tabs.OnMovedMoveInfoType,
  ): Promise<void> {
    if (this.windowTracker.isTracked(moveInfo.windowId)) {
      console.log('Tab moved:', tabId, moveInfo);
      await this.syncManager.syncNow();
    }
  }

  private async handleWindowRemoved(windowId: number): Promise<void> {
    if (this.windowTracker.isTracked(windowId)) {
      this.windowTracker.untrack(windowId);
      console.log('Tracked window removed:', windowId);

      if (this.windowTracker.getTrackedCount() === 0) {
        this.syncManager.stop();
      } else {
        await this.syncManager.syncNow();
      }
    }
  }
}
