# Tanaka – Development Guide

This guide explains how Tanaka is wired together, how to get a local dev setup running, and where to tweak configuration. It consolidates the architecture, configuration, and build instructions in one place.

---

## 1. Architecture

```
┌──────────────┐   Yjs Δ via HTTPS   ┌──────────────┐
│  Extension   │ ─────────────────▶  │   Server     │
│ (TypeScript) │ ◀────────────────── │  (Rust)      │
└──────────────┘      5 s poll       └─────┬────────┘
                                           │  SQLite WAL
                                           ▼
                                      tabs.db
```

### 1.1 Browser-side workflow

1. **Capture** – The extension hooks `tabs.*` and `windows.*` events as they happen.
2. **Encode** – Each change is appended to a local Yjs document and flushed as a binary update (`Uint8Array`).
3. **Sync** – Every 5 seconds (adjusting to 1 s during activity) the extension POSTs its queued updates and immediately requests any newer ones from the server.

### 1.2 Server workflow

1. **Merge** – Axum route `/sync` receives the binary update, feeds it to `yrs::Doc`, and assigns a monotonic Lamport clock.
2. **Persist** – The merged document is cached in a `DashMap` for fast read-back and written to `SQLite` in WAL mode for durability.
3. **Respond** – The server streams back any updates with a clock greater than the client’s `since` parameter.

### 1.3 Data guarantees

- **Eventual Consistency** – Yjs/yrs ensures replicas converge regardless of network order.
- **Crash Safety** – WAL mode plus 5 s flush means at most 5 seconds of edits are in memory at any moment.
- **Security** – All traffic is TLS-encrypted (`rustls`) and protected by a shared bearer token.

---

## 2. Prerequisites

| Tool    | Version      |
| ------- | ------------ |
| Rust    | stable 1.78+ |
| Node    | 20+          |
| pnpm    | 9+           |
| SQLite  | 3.40+        |
| Firefox | 126+         |

Install Rust via `rustup`, then:

```bash
cargo install sqlx-cli --no-default-features --features sqlite
corepack enable  # enables pnpm
```

---

## 3. First-time setup

```bash
# Clone
git clone https://github.com/goodbadwolf/tanaka.git

# Server deps
cd tanaka/server && cargo test && cargo build

# Extension deps
cd ../extension && pnpm install && pnpm run build
# For live testing:
web-ext run --firefox=nightly
```

---

## 4. Configuration

See [docs/INSTALL.md](@docs/INSTALL.md#configuration) for detailed configuration instructions.

The server automatically applies SQLite safety settings at startup:

```
PRAGMA journal_mode=WAL;
PRAGMA busy_timeout=3000;
```

### Local Development (TLS Alternatives)

When developing locally, you may not need production certificates. You can:

- **Run HTTP-only**: omit the `[tls]` section and update `bind_addr` (e.g. `127.0.0.1:8000`) for plain HTTP.
- **Use self-signed certificates**: generate a cert and key with:

  ```bash
  openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"
  ```

  Then update your config:

  ```toml
  [tls]
  cert_path = "path/to/cert.pem"
  key_path  = "path/to/key.pem"
  ```

---

## 5. Running tests & lint

```bash
# Rust
cargo fmt --all && cargo clippy --all-targets -- -D warnings
cargo test

# TypeScript
pnpm run lint
```

### Testing Strategy

- **Rust Server**: Unit tests for core logic, integration tests for API endpoints
- **Extension**: Linting only (manual testing in Firefox required)
- **End-to-End**: Manual testing with multiple Firefox instances

---

## 6. Releasing

1. Bump versions in `manifest.json` and `Cargo.toml`.
2. `git tag -s vX.Y.Z -m "vX.Y.Z" && git push origin --tags`.
3. GitHub Actions builds the server, signs the extension, and attaches `tanaka.xpi` plus the server binary to the release.
4. Firefox auto-updates the extension via the built-in `update_url`.

---

## 7. Helpful commands

| Task                    | Command                                                                          |
| ----------------------- | -------------------------------------------------------------------------------- |
| Rebuild + run server    | `cargo watch -x run`                                                             |
| Sign extension manually | `web-ext sign --channel=unlisted --api-key=$AMO_ISSUER --api-secret=$AMO_SECRET` |
| Backup SQLite file      | `sqlite3 tabs.db ".backup 'tabs-$(date +%s).db'"`                                |

---

## 8. Essential Commands

```bash
# Server Development (Rust)
# Run tests
cargo test

# Build the server
cargo build

# Run with release optimizations
cargo run --release

# Format code
cargo fmt

# Run linter
cargo clippy
```

```bash
# Extension Development (TypeScript)
# Install dependencies
pnpm install

# Build extension
pnpm run build

# Run linter
pnpm run lint

# Development mode with hot reload
pnpm run dev

# Run Firefox with extension loaded
pnpm run firefox
```

---

## 9. Running the Complete System

1. Start the server: `cd server && cargo run`
2. Load extension in Firefox: `cd extension && pnpm run firefox`
3. Configure extension to point to server (default: https://localhost:443)
   - See “Local Development (TLS Alternatives)” above for HTTPS setups.

---

## 10. Security Considerations

- All communication uses TLS
- Authentication via shared bearer token
- No plaintext data transmission
- Server validates all incoming Yjs updates
