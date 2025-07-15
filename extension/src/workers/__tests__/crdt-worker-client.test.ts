/*
import { CrdtWorkerClient } from '../crdt-worker-client';
import type { CrdtOperation } from '../../api/sync';

const mockWorker = {
  postMessage: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  terminate: jest.fn(),
};

const mockWorkerConstructor = jest.fn(() => mockWorker);

global.Worker = mockWorkerConstructor as unknown as typeof Worker;

describe('CrdtWorkerClient', () => {
  let client: CrdtWorkerClient;
  let messageHandler: (event: MessageEvent) => void;

  const initializeClient = async () => {
    await client.initialize();
  };

  beforeEach(() => {
    jest.clearAllMocks();
    client = new CrdtWorkerClient();

    mockWorker.addEventListener.mockImplementation((event, handler) => {
      if (event === 'message') {
        messageHandler = handler;
      }
    });
  });

  afterEach(() => {
    client.terminate();
  });

  describe('initialize', () => {
    it('should create a worker on first initialization', async () => {
      await client.initialize();

      expect(mockWorkerConstructor).toHaveBeenCalledWith('/workers/crdt-worker.js');
      expect(mockWorker.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockWorker.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should reuse existing initialization promise', async () => {
      void client.initialize();
      void client.initialize();

      expect(mockWorkerConstructor).toHaveBeenCalledTimes(1);
    });
  });

  describe('queueOperation', () => {
    it('should queue an operation and return priority info', async () => {
      await initializeClient();

      const operation: CrdtOperation = {
        type: 'upsert_tab',
        id: '123',
        data: {
          window_id: '456',
          url: 'https://example.com',
          title: 'Example',
          active: true,
          index: 0,
          updated_at: 123456789n,
        },
      };

      const responsePromise = client.queueOperation(operation);

      expect(mockWorker.postMessage).toHaveBeenCalledWith({
        id: expect.stringMatching(/^req-\d+$/),
        type: 'queue',
        payload: operation,
      });

      const requestId = (mockWorker.postMessage.mock.calls[0][0] as { id: string }).id;
      messageHandler({
        data: {
          id: requestId,
          success: true,
          data: { priority: 1, dedupKey: 'upsert_tab:123' },
        },
      } as MessageEvent);

      const result = await responsePromise;
      expect(result).toEqual({ priority: 1, dedupKey: 'upsert_tab:123' });
    });

    it('should handle worker errors', async () => {
      await initializeClient();

      const operation: CrdtOperation = {
        type: 'close_tab',
        id: '123',
        closed_at: 123456789n,
      };

      const responsePromise = client.queueOperation(operation);

      const requestId = (mockWorker.postMessage.mock.calls[0][0] as { id: string }).id;
      messageHandler({
        data: {
          id: requestId,
          success: false,
          error: 'Worker error',
        },
      } as MessageEvent);

      await expect(responsePromise).rejects.toThrow('Worker error');
    });
  });

  describe('deduplicateOperations', () => {
    it('should return deduplicated operations', async () => {
      await initializeClient();

      const responsePromise = client.deduplicateOperations();

      expect(mockWorker.postMessage).toHaveBeenCalledWith({
        id: expect.stringMatching(/^req-\d+$/),
        type: 'deduplicate',
      });

      const requestId = (mockWorker.postMessage.mock.calls[0][0] as { id: string }).id;
      const operations: CrdtOperation[] = [
        {
          type: 'set_active',
          id: '123',
          active: true,
          updated_at: 123456789n,
        },
      ];

      messageHandler({
        data: {
          id: requestId,
          success: true,
          data: operations,
        },
      } as MessageEvent);

      const result = await responsePromise;
      expect(result).toEqual(operations);
    });
  });

  describe('getState', () => {
    it('should return worker state', async () => {
      await initializeClient();

      const responsePromise = client.getState();

      expect(mockWorker.postMessage).toHaveBeenCalledWith({
        id: expect.stringMatching(/^req-\d+$/),
        type: 'getState',
      });

      const requestId = (mockWorker.postMessage.mock.calls[0][0] as { id: string }).id;
      messageHandler({
        data: {
          id: requestId,
          success: true,
          data: {
            queueLength: 5,
            lamportClock: '123',
            deviceId: 'device-123',
          },
        },
      } as MessageEvent);

      const result = await responsePromise;
      expect(result).toEqual({
        queueLength: 5,
        lamportClock: '123',
        deviceId: 'device-123',
      });
    });
  });

  describe('updateState', () => {
    it('should update worker state', async () => {
      await initializeClient();

      const responsePromise = client.updateState('new-device-id', '456');

      expect(mockWorker.postMessage).toHaveBeenCalledWith({
        id: expect.stringMatching(/^req-\d+$/),
        type: 'apply',
        payload: { deviceId: 'new-device-id', clock: '456' },
      });

      const requestId = (mockWorker.postMessage.mock.calls[0][0] as { id: string }).id;
      messageHandler({
        data: {
          id: requestId,
          success: true,
        },
      } as MessageEvent);

      await expect(responsePromise).resolves.toBeUndefined();
    });
  });

  describe('timeout handling', () => {
    it('should timeout after 5 seconds', async () => {
      jest.useFakeTimers();
      await initializeClient();

      const operation: CrdtOperation = {
        type: 'move_tab',
        id: '123',
        window_id: '456',
        index: 2,
        updated_at: 123456789n,
      };

      const responsePromise = client.queueOperation(operation);

      jest.advanceTimersByTime(5001);

      await expect(responsePromise).rejects.toThrow('Worker request timeout');

      jest.useRealTimers();
    });
  });

  describe('terminate', () => {
    it('should terminate the worker and clear state', async () => {
      await initializeClient();

      client.terminate();

      expect(mockWorker.terminate).toHaveBeenCalled();

      await client.initialize();
      expect(mockWorkerConstructor).toHaveBeenCalledTimes(2);
    });
  });
});
*/
