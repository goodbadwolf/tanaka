import { Result, err, ok } from "neverthrow"
import type { TanakaAPI } from "../api/api"
import { EXTENSION_PERMISSION_DENIED } from "../api/errors"
import type { CrdtOperation, SyncRequest } from "../api/sync"
import type { IBrowser } from "../browser/core"
import { ExtensionError } from "../error/types"
import { PermissionsService } from "../services/permissions"
import { debugError, debugLog } from "../utils/logger"
import { CrdtWorkerClient } from "../workers/crdt-worker-client"
import { TabEventHandler } from "./tab-event-handler"
import type { WindowTracker } from "./window-tracker"

interface SyncManagerConfig {
  syncIntervalMs?: number
  deviceId?: string
  api: TanakaAPI
  windowTracker: WindowTracker
  browser: IBrowser
}

enum OperationPriority {
  CRITICAL = 0,
  HIGH = 1,
  NORMAL = 2,
  LOW = 3,
}

interface AdaptiveConfig {
  activeIntervalMs: number
  idleIntervalMs: number
  errorBackoffMs: number
  maxBackoffMs: number
  activityThresholdMs: number
  batchDelays: Record<OperationPriority, number>
  maxQueueSize: number
  queueSizeThreshold: number
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
}

export class SyncManagerWithWorker {
  private baseInterval: number
  private currentInterval: number
  private syncTimer: number | null = null
  private batchTimer: number | null = null
  private api: TanakaAPI
  private windowTracker: WindowTracker
  private browser: IBrowser
  private deviceId: string
  private lamportClock = 0n
  private lastSyncClock: bigint | null = null
  private isSyncing = false
  private lastActivityTime = 0
  private consecutiveErrors = 0
  private adaptiveConfig: AdaptiveConfig
  private pendingBatchPriority: OperationPriority | null = null
  private worker: CrdtWorkerClient
  private permissionsService: PermissionsService

  constructor(config: SyncManagerConfig) {
    this.baseInterval = config.syncIntervalMs ?? 5000
    this.currentInterval = this.baseInterval
    this.api = config.api
    this.windowTracker = config.windowTracker
    this.browser = config.browser
    this.deviceId = config.deviceId ?? this.generateDeviceId()
    this.adaptiveConfig = DEFAULT_ADAPTIVE_CONFIG
    this.worker = new CrdtWorkerClient()
    this.permissionsService = new PermissionsService(this.browser)
  }

  private generateDeviceId(): string {
    return `browser-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  async start(): Promise<void> {
    debugLog(
      `Starting Adaptive Sync Manager with Worker - baseInterval: ${this.baseInterval}, deviceId: ${this.deviceId}`,
    )

    await this.worker.initialize()
    await this.loadPersistedState()
    await this.scheduleSyncCheck()
  }

  stop(): void {
    debugLog("Stopping Adaptive Sync Manager with Worker")
    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
      this.syncTimer = null
    }
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }
    this.worker.terminate()
  }

  async restart(): Promise<void> {
    debugLog("Restarting Adaptive Sync Manager with Worker")
    this.stop()
    await this.start()
  }

  isRunning(): boolean {
    return this.syncTimer !== null
  }

  async syncNow(): Promise<Result<void, ExtensionError>> {
    return this.sync()
  }

  private async loadPersistedState(): Promise<void> {
    try {
      const stored = await this.browser.localStorage.get([
        "deviceId",
        "lamportClock",
        "lastSyncClock",
      ])

      if (stored.deviceId && typeof stored.deviceId === "string") {
        this.deviceId = stored.deviceId
      } else {
        await this.browser.localStorage.set({ deviceId: this.deviceId })
      }

      if (stored.lamportClock && typeof stored.lamportClock === "string") {
        this.lamportClock = BigInt(stored.lamportClock)
      }

      if (stored.lastSyncClock && typeof stored.lastSyncClock === "string") {
        this.lastSyncClock = BigInt(stored.lastSyncClock)
      }

      await this.worker.updateState(this.deviceId, this.lamportClock.toString())
    } catch (error) {
      debugError("Failed to load persisted state", error)
    }
  }

  private async persistState(): Promise<void> {
    try {
      await this.browser.localStorage.set({
        deviceId: this.deviceId,
        lamportClock: this.lamportClock.toString(),
        lastSyncClock: this.lastSyncClock?.toString() ?? null,
      })
    } catch (error) {
      debugError("Failed to persist state", error)
    }
  }

  private async calculateAdaptiveInterval(): Promise<number> {
    const now = Date.now()
    const timeSinceActivity = now - this.lastActivityTime
    const isActive = timeSinceActivity < this.adaptiveConfig.activityThresholdMs

    let interval: number

    if (this.consecutiveErrors > 0) {
      interval = Math.min(
        this.adaptiveConfig.errorBackoffMs *
          Math.pow(2, this.consecutiveErrors - 1),
        this.adaptiveConfig.maxBackoffMs,
      )
      debugLog(
        `Using error backoff interval: ${interval}ms (errors: ${this.consecutiveErrors})`,
      )
    } else if (isActive) {
      interval = this.adaptiveConfig.activeIntervalMs
      debugLog(`Using active interval: ${interval}ms`)
    } else {
      interval = this.adaptiveConfig.idleIntervalMs
      debugLog(`Using idle interval: ${interval}ms`)
    }

    try {
      const state = await this.worker.getState()
      if (state.queueLength > this.adaptiveConfig.queueSizeThreshold) {
        interval = Math.min(interval, this.adaptiveConfig.activeIntervalMs)
        debugLog(
          `Queue size ${state.queueLength} exceeds threshold, using faster interval`,
        )
      }
    } catch (error) {
      debugError("Failed to get worker state", error)
    }

    return interval
  }

  private async scheduleSyncCheck(): Promise<void> {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
    }

    this.currentInterval = await this.calculateAdaptiveInterval()

    this.syncTimer = window.setTimeout(async () => {
      await this.sync()
      await this.scheduleSyncCheck()
    }, this.currentInterval)
  }

  async sync(): Promise<Result<void, ExtensionError>> {
    if (this.isSyncing) {
      debugLog("Sync already in progress, skipping")
      return ok(undefined)
    }

    // Check permissions before attempting to sync
    const permissionCheck = await this.permissionsService.checkPermissions()
    if (permissionCheck.isErr()) {
      debugError("Permission check failed", permissionCheck.error)
      return err(permissionCheck.error)
    }

    if (!permissionCheck.value) {
      debugLog("Missing required permissions for sync")
      const missingPermsResult =
        await this.permissionsService.getMissingPermissions()
      const missingPerms = missingPermsResult.isOk()
        ? missingPermsResult.value.permissions
        : []

      return err(
        new ExtensionError(
          EXTENSION_PERMISSION_DENIED,
          "Missing required permissions for sync",
          {
            context: { missingPermissions: missingPerms },
            recoveryActions: [
              "Grant the required permissions",
              "Click the extension icon and follow the permission prompt",
            ],
          },
        ),
      )
    }

    this.isSyncing = true

    try {
      const operations = await this.worker.deduplicateOperations()

      const request: SyncRequest = {
        clock: this.lamportClock,
        device_id: this.deviceId,
        since_clock: this.lastSyncClock,
        operations,
      }

      debugLog(
        `Sending adaptive sync - operations: ${operations.length}, interval: ${this.currentInterval}ms`,
      )

      const result = await this.api.sync(request)

      if (!result.success) {
        this.consecutiveErrors++
        await Promise.all(operations.map((op) => this.worker.queueOperation(op)))
        return err(result.error)
      }

      this.consecutiveErrors = 0
      const response = result.data

      this.lamportClock = response.clock
      this.lastSyncClock = response.clock

      await this.applyRemoteOperations(response.operations)
      await this.persistState()
      await this.worker.updateState(this.deviceId, this.lamportClock.toString())

      debugLog(
        `Adaptive sync completed - remote ops: ${response.operations.length}`,
      )

      return ok(undefined)
    } finally {
      this.isSyncing = false
    }
  }

  private async applyRemoteOperations(
    operations: CrdtOperation[],
  ): Promise<void> {
    // Operations must be applied in order to maintain CRDT consistency
    for (const op of operations) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await this.applyOperation(op)
      } catch (error) {
        debugError(`Failed to apply operation: ${JSON.stringify(op)}`, error)
      }
    }
  }

  private async applyOperation(operation: CrdtOperation): Promise<void> {
    debugLog(
      `Applying remote operation: ${JSON.stringify(operation, (_, v) => (typeof v === "bigint" ? v.toString() : v))}`,
    )

    try {
      switch (operation.type) {
        case "upsert_tab": {
          const tabId = parseInt(operation.id)
          const windowId = parseInt(operation.data.window_id)

          try {
            const tabs = await this.browser.tabs.query({ windowId })
            const existingTab = tabs.find((t) => t.id === tabId)

            if (existingTab) {
              await this.browser.tabs.update(tabId, {
                url: operation.data.url,
                active: operation.data.active,
              })

              if (
                existingTab.index !== operation.data.index ||
                existingTab.windowId !== windowId
              ) {
                await this.browser.tabs.move(tabId, {
                  windowId,
                  index: operation.data.index,
                })
              }
            } else {
              await this.browser.tabs.create({
                windowId,
                url: operation.data.url,
                active: operation.data.active,
                index: operation.data.index,
              })
            }
          } catch (error) {
            debugError(`Failed to upsert tab ${operation.id}:`, error)
          }
          break
        }

        case "close_tab": {
          const tabId = parseInt(operation.id)
          try {
            await this.browser.tabs.remove(tabId)
          } catch {
            debugLog(`Tab ${operation.id} already closed or doesn't exist`)
          }
          break
        }

        case "set_active": {
          const tabId = parseInt(operation.id)
          try {
            await this.browser.tabs.update(tabId, { active: operation.active })
          } catch (error) {
            debugError(`Failed to set tab ${operation.id} active state:`, error)
          }
          break
        }

        case "move_tab": {
          const tabId = parseInt(operation.id)
          const windowId = parseInt(operation.window_id)
          try {
            await this.browser.tabs.move(tabId, {
              windowId,
              index: operation.index,
            })
          } catch (error) {
            debugError(`Failed to move tab ${operation.id}:`, error)
          }
          break
        }

        case "change_url": {
          const tabId = parseInt(operation.id)
          try {
            await this.browser.tabs.update(tabId, {
              url: operation.url,
            })
          } catch (error) {
            debugError(`Failed to update tab ${operation.id} URL:`, error)
          }
          break
        }

        case "track_window": {
          const windowId = parseInt(operation.id)
          if (operation.tracked) {
            this.windowTracker.track(windowId)
          }
          break
        }

        case "untrack_window": {
          const windowId = parseInt(operation.id)
          this.windowTracker.untrack(windowId)
          break
        }

        case "set_window_focus": {
          debugLog(
            `Window focus operation for window ${operation.id} (not supported in Firefox)`,
          )
          break
        }

        default: {
          const _exhaustive: never = operation
          debugError(`Unknown operation type:`, _exhaustive)
        }
      }
    } catch (error) {
      debugError(`Failed to apply operation ${operation.type}:`, error)
    }
  }

  private async triggerBatchedSync(priority: OperationPriority): Promise<void> {
    // Check queue size threshold for immediate sync
    try {
      const state = await this.worker.getState()
      if (
        state.queueLength >= this.adaptiveConfig.queueSizeThreshold &&
        !this.isSyncing
      ) {
        debugLog(
          `Queue size ${state.queueLength} exceeds threshold, triggering immediate sync`,
        )

        // Cancel any pending batch timer
        if (this.batchTimer) {
          clearTimeout(this.batchTimer)
          this.batchTimer = null
          this.pendingBatchPriority = null
        }

        // Cancel regular sync timer to avoid duplicate sync
        if (this.syncTimer) {
          clearTimeout(this.syncTimer)
        }

        // Trigger immediate sync without waiting for completion
        this.sync()
          .then(() => {
            this.scheduleSyncCheck()
          })
          .catch((error) => {
            debugError("Queue threshold sync failed", error)
            this.scheduleSyncCheck()
          })
        return
      }
    } catch (error) {
      debugError("Failed to check queue size for threshold", error)
    }

    // Original priority-based batching logic
    if (this.batchTimer && this.pendingBatchPriority !== null) {
      if (priority < this.pendingBatchPriority) {
        clearTimeout(this.batchTimer)
        this.batchTimer = null
      } else {
        return
      }
    }

    this.pendingBatchPriority = priority
    const delay = this.adaptiveConfig.batchDelays[priority]

    this.batchTimer = window.setTimeout(() => {
      this.batchTimer = null
      this.pendingBatchPriority = null

      if (this.syncTimer) {
        clearTimeout(this.syncTimer)
      }

      this.sync().then(() => {
        this.scheduleSyncCheck()
      })
    }, delay)
  }

  async queueTabUpsert(
    tabId: string,
    windowId: string,
    url: string,
    title: string,
    active: boolean,
    index: number,
  ): Promise<void> {
    const operation: CrdtOperation = {
      type: "upsert_tab",
      id: tabId,
      data: {
        window_id: windowId,
        url,
        title,
        active,
        index,
        updated_at: BigInt(Date.now()),
      },
    }

    this.lastActivityTime = Date.now()
    await this.incrementClock()
    const { priority } = await this.worker.queueOperation(operation)
    await this.triggerBatchedSync(priority)
  }

  async queueTabClose(tabId: string): Promise<void> {
    const operation: CrdtOperation = {
      type: "close_tab",
      id: tabId,
      closed_at: BigInt(Date.now()),
    }

    this.lastActivityTime = Date.now()
    await this.incrementClock()
    const { priority } = await this.worker.queueOperation(operation)
    await this.triggerBatchedSync(priority)
  }

  async queueTabActive(tabId: string, active: boolean): Promise<void> {
    const operation: CrdtOperation = {
      type: "set_active",
      id: tabId,
      active,
      updated_at: BigInt(Date.now()),
    }

    this.lastActivityTime = Date.now()
    await this.incrementClock()
    const { priority } = await this.worker.queueOperation(operation)
    await this.triggerBatchedSync(priority)
  }

  async queueTabMove(
    tabId: string,
    windowId: string,
    index: number,
  ): Promise<void> {
    const operation: CrdtOperation = {
      type: "move_tab",
      id: tabId,
      window_id: windowId,
      index,
      updated_at: BigInt(Date.now()),
    }

    this.lastActivityTime = Date.now()
    await this.incrementClock()
    const { priority } = await this.worker.queueOperation(operation)
    await this.triggerBatchedSync(priority)
  }

  async queueTabUrlChange(
    tabId: string,
    url: string,
    title: string | null,
  ): Promise<void> {
    const operation: CrdtOperation = {
      type: "change_url",
      id: tabId,
      url,
      title,
      updated_at: BigInt(Date.now()),
    }

    this.lastActivityTime = Date.now()
    await this.incrementClock()
    const { priority } = await this.worker.queueOperation(operation)
    await this.triggerBatchedSync(priority)
  }

  async queueWindowTrack(windowId: string, tracked: boolean): Promise<void> {
    const operation: CrdtOperation = {
      type: "track_window",
      id: windowId,
      tracked,
      updated_at: BigInt(Date.now()),
    }

    this.lastActivityTime = Date.now()
    await this.incrementClock()
    const { priority } = await this.worker.queueOperation(operation)
    await this.triggerBatchedSync(priority)
  }

  async queueWindowUntrack(windowId: string): Promise<void> {
    const operation: CrdtOperation = {
      type: "untrack_window",
      id: windowId,
      updated_at: BigInt(Date.now()),
    }

    this.lastActivityTime = Date.now()
    await this.incrementClock()
    const { priority } = await this.worker.queueOperation(operation)
    await this.triggerBatchedSync(priority)
  }

  async queueWindowFocus(windowId: string, focused: boolean): Promise<void> {
    const operation: CrdtOperation = {
      type: "set_window_focus",
      id: windowId,
      focused,
      updated_at: BigInt(Date.now()),
    }

    this.lastActivityTime = Date.now()
    await this.incrementClock()
    const { priority } = await this.worker.queueOperation(operation)
    await this.triggerBatchedSync(priority)
  }

  private async incrementClock(): Promise<void> {
    this.lamportClock += 1n
    await this.worker.updateState(this.deviceId, this.lamportClock.toString())
  }

  async setupTabEventHandler(): Promise<TabEventHandler> {
    const handler = new TabEventHandler(this.windowTracker, {
      onTabCreated: (tab) => {
        if (
          tab.id &&
          tab.windowId &&
          this.windowTracker.isTracked(tab.windowId)
        ) {
          this.queueTabUpsert(
            tab.id.toString(),
            tab.windowId.toString(),
            tab.url ?? "",
            tab.title ?? "",
            tab.active ?? false,
            tab.index,
          )
        }
      },
      onTabUpdated: (tabId, changeInfo, tab) => {
        if (tab.windowId && this.windowTracker.isTracked(tab.windowId)) {
          if (changeInfo.url || changeInfo.title) {
            this.queueTabUrlChange(
              tabId.toString(),
              tab.url ?? "",
              tab.title ?? null,
            )
          }
        }
      },
      onTabMoved: (tabId, moveInfo) => {
        if (this.windowTracker.isTracked(moveInfo.windowId)) {
          this.queueTabMove(
            tabId.toString(),
            moveInfo.windowId.toString(),
            moveInfo.toIndex,
          )
        }
      },
      onTabRemoved: (tabId, removeInfo) => {
        if (this.windowTracker.isTracked(removeInfo.windowId)) {
          this.queueTabClose(tabId.toString())
        }
      },
      onTabActivated: (activeInfo) => {
        if (this.windowTracker.isTracked(activeInfo.windowId)) {
          this.queueTabActive(activeInfo.tabId.toString(), true)
        }
      },
    })

    handler.start()
    return handler
  }
}
