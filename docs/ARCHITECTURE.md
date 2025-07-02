# Tanaka Architecture

**Purpose**: Technical deep dive into Tanaka's system design and data flow  
**Audience**: Developers needing to understand internals  
**Prerequisites**: Basic understanding of CRDTs and browser extensions

## Navigation
- [🏠 Home](../README.md)
- [🚀 Getting Started](GETTING-STARTED.md)
- [💻 Development](DEVELOPMENT.md)
- [🏗️ Architecture](ARCHITECTURE.md)
- [🔧 Troubleshooting](TROUBLESHOOTING.md)
- [📝 Git Guidelines](GIT.md)

---

## System Overview

```
┌──────────────┐  JSON Operations via HTTPS  ┌──────────────┐
│  Extension   │ ─────────────────────────▶  │   Server     │
│ (TypeScript) │ ◀───────────────────────── │  (Rust)      │
└──────────────┘    Adaptive 1-10s sync     └─────┬────────┘
                                                   │  SQLite WAL
                                                   ▼
                                             operations.db
```

## Browser-side Workflow

1. **Capture** – The extension hooks `tabs.*` and `windows.*` events as they happen.
2. **Encode** – Each change is converted to structured CRDT operations (`upsert_tab`, `close_tab`, etc.).
3. **Sync** – The extension uses adaptive sync intervals (1s during activity, 10s when idle) to POST queued operations and request newer ones from the server.

## Server Workflow

1. **Merge** – Axum route `/sync` receives structured operations, applies them to CRDT state, and assigns a monotonic Lamport clock.
2. **Persist** – Operations are cached in a `DashMap` for fast read-back and written to `SQLite` in WAL mode for durability.
3. **Respond** – The server streams back any operations with a clock greater than the client's `since` parameter.

## Data Guarantees

- **Eventual Consistency** – Structured CRDT operations ensure replicas converge regardless of network order.
- **Crash Safety** – WAL mode plus adaptive sync intervals mean at most 10 seconds of operations are in memory during idle periods.
- **Security** – All traffic is TLS-encrypted (`rustls`) and protected by a shared bearer token.

## CRDT Synchronization Protocol

Tanaka uses a structured JSON-based CRDT protocol for conflict-free synchronization:

- **Structured Operations**: JSON-based operations (`upsert_tab`, `close_tab`, etc.)
- **Conflict Resolution**: Automatic CRDT merge semantics for consistency
- **Lamport Clock**: Monotonic clock for total ordering of operations
- **Protocol Version**: v2 is the only protocol (v1 has been removed)

### Sync Flow

1. Client captures tab/window events as CRDT operations
2. Client queues operations with device ID and clock
3. Client POSTs operations to `/sync` endpoint
4. Server applies operations to CRDT state
5. Server assigns Lamport clock to each operation
6. Server persists to SQLite and DashMap cache
7. Server returns operations newer than client's clock
8. Client applies received operations to local state

## Security Architecture

### Authentication
- Shared bearer token in Authorization header
- Token configured in both extension and server
- No user accounts or sessions (personal use)

### Transport Security
- HTTPS/TLS required for all communication
- Certificate validation on client side
- Optional self-signed certs for development

### Data Protection
- No plaintext storage of sensitive data
- SQLite database with restricted permissions
- Extension storage API for client-side data

## Performance Considerations

### Targets
- Support 200+ tabs across devices
- P95 sync latency ≤ 10ms
- Smooth UI with no blocking operations

### Optimizations
- DashMap for in-memory caching
- SQLite WAL mode for concurrent reads
- Statement caching for prepared queries
- Adaptive sync intervals (1s active, 10s idle)
- Web Workers for non-blocking CRDT operations
- Operation batching and deduplication

## Storage Architecture

### Client Storage
- `browser.storage.local` for tab state and sync metadata
- Operation queue for pending CRDT operations
- Device ID and Lamport clock persistence
- Settings in storage.sync

### Server Storage
- SQLite database (operations.db) with WAL mode
- CRDT operations table with Lamport clock indexing
- Materialized state table for current tab/window data
- DashMap cache for hot operations
- Statement cache for prepared queries

## Extension Architecture

### Background Service
- Persistent background script
- Manages all tab/window events
- Handles sync operations
- Message broker for UI components

### UI Components
- Popup: Window tracking controls
- Settings: Server configuration
- Future: Tab search and management

### Message Passing
- Background ↔ Popup communication
- Background ↔ Settings communication
- Structured message types with TypeScript

### Web Worker Implementation

Tanaka uses Web Workers to offload heavy CRDT operations from the main thread:

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

**Key Benefits:**
- Non-blocking UI during sync operations
- Parallel processing of CRDT operations
- Efficient handling of 200+ tabs
- Reduced memory pressure on main thread

**Components:**
- `CrdtWorker`: Handles operation queuing and deduplication
- `CrdtWorkerClient`: Main thread interface with timeout protection
- `SyncManagerWithWorker`: Drop-in replacement for SyncManager

## Future Architecture Plans

### v1.0 Enhancements
- Repository pattern for data access
- Service layer with dependency injection
- Enhanced CRDT protocol with compression
- Observability with metrics and tracing

### v2.0 Vision
- P2P sync option
- Cross-browser support
- Collaborative tab sharing
- Advanced conflict resolution UI

## Related Documentation

- [Development Setup](DEVELOPMENT.md) - Get started with the codebase
- [Troubleshooting](TROUBLESHOOTING.md) - Debug common issues
- [Roadmap](ROADMAP.md) - Detailed implementation plans
