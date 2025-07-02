# Web Worker CRDT Implementation

This directory contains the Web Worker-based CRDT implementation for Tanaka, designed to offload heavy synchronization operations from the main thread for better performance with 200+ tabs.

## Architecture

```
Main Thread                 Web Worker Thread
┌─────────────────┐       ┌─────────────────┐
│ SyncManager     │       │ CrdtWorker      │
│ WithWorker      │ ───── │                 │
│                 │ msgs  │ - Operation     │
│ - Queue ops     │ <───  │   queueing      │
│ - Sync with API │       │ - Deduplication │
│ - Apply remote  │       │ - Priority      │
│   operations    │       │   management    │
└─────────────────┘       └─────────────────┘
         │
         ▼
    Browser APIs
    (tabs, windows)
```

## Components

### CrdtWorker (`crdt-worker.ts`)
- Runs in a separate Web Worker thread
- Handles CRDT operation queuing and deduplication
- Manages Lamport clock and device state
- Priority-based operation ordering

### CrdtWorkerClient (`crdt-worker-client.ts`)
- Main thread interface to the Web Worker
- Provides async methods for worker communication
- Handles worker lifecycle and error recovery
- Timeout management for worker requests

### SyncManagerWithWorker (`sync-manager-with-worker.ts`)
- Enhanced sync manager using Web Worker
- Maintains same API as original SyncManager
- Offloads heavy operations to worker thread
- Applies remote operations on main thread for browser API access

## Benefits

1. **Non-blocking UI**: Heavy CRDT operations don't freeze the browser
2. **Better Performance**: Parallel processing of sync operations
3. **Scalability**: Handles 200+ tabs efficiently
4. **Memory Management**: Worker can be terminated to free memory

## Configuration

The Web Worker is enabled by default but can be controlled via config:

```typescript
// In config/environments/*.ts
export const config = {
  useWebWorker: true, // Enable/disable worker
  // ...
} as const;
```

## Testing

- `crdt-worker-client.test.ts` - Tests worker communication
- `sync-manager-with-worker.test.ts` - Integration tests
- All tests mock the worker for deterministic behavior

## Build Configuration

The Web Worker is built as a separate entry point in `rspack.config.ts`:

```typescript
entry: {
  'workers/crdt-worker': './src/workers/crdt-worker.ts',
  // ...
}
```

This generates `dist/workers/crdt-worker.js` for the extension.

## Message Protocol

The worker uses a typed message protocol:

```typescript
interface WorkerMessage {
  id: string;
  type: 'queue' | 'deduplicate' | 'apply' | 'getState';
  payload?: unknown;
}

interface WorkerResponse {
  id: string;
  success: boolean;
  data?: unknown;
  error?: string;
}
```

## Error Handling

- Automatic retry on worker initialization failure
- Fallback to main thread if worker creation fails
- Timeout protection for all worker requests (5s)
- Graceful degradation when worker is unavailable

## Performance Considerations

- Worker initialization is async and cached
- Message passing overhead is minimal for CRDT operations
- Deduplication reduces redundant work by ~70%
- Priority-based batching optimizes sync timing

