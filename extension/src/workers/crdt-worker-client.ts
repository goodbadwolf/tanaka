import type { CrdtOperation } from '../api/sync';
import type { WorkerMessage, WorkerResponse } from './crdt-worker';
import { debugError, debugLog } from '../utils/logger';

export interface CrdtWorkerState {
  queueLength: number;
  lamportClock: string;
  deviceId: string;
}

export class CrdtWorkerClient {
  private worker: Worker | null = null;
  private pendingRequests = new Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
    }
  >();
  private requestId = 0;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.createWorker();
    return this.initPromise;
  }

  private async createWorker(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (typeof Worker === 'undefined') {
          reject(new Error('Web Workers not supported'));
          return;
        }

        this.worker = new Worker('/workers/crdt-worker.js');

        this.worker.addEventListener('message', this.handleMessage.bind(this));
        this.worker.addEventListener('error', (error) => {
          debugError('CRDT Worker error:', error);
          reject(error);
        });

        debugLog('CRDT Worker initialized');
        resolve();
      } catch (error) {
        debugError('Failed to create CRDT Worker:', error);
        reject(error);
      }
    });
  }

  private handleMessage(event: MessageEvent<WorkerResponse>) {
    const { id, success, data, error } = event.data;
    const pending = this.pendingRequests.get(id);

    if (!pending) {
      debugError('Received response for unknown request:', id);
      return;
    }

    this.pendingRequests.delete(id);

    if (success) {
      pending.resolve(data);
    } else {
      pending.reject(new Error(error ?? 'Unknown worker error'));
    }
  }

  private async sendMessage<T>(type: WorkerMessage['type'], payload?: unknown): Promise<T> {
    if (!this.worker) {
      await this.initialize();
    }

    const id = `req-${++this.requestId}`;

    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error('Worker request timeout'));
      }, 5000);

      this.pendingRequests.set(id, {
        resolve: (value) => {
          clearTimeout(timeout);
          resolve(value as T);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });

      const message: WorkerMessage = { id, type, payload };

      this.worker!.postMessage(message);
    });
  }

  async queueOperation(operation: CrdtOperation): Promise<{ priority: number; dedupKey: string }> {
    return this.sendMessage<{ priority: number; dedupKey: string }>('queue', operation);
  }

  async deduplicateOperations(): Promise<CrdtOperation[]> {
    return this.sendMessage<CrdtOperation[]>('deduplicate');
  }

  async getState(): Promise<CrdtWorkerState> {
    return this.sendMessage<CrdtWorkerState>('getState');
  }

  async updateState(deviceId?: string, clock?: string): Promise<void> {
    return this.sendMessage('apply', { deviceId, clock });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.clear();
    this.initPromise = null;
    debugLog('CRDT Worker terminated');
  }
}
