import type {
  OnMovedMoveInfoType,
  OnRemovedRemoveInfoType,
  OnUpdatedChangeInfoType,
  Tab,
} from '../browser/core';
import browser from 'webextension-polyfill';
import { WindowTracker } from './window-tracker';
import { debugLog } from '../utils/logger';

// Type for onActivated event
export interface OnActivatedActiveInfoType {
  tabId: number;
  windowId: number;
}

export interface TabEventCallbacks {
  onTabCreated?: (tab: Tab) => void;
  onTabUpdated?: (tabId: number, changeInfo: OnUpdatedChangeInfoType, tab: Tab) => void;
  onTabMoved?: (tabId: number, moveInfo: OnMovedMoveInfoType) => void;
  onTabRemoved?: (tabId: number, removeInfo: OnRemovedRemoveInfoType) => void;
  onTabActivated?: (activeInfo: OnActivatedActiveInfoType) => void;
}

export class TabEventHandler {
  private unsubscribers: (() => void)[] = [];

  constructor(
    private readonly windowTracker: WindowTracker,
    private readonly callbacks: TabEventCallbacks,
  ) {}

  start(): void {
    this.setupListeners();
  }

  setupListeners(): void {
    // Store references to bound methods for cleanup
    const handlers = {
      tabCreated: this.handleTabCreated.bind(this),
      tabRemoved: this.handleTabRemoved.bind(this),
      tabUpdated: this.handleTabUpdated.bind(this),
      tabMoved: this.handleTabMoved.bind(this),
      tabActivated: this.handleTabActivated.bind(this),
      windowRemoved: this.handleWindowRemoved.bind(this),
    };

    browser.tabs.onCreated.addListener(handlers.tabCreated);
    browser.tabs.onRemoved.addListener(handlers.tabRemoved);
    browser.tabs.onUpdated.addListener(handlers.tabUpdated);
    browser.tabs.onMoved.addListener(handlers.tabMoved);
    browser.tabs.onActivated.addListener(handlers.tabActivated);
    browser.windows.onRemoved.addListener(handlers.windowRemoved);

    // Store cleanup functions
    this.unsubscribers = [
      () => browser.tabs.onCreated.removeListener(handlers.tabCreated),
      () => browser.tabs.onRemoved.removeListener(handlers.tabRemoved),
      () => browser.tabs.onUpdated.removeListener(handlers.tabUpdated),
      () => browser.tabs.onMoved.removeListener(handlers.tabMoved),
      () => browser.tabs.onActivated.removeListener(handlers.tabActivated),
      () => browser.windows.onRemoved.removeListener(handlers.windowRemoved),
    ];
  }

  cleanup(): void {
    this.unsubscribers.forEach((fn) => fn());
    this.unsubscribers = [];
  }

  private async handleTabCreated(tab: Tab): Promise<void> {
    if (tab.windowId && this.windowTracker.isTracked(tab.windowId)) {
      debugLog('Tab created:', tab);
      this.callbacks.onTabCreated?.(tab);
    }
  }

  private async handleTabRemoved(
    tabId: number,
    removeInfo: OnRemovedRemoveInfoType,
  ): Promise<void> {
    if (this.windowTracker.isTracked(removeInfo.windowId)) {
      debugLog('Tab removed:', tabId);
      this.callbacks.onTabRemoved?.(tabId, removeInfo);
    }
  }

  private async handleTabUpdated(
    tabId: number,
    changeInfo: OnUpdatedChangeInfoType,
    tab: Tab,
  ): Promise<void> {
    if (tab.windowId && this.windowTracker.isTracked(tab.windowId)) {
      debugLog('Tab updated:', tabId, changeInfo);
      this.callbacks.onTabUpdated?.(tabId, changeInfo, tab);
    }
  }

  private async handleTabMoved(tabId: number, moveInfo: OnMovedMoveInfoType): Promise<void> {
    if (this.windowTracker.isTracked(moveInfo.windowId)) {
      debugLog('Tab moved:', tabId);
      this.callbacks.onTabMoved?.(tabId, moveInfo);
    }
  }

  private async handleTabActivated(activeInfo: OnActivatedActiveInfoType): Promise<void> {
    if (this.windowTracker.isTracked(activeInfo.windowId)) {
      debugLog('Tab activated:', activeInfo);
      this.callbacks.onTabActivated?.(activeInfo);
    }
  }

  private async handleWindowRemoved(windowId: number): Promise<void> {
    this.windowTracker.untrack(windowId);
    debugLog('Window removed:', windowId);
  }
}
