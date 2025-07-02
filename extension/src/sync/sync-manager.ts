import { Result, ok, err } from 'neverthrow';
import type { TanakaAPI } from '../api/api';
import type { WindowTracker } from './window-tracker';
import { TabEventHandler } from './tab-event-handler';
import type { CrdtOperation, SyncRequest } from '../api/sync';
import { ExtensionError } from '../error/types';
import { debugLog, debugError } from '../utils/logger';
import type { IBrowser } from '../browser/core';

interface SyncManagerConfig {
  syncIntervalMs?: number;
  deviceId?: string;
  api: TanakaAPI;
  windowTracker: WindowTracker;
  browser: IBrowser;
}

enum OperationPriority {
  CRITICAL = 0,
  HIGH = 1,
  NORMAL = 2,
  LOW = 3,
}

interface QueuedOperation {
  operation: CrdtOperation;
  priority: OperationPriority;
  timestamp: number;
  dedupKey: string;
}

interface AdaptiveConfig {
  activeIntervalMs: number;
  idleIntervalMs: number;
  errorBackoffMs: number;
  maxBackoffMs: number;
  activityThresholdMs: number;
  batchDelays: Record<OperationPriority, number>;
  maxQueueSize: number;
  queueSizeThreshold: number;
}

const DEFAULT_ADAPTIVE_CONFIG: AdaptiveConfig = {
  activeIntervalMs: 1000,
  idleIntervalMs: 10000,
  errorBackoffMs: 5000,
  maxBackoffMs: 60000,
  activityThresholdMs: 30000,
  batchDelays: {
    [OperationPriority.CRITICAL]: 50,
    [OperationPriority.HIGH]: 200,
    [OperationPriority.NORMAL]: 500,
    [OperationPriority.LOW]: 1000,
  },
  maxQueueSize: 1000,
  queueSizeThreshold: 50,
};

export class SyncManager {
  private baseInterval: number;
  private currentInterval: number;
  private syncTimer: number | null = null;
  private batchTimer: number | null = null;
  private api: TanakaAPI;
  private windowTracker: WindowTracker;
  private browser: IBrowser;
  private deviceId: string;
  private lamportClock = 0n;
  private lastSyncClock: bigint | null = null;
  private operationQueue: QueuedOperation[] = [];
  private isSyncing = false;
  private lastActivityTime = 0;
  private consecutiveErrors = 0;
  private adaptiveConfig: AdaptiveConfig;
  private pendingBatchPriority: OperationPriority | null = null;

  constructor(config: SyncManagerConfig) {
    this.baseInterval = config.syncIntervalMs ?? 5000;
    this.currentInterval = this.baseInterval;
    this.api = config.api;
    this.windowTracker = config.windowTracker;
    this.browser = config.browser;
    this.deviceId = config.deviceId ?? this.generateDeviceId();
    this.adaptiveConfig = DEFAULT_ADAPTIVE_CONFIG;
  }

  private generateDeviceId(): string {
    return `browser-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  start(): void {
    debugLog(
      `Starting Adaptive Sync Manager - baseInterval: ${this.baseInterval}, deviceId: ${this.deviceId}`,
    );

    this.loadPersistedState();
    this.scheduleSyncCheck();
  }

  stop(): void {
    debugLog('Stopping Adaptive Sync Manager');
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  async restart(): Promise<void> {
    debugLog('Restarting Adaptive Sync Manager');
    this.stop();
    this.start();
  }

  isRunning(): boolean {
    return this.syncTimer !== null;
  }

  async syncNow(): Promise<Result<void, ExtensionError>> {
    return this.sync();
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

  private calculateAdaptiveInterval(): number {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivityTime;
    const isActive = timeSinceActivity < this.adaptiveConfig.activityThresholdMs;

    let interval: number;

    if (this.consecutiveErrors > 0) {
      interval = Math.min(
        this.adaptiveConfig.errorBackoffMs * Math.pow(2, this.consecutiveErrors - 1),
        this.adaptiveConfig.maxBackoffMs,
      );
      debugLog(`Using error backoff interval: ${interval}ms (errors: ${this.consecutiveErrors})`);
    } else if (isActive) {
      interval = this.adaptiveConfig.activeIntervalMs;
      debugLog(`Using active interval: ${interval}ms`);
    } else {
      interval = this.adaptiveConfig.idleIntervalMs;
      debugLog(`Using idle interval: ${interval}ms`);
    }

    if (this.operationQueue.length > this.adaptiveConfig.queueSizeThreshold) {
      interval = Math.min(interval, this.adaptiveConfig.activeIntervalMs);
      debugLog(`Queue size ${this.operationQueue.length} exceeds threshold, using faster interval`);
    }

    return interval;
  }

  private scheduleSyncCheck(): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    this.currentInterval = this.calculateAdaptiveInterval();

    this.syncTimer = setTimeout(() => {
      this.sync().then(() => {
        this.scheduleSyncCheck();
      });
    }, this.currentInterval);
  }

  private deduplicateOperations(operations: QueuedOperation[]): CrdtOperation[] {
    const dedupMap = new Map<string, QueuedOperation>();

    for (const op of operations) {
      const existing = dedupMap.get(op.dedupKey);
      if (!existing || op.timestamp > existing.timestamp) {
        dedupMap.set(op.dedupKey, op);
      }
    }

    return Array.from(dedupMap.values())
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.timestamp - b.timestamp;
      })
      .map((qo) => qo.operation);
  }

  async sync(): Promise<Result<void, ExtensionError>> {
    if (this.isSyncing) {
      debugLog('Sync already in progress, skipping');
      return ok(undefined);
    }

    this.isSyncing = true;

    try {
      const operations = this.deduplicateOperations(this.operationQueue);
      this.operationQueue = [];

      const request: SyncRequest = {
        clock: this.lamportClock,
        device_id: this.deviceId,
        since_clock: this.lastSyncClock,
        operations,
      };

      debugLog(
        `Sending adaptive sync - operations: ${operations.length}, interval: ${this.currentInterval}ms`,
      );

      const result = await this.api.sync(request);

      if (!result.success) {
        this.consecutiveErrors++;
        this.operationQueue = operations.map((op) => ({
          operation: op,
          priority: this.getOperationPriority(op),
          timestamp: Date.now(),
          dedupKey: this.getOperationDedupKey(op),
        }));
        return err(result.error);
      }

      this.consecutiveErrors = 0;
      const response = result.data;

      this.lamportClock = response.clock;
      this.lastSyncClock = response.clock;

      await this.applyRemoteOperations(response.operations);
      await this.persistState();

      debugLog(`Adaptive sync completed - remote ops: ${response.operations.length}`);

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
    debugLog(
      `Applying remote operation: ${JSON.stringify(operation, (_, v) => (typeof v === 'bigint' ? v.toString() : v))}`,
    );

    try {
      switch (operation.type) {
        case 'upsert_tab': {
          const tabId = parseInt(operation.id);
          const windowId = parseInt(operation.data.window_id);

          try {
            const tabs = await this.browser.tabs.query({ windowId });
            const existingTab = tabs.find((t) => t.id === tabId);

            if (existingTab) {
              await this.browser.tabs.update(tabId, {
                url: operation.data.url,
                active: operation.data.active,
              });

              if (existingTab.index !== operation.data.index || existingTab.windowId !== windowId) {
                await this.browser.tabs.move(tabId, {
                  windowId,
                  index: operation.data.index,
                });
              }
            } else {
              await this.browser.tabs.create({
                windowId,
                url: operation.data.url,
                active: operation.data.active,
                index: operation.data.index,
              });
            }
          } catch (error) {
            debugError(`Failed to upsert tab ${operation.id}:`, error);
          }
          break;
        }

        case 'close_tab': {
          const tabId = parseInt(operation.id);
          try {
            await this.browser.tabs.remove(tabId);
          } catch {
            debugLog(`Tab ${operation.id} already closed or doesn't exist`);
          }
          break;
        }

        case 'set_active': {
          const tabId = parseInt(operation.id);
          try {
            await this.browser.tabs.update(tabId, { active: operation.active });
          } catch (error) {
            debugError(`Failed to set tab ${operation.id} active state:`, error);
          }
          break;
        }

        case 'move_tab': {
          const tabId = parseInt(operation.id);
          const windowId = parseInt(operation.window_id);
          try {
            await this.browser.tabs.move(tabId, {
              windowId,
              index: operation.index,
            });
          } catch (error) {
            debugError(`Failed to move tab ${operation.id}:`, error);
          }
          break;
        }

        case 'change_url': {
          const tabId = parseInt(operation.id);
          try {
            await this.browser.tabs.update(tabId, {
              url: operation.url,
            });
          } catch (error) {
            debugError(`Failed to update tab ${operation.id} URL:`, error);
          }
          break;
        }

        case 'track_window': {
          const windowId = parseInt(operation.id);
          if (operation.tracked) {
            this.windowTracker.track(windowId);
          }
          break;
        }

        case 'untrack_window': {
          const windowId = parseInt(operation.id);
          this.windowTracker.untrack(windowId);
          break;
        }

        case 'set_window_focus': {
          debugLog(`Window focus operation for window ${operation.id} (not supported in Firefox)`);
          break;
        }

        default: {
          const _exhaustive: never = operation;
          debugError(`Unknown operation type:`, _exhaustive);
        }
      }
    } catch (error) {
      debugError(`Failed to apply operation ${operation.type}:`, error);
    }
  }

  private getOperationPriority(op: CrdtOperation): OperationPriority {
    switch (op.type) {
      case 'close_tab':
      case 'track_window':
      case 'untrack_window':
        return OperationPriority.CRITICAL;
      case 'upsert_tab':
      case 'move_tab':
        return OperationPriority.HIGH;
      case 'set_active':
      case 'set_window_focus':
        return OperationPriority.NORMAL;
      case 'change_url':
        return OperationPriority.LOW;
      default:
        return OperationPriority.NORMAL;
    }
  }

  private getOperationDedupKey(op: CrdtOperation): string {
    switch (op.type) {
      case 'upsert_tab':
      case 'close_tab':
      case 'set_active':
      case 'move_tab':
      case 'change_url':
        return `${op.type}:${op.id}`;
      case 'track_window':
      case 'untrack_window':
      case 'set_window_focus':
        return `window:${op.id}`;
      default: {
        const _exhaustive: never = op;
        return `unknown:${(_exhaustive as CrdtOperation).id}`;
      }
    }
  }

  private queueOperation(operation: CrdtOperation, priority: OperationPriority): void {
    this.incrementClock();
    this.lastActivityTime = Date.now();

    if (this.operationQueue.length >= this.adaptiveConfig.maxQueueSize) {
      debugError(`Operation queue full (${this.adaptiveConfig.maxQueueSize}), dropping oldest`);
      this.operationQueue.shift();
    }

    this.operationQueue.push({
      operation,
      priority,
      timestamp: Date.now(),
      dedupKey: this.getOperationDedupKey(operation),
    });

    this.triggerBatchedSync(priority);
  }

  private triggerBatchedSync(priority: OperationPriority): void {
    if (this.batchTimer && this.pendingBatchPriority !== null) {
      if (priority < this.pendingBatchPriority) {
        clearTimeout(this.batchTimer);
        this.batchTimer = null;
      } else {
        return;
      }
    }

    this.pendingBatchPriority = priority;
    const delay = this.adaptiveConfig.batchDelays[priority];

    this.batchTimer = setTimeout(() => {
      this.batchTimer = null;
      this.pendingBatchPriority = null;

      if (this.syncTimer) {
        clearTimeout(this.syncTimer);
      }

      this.sync().then(() => {
        this.scheduleSyncCheck();
      });
    }, delay);
  }

  queueTabUpsert(
    tabId: string,
    windowId: string,
    url: string,
    title: string,
    active: boolean,
    index: number,
  ): void {
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
    this.queueOperation(operation, OperationPriority.HIGH);
  }

  queueTabClose(tabId: string): void {
    const operation: CrdtOperation = {
      type: 'close_tab',
      id: tabId,
      closed_at: BigInt(Date.now()),
    };
    this.queueOperation(operation, OperationPriority.CRITICAL);
  }

  queueTabActive(tabId: string, active: boolean): void {
    const operation: CrdtOperation = {
      type: 'set_active',
      id: tabId,
      active,
      updated_at: BigInt(Date.now()),
    };
    this.queueOperation(operation, OperationPriority.NORMAL);
  }

  queueTabMove(tabId: string, windowId: string, index: number): void {
    const operation: CrdtOperation = {
      type: 'move_tab',
      id: tabId,
      window_id: windowId,
      index,
      updated_at: BigInt(Date.now()),
    };
    this.queueOperation(operation, OperationPriority.HIGH);
  }

  queueTabUrlChange(tabId: string, url: string, title: string | null): void {
    const operation: CrdtOperation = {
      type: 'change_url',
      id: tabId,
      url,
      title,
      updated_at: BigInt(Date.now()),
    };
    this.queueOperation(operation, OperationPriority.LOW);
  }

  queueWindowTrack(windowId: string, tracked: boolean): void {
    const operation: CrdtOperation = {
      type: 'track_window',
      id: windowId,
      tracked,
      updated_at: BigInt(Date.now()),
    };
    this.queueOperation(operation, OperationPriority.CRITICAL);
  }

  queueWindowUntrack(windowId: string): void {
    const operation: CrdtOperation = {
      type: 'untrack_window',
      id: windowId,
      updated_at: BigInt(Date.now()),
    };
    this.queueOperation(operation, OperationPriority.CRITICAL);
  }

  queueWindowFocus(windowId: string, focused: boolean): void {
    const operation: CrdtOperation = {
      type: 'set_window_focus',
      id: windowId,
      focused,
      updated_at: BigInt(Date.now()),
    };
    this.queueOperation(operation, OperationPriority.NORMAL);
  }

  private incrementClock(): void {
    this.lamportClock += 1n;
  }

  async setupTabEventHandler(): Promise<TabEventHandler> {
    const handler = new TabEventHandler(this.windowTracker, {
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
