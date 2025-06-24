import { injectable, inject } from 'tsyringe';
import type {
  IBrowser,
  Tab,
  OnRemovedRemoveInfoType,
  OnUpdatedChangeInfoType,
  OnMovedMoveInfoType,
} from '../browser/core.js';
import { WindowTracker } from './window-tracker.js';
import { SyncManager } from './sync-manager.js';
import { debugLog } from '../utils/logger.js';

@injectable()
export class TabEventHandler {
  private unsubscribers: (() => void)[] = [];

  constructor(
    @inject('IBrowser') private readonly browser: IBrowser,
    @inject(WindowTracker) private readonly windowTracker: WindowTracker,
    @inject(SyncManager) private readonly syncManager: SyncManager,
  ) {}

  setupListeners(): void {
    // Store references to bound methods for cleanup
    const handlers = {
      tabCreated: this.handleTabCreated.bind(this),
      tabRemoved: this.handleTabRemoved.bind(this),
      tabUpdated: this.handleTabUpdated.bind(this),
      tabMoved: this.handleTabMoved.bind(this),
      windowRemoved: this.handleWindowRemoved.bind(this),
    };

    this.browser.tabs.onCreated.addListener(handlers.tabCreated);
    this.browser.tabs.onRemoved.addListener(handlers.tabRemoved);
    this.browser.tabs.onUpdated.addListener(handlers.tabUpdated);
    this.browser.tabs.onMoved.addListener(handlers.tabMoved);
    this.browser.windows.onRemoved.addListener(handlers.windowRemoved);

    // Store cleanup functions
    this.unsubscribers = [
      () => this.browser.tabs.onCreated.removeListener(handlers.tabCreated),
      () => this.browser.tabs.onRemoved.removeListener(handlers.tabRemoved),
      () => this.browser.tabs.onUpdated.removeListener(handlers.tabUpdated),
      () => this.browser.tabs.onMoved.removeListener(handlers.tabMoved),
      () => this.browser.windows.onRemoved.removeListener(handlers.windowRemoved),
    ];
  }

  cleanup(): void {
    this.unsubscribers.forEach((fn) => fn());
    this.unsubscribers = [];
  }

  private async handleTabCreated(tab: Tab): Promise<void> {
    if (tab.windowId && this.windowTracker.isTracked(tab.windowId)) {
      debugLog('Tab created:', tab);
      await this.syncManager.syncNow();
    }
  }

  private async handleTabRemoved(
    tabId: number,
    removeInfo: OnRemovedRemoveInfoType,
  ): Promise<void> {
    if (this.windowTracker.isTracked(removeInfo.windowId)) {
      debugLog('Tab removed:', tabId);
      await this.syncManager.syncNow();
    }
  }

  private async handleTabUpdated(
    tabId: number,
    changeInfo: OnUpdatedChangeInfoType,
    tab: Tab,
  ): Promise<void> {
    if (tab.windowId && this.windowTracker.isTracked(tab.windowId) && changeInfo.url) {
      debugLog('Tab updated:', tabId, changeInfo);
      await this.syncManager.syncNow();
    }
  }

  private async handleTabMoved(tabId: number, moveInfo: OnMovedMoveInfoType): Promise<void> {
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
