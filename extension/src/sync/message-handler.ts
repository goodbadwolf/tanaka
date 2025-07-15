import { type Message, type MessageResponse, asMessage } from "../core"
import { debugLog } from "../utils/logger"
import type { SyncManagerWithWorker as SyncManager } from "./sync-manager-with-worker"
import type { WindowTracker } from "./window-tracker"

export class MessageHandler {
  constructor(
    private readonly windowTracker: WindowTracker,
    private readonly syncManager: SyncManager,
  ) {}

  async handleMessage(message: unknown): Promise<MessageResponse> {
    const msg = asMessage(message)
    if (!msg) {
      return { error: "Invalid message format" }
    }

    switch (msg.type) {
      case "TRACK_WINDOW":
        return this.handleTrackWindow(msg)

      case "UNTRACK_WINDOW":
        return this.handleUntrackWindow(msg)

      case "GET_TRACKED_WINDOWS":
        return this.handleGetTrackedWindows()

      default:
        return { error: "Unknown message type" }
    }
  }

  private async handleTrackWindow(
    msg: Message & { type: "TRACK_WINDOW" },
  ): Promise<MessageResponse> {
    this.windowTracker.track(msg.windowId)
    debugLog("Now tracking window:", msg.windowId)
    await this.syncManager.start()
    return { success: true }
  }

  private async handleUntrackWindow(
    msg: Message & { type: "UNTRACK_WINDOW" },
  ): Promise<MessageResponse> {
    this.windowTracker.untrack(msg.windowId)
    debugLog("Stopped tracking window:", msg.windowId)

    if (this.windowTracker.getTrackedCount() === 0) {
      this.syncManager.stop()
    } else {
      await this.syncManager.syncNow()
    }
    return { success: true }
  }

  private handleGetTrackedWindows(): MessageResponse {
    return { windowIds: this.windowTracker.getTrackedWindows() }
  }
}
