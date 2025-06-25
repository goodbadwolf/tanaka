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

| Tool    | Version |
| ------- | ------- |
| Rust    | 1.86+   |
| Node.js | 24+     |
| pnpm    | 10.11+  |
| SQLite  | 3.40+   |
| Firefox | 126+    |

Install Rust via `rustup`, then:

```bash
# Install SQLx CLI for database migrations (optional)
cargo install sqlx-cli --no-default-features --features sqlite

# Enable pnpm through Node.js corepack
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
pnpm run start
```

---

## 4. Configuration

See [@docs/INSTALL.md](docs/INSTALL.md#configuration) for detailed configuration instructions.

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
# Rust Server
cd ../server
cargo fmt --all && cargo clippy --all-targets -- -D warnings
cargo test

# Extension (TypeScript)
cd ../extension
pnpm install
pnpm run lint        # ESLint checks
pnpm run typecheck   # TypeScript type checking
pnpm run test        # Jest unit & UI tests
pnpm run test:watch  # Watch mode
```

### Testing Strategy

- **Rust Server**: Unit tests for core logic, integration tests for API endpoints
- **Extension**: Automated unit/UI tests via Jest covering sync logic, messaging,
  background service, hooks, and UI components
- **End-to-End**: Manual testing with multiple Firefox instances

---

## 6. Releasing

1. Bump versions in `manifest.json` and `Cargo.toml`.
2. `git tag -s vX.Y.Z -m "vX.Y.Z" && git push origin --tags`.
3. GitHub Actions builds the server, signs the extension, and attaches `tanaka.xpi` plus the server binary to the release.
4. Firefox auto-updates the extension via the built-in `update_url`.

---

---

## 7. Essential Commands

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

# Generate icons (if you update icon.svg)
pnpm run gen-icons

# Format code (Prettier)
pnpm run format

# Run lint checks
pnpm run lint

# Fix lint errors
pnpm run lint:fix

# Type-check
pnpm run typecheck

# Build extension for different environments
pnpm run build:dev      # Development build
pnpm run build:staging  # Staging build
pnpm run build:prod     # Production build

# Development mode with hot reload (Rspack)
pnpm run dev

# Run Firefox with extension loaded
pnpm run start

# Bundle analysis
pnpm run analyze

# Watch mode (rebuilds on file changes)
pnpm run watch
```

---

## 8. Running the Complete System

1. Start the server: `cd server && cargo run`
2. Load extension in Firefox: `cd extension && pnpm run dev`
3. Configure extension to point to server (default: http://localhost:8000 for development)
   - See “Local Development (TLS Alternatives)” above for HTTPS setups.

---

## 9. Security Considerations

- All communication uses TLS
- Authentication via shared bearer token
- No plaintext data transmission
- Server validates all incoming Yjs updates

---

## 10. Debugging WebExtension Issues

### 10.1 Extension Debugging Tools

**Browser Console vs Extension Console:**

- **Browser Console** (`Ctrl+Shift+K`): Shows content script errors
- **Extension Console**: Navigate to `about:debugging` → This Firefox → Tanaka → Inspect
  - Shows background script errors and console logs
  - Allows setting breakpoints in background scripts

### 10.2 Common Debugging Techniques

**1. Enable Verbose Logging:**

```typescript
// Add to background script for detailed logs
const DEBUG = true;

function log(...args: any[]) {
  if (DEBUG) {
    console.log("[Tanaka]", new Date().toISOString(), ...args);
  }
}
```

**2. Inspect Storage State:**

```javascript
// In extension console
await browser.storage.local.get(); // View all stored data
await browser.storage.local.clear(); // Reset state during debugging
```

**3. Monitor API Calls:**

```typescript
// Wrap fetch to log all requests
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  console.log("API Request:", args);
  const response = await originalFetch(...args);
  console.log("API Response:", response.status);
  return response;
};
```

**4. Debug Message Passing:**

```typescript
// Log all messages in background script
browser.runtime.onMessage.addListener((message, sender) => {
  console.log("Message received:", message, "from:", sender);
  return true; // Keep channel open for async response
});
```

### 10.3 Performance Profiling

```javascript
// Profile slow operations
console.time("sync-operation");
await syncTabs();
console.timeEnd("sync-operation");

// Memory usage
console.log("Memory:", performance.memory);
```

### 10.4 Testing CRDT State

```typescript
// Inspect Yjs document state
const doc = new Y.Doc();
console.log("Document state:", doc.toJSON());
console.log("Pending updates:", Y.encodeStateAsUpdate(doc));
```

---

## 11. Security Best Practices

### 11.1 WebExtension Security

**Content Security Policy:**

```json
// manifest.json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'none';"
}
```

**Validate All External Data:**

```typescript
// Always validate data from external sources
function validateTabData(data: unknown): data is Tab {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    "url" in data &&
    typeof (data as any).url === "string" &&
    isValidUrl((data as any).url)
  );
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}
```

**Secure Storage:**

```typescript
// Never store sensitive data in plain text
const encryptedToken = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv },
  key,
  new TextEncoder().encode(token)
);

// Store only encrypted version
await browser.storage.local.set({
  authToken: Array.from(new Uint8Array(encryptedToken)),
});
```

### 11.2 API Communication Security

**Always Use HTTPS:**

```typescript
// Enforce HTTPS in production
if (PRODUCTION && !apiUrl.startsWith("https://")) {
  throw new Error("API must use HTTPS in production");
}
```

**Implement Request Timeouts:**

```typescript
async function fetchWithTimeout(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}
```

### 11.3 Permission Management

**Request Minimal Permissions:**

```json
// manifest.json - only request what's needed
"permissions": [
  "tabs",        // Required for tab sync
  "storage",     // Required for settings
  "webRequest"   // Only if absolutely necessary
]
```

**Runtime Permission Checks:**

```typescript
// Check permissions before using APIs
const hasTabsPermission = await browser.permissions.contains({
  permissions: ["tabs"],
});

if (!hasTabsPermission) {
  // Gracefully handle missing permission
}
```

---

## 12. Troubleshooting Common Issues

### 12.1 Extension Not Loading

**Problem:** Extension doesn't appear in Firefox after installation

**Solutions:**

1. Check `manifest.json` for syntax errors: `npx web-ext lint`
2. Verify minimum Firefox version matches your browser
3. Check browser console for manifest parsing errors
4. Ensure all listed resources exist (icons, scripts)

### 12.2 Server Connection Failures

**Problem:** Extension can't connect to server

**Solutions:**

1. **Certificate Issues (Local Dev):**

   ```bash
   # Accept self-signed cert in Firefox
   # Navigate to https://localhost:443 and accept the certificate
   ```

2. **CORS Issues:**

   ```rust
   // Ensure server has proper CORS headers
   .layer(
       CorsLayer::new()
           .allow_origin(Any)
           .allow_methods([Method::GET, Method::POST])
           .allow_headers([CONTENT_TYPE, AUTHORIZATION])
   )
   ```

3. **Token Mismatch:**

   ```bash
   # Verify tokens match between extension and server
   grep shared_token ~/.config/tanaka/tanaka.toml
   # Check extension settings in about:addons
   ```

### 12.3 Sync Not Working

**Problem:** Tabs not syncing between devices

**Diagnostic Steps:**

1. Check extension console for errors
2. Verify server logs: `tail -f tanaka.log`
3. Inspect network tab for failed requests
4. Validate Yjs document state (see debugging section)

**Common Fixes:**

- Clear extension storage and re-authenticate
- Check SQLite database integrity: `sqlite3 tabs.db "PRAGMA integrity_check;"`
- Ensure both devices have same server URL and token

### 12.4 High Memory Usage

**Problem:** Extension consuming too much memory

**Solutions:**

1. **Limit stored data:**

   ```typescript
   // Store only essential tab properties
   const minimalTab = {
     id: tab.id,
     url: tab.url,
     title: tab.title,
     // Omit favicon, etc.
   };
   ```

2. **Implement data cleanup:**

   ```typescript
   // Periodically clean old data
   async function cleanupOldTabs() {
     const stored = await browser.storage.local.get("tabs");
     const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

     const filtered = stored.tabs.filter(
       (tab) => tab.lastAccessed > oneWeekAgo
     );

     await browser.storage.local.set({ tabs: filtered });
   }
   ```

### 12.5 Build Failures

**TypeScript Build Issues:**

```bash
# Clear build cache
rm -rf extension/dist extension/node_modules/.cache

# Reinstall dependencies
cd extension && rm -rf node_modules pnpm-lock.yaml
pnpm install

# Check for type errors
pnpm run typecheck
```

**Rust Build Issues:**

```bash
# Clear Rust cache
cd server && cargo clean

# Update dependencies
cargo update

# Check for specific errors
cargo check --all-targets
```

### 12.6 Performance Issues

**Slow Extension Startup:**

- Profile with `performance.mark()` (see debugging section)
- Defer non-critical initialization
- Use lazy loading for UI components

**High CPU Usage:**

- Check for infinite loops in event handlers
- Throttle/debounce frequent events
- Profile with Firefox Performance tool

### 12.7 Development Environment Issues

**pnpm not found:**

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

**Port already in use:**

```bash
# Find process using port
lsof -i :443
# or
netstat -tlnp | grep 443
```

**Firefox won't start with extension:**

```bash
# Check for Firefox profile issues
pnpm run start -- --firefox-profile=default
# Or create fresh profile
pnpm run start -- --firefox-profile=tanaka-dev
```
