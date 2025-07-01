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
┌──────────────┐   Yjs Δ via HTTPS   ┌──────────────┐
│  Extension   │ ─────────────────▶  │   Server     │
│ (TypeScript) │ ◀────────────────── │  (Rust)      │
└──────────────┘      5 s poll       └─────┬────────┘
                                           │  SQLite WAL
                                           ▼
                                      tabs.db
```

## Browser-side Workflow

1. **Capture** – The extension hooks `tabs.*` and `windows.*` events as they happen.
2. **Encode** – Each change is appended to a local Yjs document and flushed as a binary update (`Uint8Array`).
3. **Sync** – Every 5 seconds (adjusting to 1 s during activity) the extension POSTs its queued updates and immediately requests any newer ones from the server.

## Server Workflow

1. **Merge** – Axum route `/sync` receives the binary update, feeds it to `yrs::Doc`, and assigns a monotonic Lamport clock.
2. **Persist** – The merged document is cached in a `DashMap` for fast read-back and written to `SQLite` in WAL mode for durability.
3. **Respond** – The server streams back any updates with a clock greater than the client's `since` parameter.

## Data Guarantees

- **Eventual Consistency** – Yjs/yrs ensures replicas converge regardless of network order.
- **Crash Safety** – WAL mode plus 5 s flush means at most 5 seconds of edits are in memory at any moment.
- **Security** – All traffic is TLS-encrypted (`rustls`) and protected by a shared bearer token.

## CRDT Synchronization Protocol

Tanaka uses Yjs/yrs for conflict-free synchronization:

- **Yjs (client)**: JavaScript CRDT implementation in the extension
- **yrs (server)**: Rust CRDT implementation compatible with Yjs
- **Binary protocol**: Efficient binary encoding for updates
- **Lamport clock**: Monotonic clock for ordering updates

### Sync Flow

1. Client accumulates local changes in Yjs document
2. Client encodes changes as binary update
3. Client POSTs update to `/sync` endpoint
4. Server merges update into its yrs document
5. Server assigns Lamport clock to update
6. Server persists to SQLite and cache
7. Server returns newer updates to client
8. Client merges received updates

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
- Debounced sync operations
- Binary protocol for minimal payload size
- Future: Web Workers for CRDT operations

## Storage Architecture

### Client Storage
- `browser.storage.local` for tab state
- Yjs document for CRDT state
- Settings in storage.sync

### Server Storage
- SQLite database with WAL mode
- Schema designed for CRDT storage
- DashMap cache for hot data
- Future: Support for other backends

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
