/**
 * Tests for CRDT Worker implementation
 */
/*
import type { CrdtOperation } from '../../api/sync';

// Mock the global self object for Web Worker environment
const mockPostMessage = jest.fn();
let messageListeners: ((event: MessageEvent) => void)[] = [];

// Type definition for the Worker global scope mock
interface WorkerGlobalScopeMock {
  addEventListener: jest.Mock;
  postMessage: jest.Mock;
}

global.self = {
  addEventListener: jest.fn((event: string, handler: (event: MessageEvent) => void) => {
    if (event === 'message') {
      messageListeners.push(handler);
    }
  }),
  postMessage: mockPostMessage,
} as unknown as WorkerGlobalScopeMock & typeof globalThis;

describe('CrdtWorker Implementation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPostMessage.mockClear();
    messageListeners = [];

    // Clear the module cache to get a fresh worker instance
    jest.resetModules();

    // Re-setup the mock before re-importing
    global.self = {
      addEventListener: jest.fn((event: string, handler: (event: MessageEvent) => void) => {
        if (event === 'message') {
          messageListeners.push(handler);
        }
      }),
      postMessage: mockPostMessage,
    } as unknown as WorkerGlobalScopeMock & typeof globalThis;

    // Import the worker module fresh for each test
    void import('../../workers/crdt-worker');
  });

  const sendMessage = (message: unknown) => {
    const event = new MessageEvent('message', { data: message });
    messageListeners.forEach((listener) => listener(event));
  };

  describe('queueOperation', () => {
    it('should queue operations with correct priority', () => {
      const operation: CrdtOperation = {
        type: 'close_tab',
        id: '123',
        closed_at: 123456789n,
      };

      sendMessage({
        id: 'test-1',
        type: 'queue',
        payload: operation,
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        id: 'test-1',
        success: true,
        data: {
          priority: 0, // CRITICAL
          dedupKey: 'close_tab:123',
        },
      });
    });

    it('should assign correct priorities to all operation types', () => {
      const testCases = [
        { op: { type: 'close_tab', id: '1', closed_at: 1n } as CrdtOperation, expectedPriority: 0 },
        {
          op: { type: 'track_window', id: '2', tracked: true, updated_at: 1n } as CrdtOperation,
          expectedPriority: 0,
        },
        {
          op: { type: 'untrack_window', id: '3', updated_at: 1n } as CrdtOperation,
          expectedPriority: 0,
        },
        {
          op: {
            type: 'upsert_tab',
            id: '4',
            data: {
              window_id: '1',
              url: 'test',
              title: 'test',
              active: true,
              index: 0,
              updated_at: 1n,
            },
          } as CrdtOperation,
          expectedPriority: 1,
        },
        {
          op: {
            type: 'move_tab',
            id: '5',
            window_id: '1',
            index: 0,
            updated_at: 1n,
          } as CrdtOperation,
          expectedPriority: 1,
        },
        {
          op: { type: 'set_active', id: '6', active: true, updated_at: 1n } as CrdtOperation,
          expectedPriority: 2,
        },
        {
          op: { type: 'set_window_focus', id: '7', focused: true, updated_at: 1n } as CrdtOperation,
          expectedPriority: 2,
        },
        {
          op: {
            type: 'change_url',
            id: '8',
            url: 'new',
            title: 'new',
            updated_at: 1n,
          } as CrdtOperation,
          expectedPriority: 3,
        },
      ];

      testCases.forEach((testCase, index) => {
        sendMessage({
          id: `priority-test-${index}`,
          type: 'queue',
          payload: testCase.op,
        });

        expect(mockPostMessage).toHaveBeenLastCalledWith({
          id: `priority-test-${index}`,
          success: true,
          data: {
            priority: testCase.expectedPriority,
            dedupKey: expect.any(String),
          },
        });
      });
    });

    it('should generate correct dedup keys', () => {
      const testCases = [
        {
          op: { type: 'close_tab', id: '123', closed_at: 1n } as CrdtOperation,
          expectedKey: 'close_tab:123',
        },
        {
          op: { type: 'set_active', id: '456', active: true, updated_at: 1n } as CrdtOperation,
          expectedKey: 'set_active:456',
        },
        {
          op: { type: 'track_window', id: '789', tracked: true, updated_at: 1n } as CrdtOperation,
          expectedKey: 'window:789',
        },
        {
          op: {
            type: 'set_window_focus',
            id: '999',
            focused: true,
            updated_at: 1n,
          } as CrdtOperation,
          expectedKey: 'window:999',
        },
      ];

      testCases.forEach((testCase, index) => {
        sendMessage({
          id: `dedup-test-${index}`,
          type: 'queue',
          payload: testCase.op,
        });

        expect(mockPostMessage).toHaveBeenLastCalledWith({
          id: `dedup-test-${index}`,
          success: true,
          data: {
            priority: expect.any(Number),
            dedupKey: testCase.expectedKey,
          },
        });
      });
    });

    it('should increment lamport clock on each operation', () => {
      const operation: CrdtOperation = {
        type: 'set_active',
        id: '123',
        active: true,
        updated_at: 123456789n,
      };

      // Queue multiple operations
      for (let i = 0; i < 3; i++) {
        sendMessage({
          id: `clock-test-${i}`,
          type: 'queue',
          payload: operation,
        });
      }

      // Get state to check clock
      sendMessage({
        id: 'get-state-1',
        type: 'getState',
      });

      expect(mockPostMessage).toHaveBeenLastCalledWith({
        id: 'get-state-1',
        success: true,
        data: {
          queueLength: 3,
          lamportClock: '3', // Should have incremented 3 times
          deviceId: expect.stringMatching(/^worker-\d+-[a-z0-9]+$/),
        },
      });
    });
  });

  describe('deduplicateOperations', () => {
    it('should deduplicate operations with same dedup key', () => {
      // Queue multiple operations with same ID
      const operations = [
        { type: 'set_active', id: '123', active: true, updated_at: 100n },
        { type: 'set_active', id: '123', active: false, updated_at: 200n }, // Same ID, different value, later timestamp
        { type: 'set_active', id: '456', active: true, updated_at: 150n }, // Different ID
      ];

      operations.forEach((op, index) => {
        sendMessage({
          id: `queue-${index}`,
          type: 'queue',
          payload: op as CrdtOperation,
        });
      });

      // Deduplicate
      sendMessage({
        id: 'dedup-1',
        type: 'deduplicate',
      });

      const lastCall = mockPostMessage.mock.calls[mockPostMessage.mock.calls.length - 1][0];
      expect(lastCall).toEqual({
        id: 'dedup-1',
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ type: 'set_active', id: '123' }),
          expect.objectContaining({ type: 'set_active', id: '456' }),
        ]),
      });

      // Should have 2 operations after deduplication
      expect(lastCall.data).toHaveLength(2);
    });

    it('should sort operations by priority then timestamp', () => {
      // Queue operations with different priorities
      const operations = [
        { type: 'change_url', id: '1', url: 'low', title: 'low', updated_at: 100n }, // LOW priority
        { type: 'close_tab', id: '2', closed_at: 200n }, // CRITICAL priority
        {
          type: 'upsert_tab',
          id: '3',
          data: {
            window_id: '1',
            url: 'high',
            title: 'high',
            active: true,
            index: 0,
            updated_at: 150n,
          },
        }, // HIGH priority
        { type: 'set_active', id: '4', active: true, updated_at: 175n }, // NORMAL priority
      ];

      operations.forEach((op, index) => {
        sendMessage({
          id: `queue-${index}`,
          type: 'queue',
          payload: op as CrdtOperation,
        });
      });

      // Deduplicate
      sendMessage({
        id: 'dedup-sort',
        type: 'deduplicate',
      });

      const lastCall = mockPostMessage.mock.calls[mockPostMessage.mock.calls.length - 1][0];
      const dedupedOps = lastCall.data as CrdtOperation[];

      // Check order: CRITICAL (0) -> HIGH (1) -> NORMAL (2) -> LOW (3)
      expect(dedupedOps[0].type).toBe('close_tab'); // CRITICAL
      expect(dedupedOps[1].type).toBe('upsert_tab'); // HIGH
      expect(dedupedOps[2].type).toBe('set_active'); // NORMAL
      expect(dedupedOps[3].type).toBe('change_url'); // LOW
    });

    it('should clear queue after deduplication', () => {
      // Queue an operation
      sendMessage({
        id: 'queue-1',
        type: 'queue',
        payload: { type: 'set_active', id: '123', active: true, updated_at: 100n } as CrdtOperation,
      });

      // Check queue has 1 item
      sendMessage({
        id: 'state-1',
        type: 'getState',
      });

      expect(mockPostMessage).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ queueLength: 1 }),
        }),
      );

      // Deduplicate
      sendMessage({
        id: 'dedup-1',
        type: 'deduplicate',
      });

      // Check queue is empty
      sendMessage({
        id: 'state-2',
        type: 'getState',
      });

      expect(mockPostMessage).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ queueLength: 0 }),
        }),
      );
    });
  });

  describe('getState', () => {
    it('should return current state', () => {
      sendMessage({
        id: 'state-1',
        type: 'getState',
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        id: 'state-1',
        success: true,
        data: {
          queueLength: 0,
          lamportClock: '0',
          deviceId: expect.stringMatching(/^worker-\d+-[a-z0-9]+$/),
        },
      });
    });

    it('should reflect queue length changes', () => {
      // Add operations
      for (let i = 0; i < 5; i++) {
        sendMessage({
          id: `queue-${i}`,
          type: 'queue',
          payload: {
            type: 'set_active',
            id: `${i}`,
            active: true,
            updated_at: 100n,
          } as CrdtOperation,
        });
      }

      sendMessage({
        id: 'state-after-queue',
        type: 'getState',
      });

      expect(mockPostMessage).toHaveBeenLastCalledWith({
        id: 'state-after-queue',
        success: true,
        data: expect.objectContaining({
          queueLength: 5,
          lamportClock: '5',
        }),
      });
    });
  });

  describe('apply message (update state)', () => {
    it('should update device ID', () => {
      sendMessage({
        id: 'apply-1',
        type: 'apply',
        payload: { deviceId: 'custom-device-id' },
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        id: 'apply-1',
        success: true,
      });

      // Verify device ID was updated
      sendMessage({
        id: 'state-1',
        type: 'getState',
      });

      expect(mockPostMessage).toHaveBeenLastCalledWith({
        id: 'state-1',
        success: true,
        data: expect.objectContaining({
          deviceId: 'custom-device-id',
        }),
      });
    });

    it('should update lamport clock', () => {
      sendMessage({
        id: 'apply-clock',
        type: 'apply',
        payload: { clock: '12345' },
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        id: 'apply-clock',
        success: true,
      });

      // Verify clock was updated
      sendMessage({
        id: 'state-clock',
        type: 'getState',
      });

      expect(mockPostMessage).toHaveBeenLastCalledWith({
        id: 'state-clock',
        success: true,
        data: expect.objectContaining({
          lamportClock: '12345',
        }),
      });
    });

    it('should update both device ID and clock', () => {
      sendMessage({
        id: 'apply-both',
        type: 'apply',
        payload: { deviceId: 'new-device', clock: '999' },
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        id: 'apply-both',
        success: true,
      });

      // Verify both were updated
      sendMessage({
        id: 'state-both',
        type: 'getState',
      });

      expect(mockPostMessage).toHaveBeenLastCalledWith({
        id: 'state-both',
        success: true,
        data: expect.objectContaining({
          deviceId: 'new-device',
          lamportClock: '999',
        }),
      });
    });
  });

  describe('error handling', () => {
    it('should handle unknown message types', () => {
      sendMessage({
        id: 'unknown-1',
        type: 'unknown-type',
        payload: {},
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        id: 'unknown-1',
        success: false,
        error: 'Unknown message type: unknown-type',
      });
    });

    it('should handle errors in message processing', () => {
      // Send a message with invalid payload that will cause an error
      sendMessage({
        id: 'error-1',
        type: 'queue',
        payload: null, // This will cause an error when trying to access properties
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        id: 'error-1',
        success: false,
        error: expect.any(String),
      });
    });

    it('should handle invalid clock values', () => {
      sendMessage({
        id: 'invalid-clock',
        type: 'apply',
        payload: { clock: 'not-a-number' },
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        id: 'invalid-clock',
        success: false,
        error: expect.stringContaining('Cannot convert'),
      });
    });
  });

  describe('complex scenarios', () => {
    it('should handle multiple operations with deduplication correctly', () => {
      // Simulate real-world scenario with multiple tab operations
      const operations = [
        {
          type: 'upsert_tab',
          id: 'tab1',
          data: {
            window_id: 'win1',
            url: 'https://example.com',
            title: 'Example',
            active: true,
            index: 0,
            updated_at: 100n,
          },
        },
        { type: 'set_active', id: 'tab1', active: false, updated_at: 200n },
        {
          type: 'change_url',
          id: 'tab1',
          url: 'https://example.com/page',
          title: 'Page',
          updated_at: 300n,
        },
        { type: 'close_tab', id: 'tab2', closed_at: 500n },
      ];

      operations.forEach((op, index) => {
        sendMessage({
          id: `scenario-${index}`,
          type: 'queue',
          payload: op as CrdtOperation,
        });
      });

      // Add a small delay to ensure different timestamps, then queue another set_active
      jest.spyOn(Date, 'now').mockReturnValueOnce(Date.now() + 100);

      sendMessage({
        id: 'scenario-4',
        type: 'queue',
        payload: {
          type: 'set_active',
          id: 'tab1',
          active: true,
          updated_at: 400n,
        } as CrdtOperation,
      });

      // Get state before dedup
      sendMessage({
        id: 'state-before',
        type: 'getState',
      });

      expect(mockPostMessage).toHaveBeenLastCalledWith({
        id: 'state-before',
        success: true,
        data: expect.objectContaining({
          queueLength: 5,
          lamportClock: '5',
        }),
      });

      // Deduplicate
      sendMessage({
        id: 'dedup-scenario',
        type: 'deduplicate',
      });

      const dedupCall = mockPostMessage.mock.calls[mockPostMessage.mock.calls.length - 1][0];
      const dedupedOps = dedupCall.data as CrdtOperation[];

      // Should have 4 operations (set_active deduped)
      expect(dedupedOps).toHaveLength(4);

      // Verify order (by priority)
      expect(dedupedOps[0].type).toBe('close_tab'); // CRITICAL
      expect(dedupedOps[1].type).toBe('upsert_tab'); // HIGH
      expect(dedupedOps[2].type).toBe('set_active'); // NORMAL (latest one)
      expect(dedupedOps[3].type).toBe('change_url'); // LOW

      // Verify the latest set_active was kept (the one queued with later timestamp)
      const setActiveOp = dedupedOps.find((op) => op.type === 'set_active');
      expect(setActiveOp?.active).toBe(true); // The one with updated_at: 400n
    });
  });
});
*/
