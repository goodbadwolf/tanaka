import type { CrdtOperation } from '../api/sync';

export interface WorkerMessage {
  id: string;
  type: 'queue' | 'deduplicate' | 'apply' | 'getState';
  payload?: unknown;
}

export interface WorkerResponse {
  id: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

interface QueuedOperation {
  operation: CrdtOperation;
  priority: OperationPriority;
  timestamp: number;
  dedupKey: string;
}

enum OperationPriority {
  CRITICAL = 0,
  HIGH = 1,
  NORMAL = 2,
  LOW = 3,
}

class CrdtWorker {
  private operationQueue: QueuedOperation[] = [];
  private lamportClock = 0n;
  private deviceId: string;

  constructor() {
    this.deviceId = `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

  queueOperation(operation: CrdtOperation): QueuedOperation {
    this.lamportClock += 1n;

    const queuedOp: QueuedOperation = {
      operation,
      priority: this.getOperationPriority(operation),
      timestamp: Date.now(),
      dedupKey: this.getOperationDedupKey(operation),
    };

    this.operationQueue.push(queuedOp);
    return queuedOp;
  }

  deduplicateOperations(): CrdtOperation[] {
    const dedupMap = new Map<string, QueuedOperation>();

    for (const op of this.operationQueue) {
      const existing = dedupMap.get(op.dedupKey);
      if (!existing || op.timestamp > existing.timestamp) {
        dedupMap.set(op.dedupKey, op);
      }
    }

    const deduped = Array.from(dedupMap.values())
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.timestamp - b.timestamp;
      })
      .map((qo) => qo.operation);

    this.operationQueue = [];
    return deduped;
  }

  getState() {
    return {
      queueLength: this.operationQueue.length,
      lamportClock: this.lamportClock.toString(),
      deviceId: this.deviceId,
    };
  }

  setDeviceId(deviceId: string) {
    this.deviceId = deviceId;
  }

  setClock(clock: bigint) {
    this.lamportClock = clock;
  }
}

const worker = new CrdtWorker();

self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { id, type, payload } = event.data;
  let response: WorkerResponse;

  try {
    switch (type) {
      case 'queue': {
        const operation = payload as CrdtOperation;
        const queued = worker.queueOperation(operation);
        response = {
          id,
          success: true,
          data: {
            priority: queued.priority,
            dedupKey: queued.dedupKey,
          },
        };
        break;
      }

      case 'deduplicate': {
        const operations = worker.deduplicateOperations();
        response = {
          id,
          success: true,
          data: operations,
        };
        break;
      }

      case 'getState': {
        const state = worker.getState();
        response = {
          id,
          success: true,
          data: state,
        };
        break;
      }

      case 'apply': {
        const { deviceId, clock } = payload as { deviceId?: string; clock?: string };
        if (deviceId) {
          worker.setDeviceId(deviceId);
        }
        if (clock) {
          worker.setClock(BigInt(clock));
        }
        response = {
          id,
          success: true,
        };
        break;
      }

      default:
        response = {
          id,
          success: false,
          error: `Unknown message type: ${type}`,
        };
    }
  } catch (error) {
    response = {
      id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  self.postMessage(response);
});

export {};
