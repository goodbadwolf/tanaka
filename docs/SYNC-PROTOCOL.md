# Tanaka Sync Protocol

**Purpose**: Technical specification for CRDT-based structured synchronization protocol  
**Audience**: Developers implementing sync functionality  
**Prerequisites**: Understanding of CRDTs and conflict-free operations

## Overview

The Tanaka sync protocol uses a CRDT-based structured protocol for conflict-free synchronization across devices. Operations are expressed as high-level, human-readable JSON commands that maintain CRDT guarantees.

## Key Features

- **Data Format**: JSON with CRDT operations for clear, structured commands
- **Conflict Resolution**: Automatic CRDT merge ensures consistency
- **Network Efficiency**: Incremental operations reduce bandwidth usage
- **Ordering**: Lamport clock provides total ordering across devices
- **Storage**: Structured `operations + clock` schema for full history

## Protocol Specification

### Message Format

All messages use structured JSON with CRDT operations:

```json
{
  "clock": 12345,
  "device_id": "device-uuid-123",
  "operations": [
    {
      "type": "upsert_tab",
      "id": "tab1",
      "data": {
        "window_id": "window1",
        "url": "https://example.com",
        "title": "Example Site",
        "active": true,
        "index": 0
      }
    },
    {
      "type": "close_tab",
      "id": "tab2"
    }
  ]
}
```

### Operation Types

#### Tab Operations
- `upsert_tab` - Create or update a tab
- `close_tab` - Remove a tab
- `set_active` - Mark a tab as active/inactive
- `move_tab` - Change tab index within window
- `change_url` - Update tab URL (navigation)

#### Window Operations  
- `track_window` - Start tracking a window
- `untrack_window` - Stop tracking a window
- `set_window_focus` - Mark window as focused

### CRDT Operation Semantics

Each operation type has conflict-free merge semantics:

```typescript
interface TabOperation {
  type: 'upsert_tab';
  id: string;
  data: {
    window_id: string;
    url: string;
    title: string;
    active: boolean;
    index: number;
    updated_at: number;  // Lamport clock timestamp
  };
}

interface CloseTabOperation {
  type: 'close_tab';
  id: string;
  closed_at: number;   // Lamport clock timestamp
}
```

### Sync Flow

```
Client                                    Server
  │                                         │
  ├─── SyncRequest(operations) ────────────▶│
  │                                         ├─ Apply operations to CRDT state
  │                                         ├─ Update Lamport clock
  │                                         ├─ Persist operations
  │                                         ├─ Generate response operations
  │                                         │
  │◀──── SyncResponse(operations) ──────────┤
  ├─ Apply received operations              │
  ├─ Update local state                     │
  ├─ Update UI                              │
```

### HTTP Endpoints

#### POST /sync

**Request:**

```json
{
  "clock": 12345,
  "device_id": "device-uuid-123",
  "since_clock": 12300,
  "operations": [
    {
      "type": "upsert_tab",
      "id": "tab1",
      "data": {
        "window_id": "window1",
        "url": "https://example.com",
        "title": "Example",
        "active": true,
        "index": 0
      }
    }
  ]
}
```

**Response:**

```json
{
  "clock": 12346,
  "operations": [
    {
      "type": "upsert_tab",
      "id": "tab3",
      "data": {
        "window_id": "window2",
        "url": "https://other.com",
        "title": "Other Site",
        "active": false,
        "index": 0
      }
    }
  ]
}
```

### Error Handling

Errors are returned as JSON:

```json
{
  "error": {
    "code": "SYNC_CONFLICT",
    "message": "CRDT merge conflict detected",
    "lamport_clock": 12345
  }
}
```

### Lamport Clock Implementation

Each operation is assigned a monotonic Lamport clock value:

```rust
struct LamportClock {
    value: AtomicU64,
    node_id: u32,
}

impl LamportClock {
    fn tick(&self) -> u64 {
        self.value.fetch_add(1, Ordering::SeqCst)
    }

    fn update(&self, received_clock: u64) {
        let current = self.value.load(Ordering::SeqCst);
        let new_value = received_clock.max(current) + 1;
        self.value.store(new_value, Ordering::SeqCst);
    }
}
```

### Storage Schema

```sql
CREATE TABLE crdt_operations (
    id TEXT PRIMARY KEY,           -- Operation ID (UUID)
    clock INTEGER NOT NULL,        -- Lamport clock value
    device_id TEXT NOT NULL,       -- Originating device
    operation_type TEXT NOT NULL,  -- Operation type (upsert_tab, close_tab, etc)
    target_id TEXT NOT NULL,       -- Target entity ID (tab ID, window ID)
    operation_data TEXT,           -- JSON operation payload
    created_at INTEGER NOT NULL    -- Unix timestamp
);

CREATE INDEX idx_crdt_clock ON crdt_operations(clock);
CREATE INDEX idx_crdt_device ON crdt_operations(device_id);
CREATE INDEX idx_crdt_target ON crdt_operations(target_id);

-- Materialized view of current state (for performance)
CREATE TABLE crdt_state (
    entity_type TEXT NOT NULL,     -- 'tab' or 'window'
    entity_id TEXT NOT NULL,       -- Tab/Window ID
    current_data TEXT NOT NULL,    -- JSON current state
    last_clock INTEGER NOT NULL,   -- Last operation clock
    updated_at INTEGER NOT NULL,   -- Last update timestamp
    PRIMARY KEY (entity_type, entity_id)
);
```

### Backward Compatibility

The server uses a single CRDT-based sync endpoint:

- `/sync` - Structured CRDT API with JSON operations

The endpoint uses `application/json` content type with structured operations.

### Performance Optimizations

1. **DashMap Caching**: Hot operation state cached in memory
2. **Operation Batching**: Multiple operations in single request
3. **Incremental Sync**: Only operations since last known clock
4. **Materialized State**: Current state cached for fast reads

### Security Considerations

1. **Authentication**: Bearer token in Authorization header
2. **Rate Limiting**: Per-device limits on update frequency
3. **Payload Limits**: Maximum binary update size
4. **Validation**: CRDT update integrity verification


## Migration Strategy

The migration to CRDT-based sync is complete. All clients use the structured operation protocol.

## Testing Strategy

1. **Operation Tests**: Individual CRDT operation semantics
2. **Conflict Tests**: Concurrent operations (same tab updates)
3. **Ordering Tests**: Lamport clock correctness
4. **Integration Tests**: Full sync flows across devices
5. **Performance Tests**: 200+ tabs with operation batching
6. **Integration Tests**: Full sync scenarios

## Monitoring

Key metrics to track:

- `sync_requests_total`
- `crdt_operations_applied_total{type="upsert_tab|close_tab|..."}`
- `crdt_conflicts_resolved_total`
- `operation_batch_size_histogram`
- `lamport_clock_drift_seconds`
- `sync_latency_seconds{percentile="p95"}`
