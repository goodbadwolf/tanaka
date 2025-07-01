import { Result, ok, err } from 'neverthrow';
import type { TanakaAPI } from '../api/api';
import type { WindowTracker } from './window-tracker';
import { TabEventHandlerV2 } from './tab-event-handler-v2';
import type { CrdtOperation, SyncV2Request } from '../api/sync';
import { ExtensionError } from '../error/types';
import { debugLog, debugError } from '../utils/logger';
import type { IBrowser } from '../browser/core';

interface SyncV2ManagerConfig {
  syncIntervalMs?: number;
  deviceId?: string;
  api: TanakaAPI;
  windowTracker: WindowTracker;
  browser: IBrowser;
}

export class SyncV2Manager {
  private syncInterval: number;
  private syncTimer: number | null = null;
  private api: TanakaAPI;
  private windowTracker: WindowTracker;
  private browser: IBrowser;
  private deviceId: string;
  private lamportClock = 0n;
  private lastSyncClock: bigint | null = null;
  private operationQueue: CrdtOperation[] = [];
  private isSyncing = false;

  constructor(config: SyncV2ManagerConfig) {
    this.syncInterval = config.syncIntervalMs ?? 5000;
    this.api = config.api;
    this.windowTracker = config.windowTracker;
    this.browser = config.browser;
    this.deviceId = config.deviceId ?? this.generateDeviceId();
  }

  private generateDeviceId(): string {
    // Generate a unique device ID based on browser instance
    return `browser-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  start(): void {
    debugLog(
      `Starting Sync v2 Manager - syncInterval: ${this.syncInterval}, deviceId: ${this.deviceId}`,
    );

    // Load persisted state
    this.loadPersistedState();

    // Start sync timer
    this.scheduleSyncCheck();
  }

  stop(): void {
    debugLog('Stopping Sync v2 Manager');
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
  }

  private async loadPersistedState(): Promise<void> {
    try {
      const stored = await this.browser.localStorage.get([
        'deviceId',
        'lamportClock',
        'lastSyncClock',
      ]);

      if (stored.deviceId && typeof stored.deviceId === 'string') {
        this.deviceId = stored.deviceId;
      } else {
        await this.browser.localStorage.set({ deviceId: this.deviceId });
      }

      if (stored.lamportClock && typeof stored.lamportClock === 'string') {
        this.lamportClock = BigInt(stored.lamportClock);
      }

      if (stored.lastSyncClock && typeof stored.lastSyncClock === 'string') {
        this.lastSyncClock = BigInt(stored.lastSyncClock);
      }
    } catch (error) {
      debugError('Failed to load persisted state', error);
    }
  }

  private async persistState(): Promise<void> {
    try {
      await this.browser.localStorage.set({
        deviceId: this.deviceId,
        lamportClock: this.lamportClock.toString(),
        lastSyncClock: this.lastSyncClock?.toString() ?? null,
      });
    } catch (error) {
      debugError('Failed to persist state', error);
    }
  }

  private scheduleSyncCheck(): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    this.syncTimer = setTimeout(() => {
      this.sync().then(() => {
        this.scheduleSyncCheck();
      });
    }, this.syncInterval);
  }

  async sync(): Promise<Result<void, ExtensionError>> {
    if (this.isSyncing) {
      debugLog('Sync already in progress, skipping');
      return ok(undefined);
    }

    this.isSyncing = true;

    try {
      // Get current operations from queue
      const operations = [...this.operationQueue];
      this.operationQueue = [];

      // Create sync request
      const request: SyncV2Request = {
        clock: this.lamportClock,
        device_id: this.deviceId,
        since_clock: this.lastSyncClock,
        operations,
      };

      debugLog(
        `Sending sync v2 request - operations: ${operations.length}, clock: ${this.lamportClock.toString()}, sinceClock: ${this.lastSyncClock?.toString()}`,
      );

      // Call sync v2 endpoint
      const result = await this.api.syncV2(request);

      if (!result.success) {
        // Re-queue operations on failure
        this.operationQueue = [...operations, ...this.operationQueue];
        return err(result.error);
      }

      const response = result.data;

      // Update clocks
      this.lamportClock = response.clock;
      this.lastSyncClock = response.clock;

      // Apply remote operations
      await this.applyRemoteOperations(response.operations);

      // Persist state
      await this.persistState();

      debugLog(
        `Sync v2 completed - remoteOperations: ${response.operations.length}, newClock: ${response.clock.toString()}`,
      );

      return ok(undefined);
    } finally {
      this.isSyncing = false;
    }
  }

  private async applyRemoteOperations(operations: CrdtOperation[]): Promise<void> {
    for (const op of operations) {
      try {
        await this.applyOperation(op);
      } catch (error) {
        debugError(`Failed to apply operation: ${JSON.stringify(op)}`, error);
      }
    }
  }

  private async applyOperation(operation: CrdtOperation): Promise<void> {
    debugLog(`Applying remote operation: ${JSON.stringify(operation)}`);

    // TODO: Implement actual application of operations
    // This would update local tab state based on the operation type
    switch (operation.type) {
      case 'upsert_tab':
        // Update or create tab in local state
        break;
      case 'close_tab':
        // Mark tab as closed
        break;
      case 'set_active':
        // Update tab active state
        break;
      case 'move_tab':
        // Move tab to new window/index
        break;
      case 'change_url':
        // Update tab URL
        break;
      case 'track_window':
        // Track window
        this.windowTracker.track(parseInt(operation.id));
        break;
      case 'untrack_window':
        // Untrack window
        this.windowTracker.untrack(parseInt(operation.id));
        break;
      case 'set_window_focus':
        // Update window focus
        break;
    }
  }

  // Methods to add operations to queue

  queueTabUpsert(
    tabId: string,
    windowId: string,
    url: string,
    title: string,
    active: boolean,
    index: number,
  ): void {
    this.incrementClock();
    const operation: CrdtOperation = {
      type: 'upsert_tab',
      id: tabId,
      data: {
        window_id: windowId,
        url,
        title,
        active,
        index,
        updated_at: BigInt(Date.now()),
      },
    };
    this.operationQueue.push(operation);
    this.triggerImmediateSync();
  }

  queueTabClose(tabId: string): void {
    this.incrementClock();
    const operation: CrdtOperation = {
      type: 'close_tab',
      id: tabId,
      closed_at: BigInt(Date.now()),
    };
    this.operationQueue.push(operation);
    this.triggerImmediateSync();
  }

  queueTabActive(tabId: string, active: boolean): void {
    this.incrementClock();
    const operation: CrdtOperation = {
      type: 'set_active',
      id: tabId,
      active,
      updated_at: BigInt(Date.now()),
    };
    this.operationQueue.push(operation);
    this.triggerImmediateSync();
  }

  queueTabMove(tabId: string, windowId: string, index: number): void {
    this.incrementClock();
    const operation: CrdtOperation = {
      type: 'move_tab',
      id: tabId,
      window_id: windowId,
      index,
      updated_at: BigInt(Date.now()),
    };
    this.operationQueue.push(operation);
    this.triggerImmediateSync();
  }

  queueTabUrlChange(tabId: string, url: string, title: string | null): void {
    this.incrementClock();
    const operation: CrdtOperation = {
      type: 'change_url',
      id: tabId,
      url,
      title,
      updated_at: BigInt(Date.now()),
    };
    this.operationQueue.push(operation);
    this.triggerImmediateSync();
  }

  queueWindowTrack(windowId: string, tracked: boolean): void {
    this.incrementClock();
    const operation: CrdtOperation = {
      type: 'track_window',
      id: windowId,
      tracked,
      updated_at: BigInt(Date.now()),
    };
    this.operationQueue.push(operation);
    this.triggerImmediateSync();
  }

  queueWindowUntrack(windowId: string): void {
    this.incrementClock();
    const operation: CrdtOperation = {
      type: 'untrack_window',
      id: windowId,
      updated_at: BigInt(Date.now()),
    };
    this.operationQueue.push(operation);
    this.triggerImmediateSync();
  }

  queueWindowFocus(windowId: string, focused: boolean): void {
    this.incrementClock();
    const operation: CrdtOperation = {
      type: 'set_window_focus',
      id: windowId,
      focused,
      updated_at: BigInt(Date.now()),
    };
    this.operationQueue.push(operation);
    this.triggerImmediateSync();
  }

  private incrementClock(): void {
    this.lamportClock += 1n;
  }

  private triggerImmediateSync(): void {
    // Cancel current timer and sync immediately
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    // Sync after a short delay to batch operations
    setTimeout(() => {
      this.sync().then(() => {
        this.scheduleSyncCheck();
      });
    }, 100);
  }

  async setupTabEventHandler(): Promise<TabEventHandlerV2> {
    const handler = new TabEventHandlerV2(this.windowTracker, {
      onTabCreated: (tab) => {
        if (tab.id && tab.windowId && this.windowTracker.isTracked(tab.windowId)) {
          this.queueTabUpsert(
            tab.id.toString(),
            tab.windowId.toString(),
            tab.url ?? '',
            tab.title ?? '',
            tab.active ?? false,
            tab.index,
          );
        }
      },
      onTabUpdated: (tabId, changeInfo, tab) => {
        if (tab.windowId && this.windowTracker.isTracked(tab.windowId)) {
          if (changeInfo.url || changeInfo.title) {
            this.queueTabUrlChange(tabId.toString(), tab.url ?? '', tab.title ?? null);
          }
        }
      },
      onTabMoved: (tabId, moveInfo) => {
        if (this.windowTracker.isTracked(moveInfo.windowId)) {
          this.queueTabMove(tabId.toString(), moveInfo.windowId.toString(), moveInfo.toIndex);
        }
      },
      onTabRemoved: (tabId, removeInfo) => {
        if (this.windowTracker.isTracked(removeInfo.windowId)) {
          this.queueTabClose(tabId.toString());
        }
      },
      onTabActivated: (activeInfo) => {
        if (this.windowTracker.isTracked(activeInfo.windowId)) {
          this.queueTabActive(activeInfo.tabId.toString(), true);
        }
      },
    });

    handler.start();
    return handler;
  }
}
