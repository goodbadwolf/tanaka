# Tanaka Development Guide

**Purpose**: Complete developer setup and workflow documentation
**Audience**: Contributors and developers working on Tanaka
**Prerequisites**: Basic knowledge of Rust, TypeScript, and browser extensions

## Navigation

- [🏠 Home](../README.md)
- [🚀 Getting Started](GETTING-STARTED.md)
- [💻 Development](DEVELOPMENT.md)
- [🏗️ Architecture](ARCHITECTURE.md)
- [🔧 Troubleshooting](TROUBLESHOOTING.md)
- [📝 Git Guidelines](GIT.md)

---

## 1. Architecture Overview

```
┌──────────────┐   JSON Operations   ┌──────────────┐
│  Extension   │ ─────────────────▶  │   Server     │
│ (TypeScript) │ ◀────────────────── │  (Rust)      │
└──────────────┘      5 s poll       └─────┬────────┘
                                           │  SQLite WAL
                                           ▼
                                        tanaka.db
```

### 1.1 Browser-side Workflow

1. **Capture** – The extension hooks `tabs.*` and `windows.*` events as they happen.
2. **Encode** – Each change is converted to structured CRDT operations (`upsert_tab`, `close_tab`, etc.).
3. **Sync** – Every 5 seconds (adjusting to 1 s during activity) the extension POSTs its queued operations and immediately requests any newer ones from the server.

### 1.2 Server Workflow

1. **Merge** – Axum route `/sync` receives structured operations, applies them to CRDT state, and assigns a monotonic Lamport clock.
2. **Persist** – Operations are cached in a `DashMap` for fast read-back and written to `SQLite` in WAL mode for durability.
3. **Respond** – The server streams back any operations with a clock greater than the client's `since` parameter.

### 1.3 Data Guarantees

> **✅ Phase 3 Complete**: All data guarantees have been restored. Multi-device synchronization is fully functional.

- **Eventual Consistency** – Structured CRDT operations ensure replicas converge regardless of network order. ✅
- **Crash Safety** – Server state persists across restarts. WAL mode plus 5s flush means at most 5 seconds of operations are in memory at any moment. ✅
- **Security** – All traffic is TLS-encrypted (`rustls`) and protected by a shared bearer token with proper CORS configuration. ✅

For detailed protocol specification, see [SYNC-PROTOCOL.md](SYNC-PROTOCOL.md).

---

## 2. Prerequisites

| Tool     | Version | Purpose               | Required |
| -------- | ------- | --------------------- | -------- |
| Rust     | 1.83+   | Server development    | Yes      |
| Node.js  | 24+     | Extension development | Yes      |
| pnpm     | 10.11+  | Package management    | Yes      |
| SQLite   | 3.40+   | Database              | Yes      |
| Firefox  | 126+    | Extension testing     | Yes      |
| Python   | 3.10+   | Build tools/scripts   | Yes      |
| uv       | 0.5+    | Python pkg management | Yes      |
| SQLx CLI | Latest  | Database migrations   | Yes      |

### Automated Setup

The easiest way to install all prerequisites:

```bash
# Install all development tools
python3 scripts/tanaka.py setup-dev

# Preview what would be installed
python3 scripts/tanaka.py setup-dev --dry-run

# Install specific tools only
python3 scripts/tanaka.py setup-dev --include rust node sqlx
python3 scripts/tanaka.py setup-dev --exclude pnpm

# Install CI testing tools
python3 scripts/tanaka.py setup-dev --include act podman
```

### Manual Installation

<details>
<summary>1. Install Rust</summary>

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

</details>

<details>
<summary>2. Install Node.js</summary>

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc  # or ~/.zshrc

# Install Node.js
nvm install 24
nvm alias default 24
nvm use 24
```

</details>

<details>
<summary>3. Install pnpm</summary>

```bash
npm install -g pnpm
```

</details>

<details>
<summary>4. Install Required Tools</summary>

```bash
# SQLx CLI for migrations (required)
cargo install sqlx-cli --no-default-features --features sqlite

# Testing tools for Rust (required for development)
cargo install cargo-nextest --locked  # Faster test runner
cargo install cargo-llvm-cov --locked  # Code coverage

# Python package manager (required for scripts)
pip install uv  # Fast Python package manager

# Pre-commit framework (required for contributions)
pip install pre-commit
pre-commit install
pre-commit install --hook-type commit-msg
```

</details>

<details>
<summary>5. Install Optional Tools</summary>

```bash
# Performance optimization
cargo install sccache  # Faster Rust compilation cache

# Shell script linting (for script contributions)
brew install shellcheck  # macOS
brew install shfmt       # macOS

# CI testing locally
brew install act         # Run GitHub Actions locally
brew install podman      # Container runtime for act
```

</details>

### Python Package Management: uv vs pip

This project uses `uv` for Python dependency management:

**Use `uv` when:**

- Installing project dependencies: `uv sync --dev`
- Running project scripts: `uv run scripts/tanaka.py lint`
- Working within this project's environment

**Use `pip` when:**

- Installing global tools: `pip install uv`
- Installing tools outside this project
- Systems where uv isn't available

**Key differences:**

- `uv` is 10-100x faster than pip
- `uv` automatically manages virtual environments
- `uv` has better dependency resolution
- `uv sync` installs from `pyproject.toml` (like `npm install` for Python)

---

## 3. First-Time Setup

### 1. Clone the Repository

```bash
git clone https://github.com/goodbadwolf/tanaka.git
cd tanaka
```

### 2. Install Development Dependencies

```bash
# Python tools (linting, code generation)
uv sync --dev

# Pre-commit hooks (if not already installed)
uv run pre-commit install
uv run pre-commit install --hook-type commit-msg

# Install required Rust tools (if not already installed)
cargo install sqlx-cli --no-default-features --features sqlite
cargo install cargo-nextest --locked
cargo install cargo-llvm-cov --locked
```

### 3. Build Server

```bash
cd server
cargo test
cargo build
```

### 4. Build Extension

```bash
cd extension
pnpm install
pnpm run build:dev
```

### 5. Start Development

```bash
# Terminal 1: Run server
cd server && cargo run

# Terminal 2: Run extension with hot reload
cd extension && pnpm run dev

# Terminal 3: Launch Firefox with extension
cd extension && pnpm run start
```

---

## 4. Configuration

See [Getting Started](GETTING-STARTED.md#configuration-options) for detailed configuration instructions.

The server automatically applies SQLite safety settings at startup:

```sql
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

## 5. Database Migrations

The server uses SQLx migrations for database schema management. Migrations are automatically run on startup, but you can also manage them manually.

### Creating a New Migration

```bash
cd server

# Create a reversible migration (recommended)
sqlx migrate add -r <description>

# Example:
sqlx migrate add -r add_user_preferences_table
# Creates:
#   migrations/<timestamp>_add_user_preferences_table.up.sql
#   migrations/<timestamp>_add_user_preferences_table.down.sql

# Note: After the first reversible migration, all subsequent migrations
# will be reversible by default
```

### Running Migrations

```bash
# Ensure DATABASE_URL is set (or create .env file)
export DATABASE_URL=sqlite://tanaka.db

# Create the database if it doesn't exist
sqlx database create

# Run all pending migrations
sqlx migrate run

# Revert the last migration
sqlx migrate revert

# Check migration status
sqlx migrate info
```

### Migration Files

Migrations are stored in `server/migrations/` and are applied in order based on their timestamp prefix. Each migration should be idempotent (safe to run multiple times).

---

## 6. Development Workflow

### Code Organization

```
tanaka/
├── extension/          # Firefox WebExtension (TypeScript)
│   ├── src/           # Source code
│   ├── dist/          # Built extension
│   └── coverage/      # Test coverage reports
├── server/            # Rust server
│   ├── src/           # Source code
│   └── target/        # Build artifacts
├── scripts/           # Development tools
└── docs/              # Documentation
```

### Common Development Tasks

#### Generate TypeScript Types from Rust

```bash
# Generates types in extension/src/types/generated/
uv run scripts/tanaka.py generate
```

#### Run Linters

```bash
# All linters
uv run scripts/tanaka.py lint

# Fix auto-fixable issues
uv run scripts/tanaka.py lint --fix

# Specific linters
uv run scripts/tanaka.py lint --python
uv run scripts/tanaka.py lint --markdown
```

#### Run Tests

```bash
# Rust tests
cd server && cargo test

# TypeScript tests
cd extension && pnpm test
cd extension && pnpm test:watch  # Watch mode
```

---

## 7. Essential Commands Reference

### Server Commands (Rust)

```bash
# Testing (Enhanced)
cargo nextest run       # Run tests with nextest (2-3× faster)
cargo test              # Run tests (fallback)
cargo llvm-cov --html   # Generate HTML coverage report
cargo llvm-cov --lcov   # Generate LCOV coverage report

# Building
cargo build             # Debug build
cargo build --release   # Release build
cargo run               # Run server

# Code Quality
cargo fmt               # Format code
cargo clippy            # Lint code
cargo doc --open        # Generate docs

# Direct Testing Commands (no script needed)
cargo nextest run                    # Run tests with nextest (2-3× faster)
cargo nextest run --filter sync      # Run specific tests
cargo llvm-cov --html               # Generate HTML coverage report
cargo llvm-cov --lcov --output-path lcov.info  # Generate LCOV report
```

### Extension Commands (TypeScript)

```bash
# Dependencies
pnpm install            # Install dependencies
pnpm outdated          # Check for updates
pnpm update            # Update dependencies

# Development
pnpm run dev           # Start with hot reload
pnpm run start         # Launch Firefox
pnpm run webapp        # Run as webapp (temporarily unavailable - Phase 4)

# Building
pnpm run build:dev     # Development build
pnpm run build:prod    # Production build
pnpm run watch         # Watch mode

# Lint
pnpm run lint          # ESLint
pnpm run lint:fix      # Fix issues
pnpm run typecheck     # TypeScript check
pnpm run format        # Prettier

# Testing
pnpm run test          # Run tests
pnpm run test:watch    # Watch mode
pnpm run test:coverage # Coverage report

# Analysis
pnpm run analyze       # Bundle analysis
pnpm run gen-icons     # Generate icons
```

---

## 8. Testing Strategy

> **Note**: All tests including multi-device sync tests should now pass.

### Enhanced Testing Infrastructure

#### Rust Testing Tools

- **cargo-nextest**: 2-3× faster test execution with better output

  ```bash
  cargo install cargo-nextest --locked
  cargo nextest run
  ```

- **cargo-llvm-cov**: Superior coverage reporting with source-based coverage

  ```bash
  cargo install cargo-llvm-cov
  cargo llvm-cov --html  # HTML report at target/llvm-cov/html/
  ```

- **pretty_assertions**: Colorful diffs for better debugging

  ```rust
  use pretty_assertions::{assert_eq, assert_ne};
  ```

- **rstest**: Parameterized testing for comprehensive coverage
  ```rust
  #[rstest]
  #[case::upsert(CrdtOperation::UpsertTab { /* ... */ })]
  #[case::close(CrdtOperation::CloseTab { /* ... */ })]
  fn test_operations(#[case] op: CrdtOperation) { /* ... */ }
  ```

### Unit Tests

- **Rust**: Tests next to source files (`mod tests`)
- **TypeScript**: Tests in `__tests__` folders or `.test.ts` files
- **Coverage targets**: 80%+ for both

### Integration Tests

- **Server**: `tests/` directory for API tests
- **Extension**: Mock browser APIs for testing
- **Focus**: Critical paths and edge cases

#### Server Integration Tests

The `server/tests/sync_integration.rs` file contains comprehensive tests for the CRDT sync protocol:

1. **Basic Operations**

   - Empty sync requests verification
   - Single tab creation testing

2. **Authentication**

   - Invalid token rejection
   - Bearer token validation

3. **Multi-Device Sync**

   - Cross-device operation synchronization
   - Incremental sync with `since_clock`

4. **Complex Operations**

   - Multiple CRDT operation types in single request
   - Operation ordering and clock management

5. **Error Handling**
   - Invalid operation validation
   - Malformed request handling

```bash
# Run all integration tests
cargo test --test sync_integration

# Run specific test
cargo test test_sync_between_devices

# Run with output
cargo test --test sync_integration -- --nocapture
```

Key features:

- In-memory SQLite database for test isolation
- Per-test app instances with auth middleware
- Proper Lamport clock incrementing
- Device-specific filtering to prevent operation echo

### Manual Testing

1. Load extension in Firefox
2. Test with multiple windows/devices
3. Verify sync functionality
4. Check error handling

---

## 9. Local Development Configuration

### Server Configuration

Create `server/.env` for development:

```bash
RUST_LOG=debug
DATABASE_URL=sqlite://tanaka.db
BIND_ADDR=127.0.0.1:8000
AUTH_TOKEN=dev-token
```

### Extension Configuration

The extension uses environment-based configs in `src/config/environments/`:

- `development.ts` - Local development
- `staging.ts` - Staging environment
- `production.ts` - Production release

### TLS for Local Development

For HTTPS in development:

```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 \
  -keyout key.pem -out cert.pem \
  -days 365 -nodes -subj "/CN=localhost"

# Update server config
[tls]
cert_path = "cert.pem"
key_path = "key.pem"
```

---

## 10. Webapp Mode

> **Note**: The webapp mode, along with popup and settings pages, has been temporarily removed during the SCSS migration (Phase 2.5). These will be reimplemented with the new SCSS architecture in Phase 4. See [SCSS_ROADMAP.md](./SCSS_ROADMAP.md) for details.

Test the extension without Firefox:

```bash
pnpm run webapp  # Currently unavailable - will be restored in Phase 4
```

Features:

- Runs at http://localhost:3000
- Mock browser APIs
- Hot module replacement
- Route-based navigation:
  - `/` - Popup view
  - `/settings` - Settings page

Implementation:

- `src/browser/mock.ts` - Mock browser APIs
- `src/webapp/index.tsx` - Webapp entry point
- `WEBAPP_MODE=true` - Environment flag

---

## 11. Python Tooling

This project uses `uv` for Python dependency management:

```bash
# Install dependencies
uv sync --dev

# Run commands
uv run scripts/tanaka.py lint
uv run scripts/tanaka.py generate
```

### uv vs pip

- **uv**: Fast, manages virtual environments, better resolution
- **pip**: Use for global tools like `uv` itself
- Think of `uv` as "pnpm for Python"

---

## 12. Release Process

1. **Update versions**:

   - `extension/manifest.json`
   - `server/Cargo.toml`

2. **Create release**:

   ```bash
   git tag -s vX.Y.Z -m "Release vX.Y.Z"
   git push origin --tags
   ```

3. **GitHub Actions** automatically:
   - Builds server binaries
   - Signs extension
   - Creates release with artifacts

---

## 13. Testing GitHub Actions Locally

Test CI workflows before pushing:

```bash
# Install tools
python3 scripts/tanaka.py setup-dev --include act podman

# Test all workflows
uv run scripts/tanaka.py test-ci

# Test specific workflow
uv run scripts/tanaka.py test-ci -w ci.yml

# Dry run
uv run scripts/tanaka.py test-ci --dry-run
```

Troubleshooting:

- Start podman: `podman machine start`
- Skip in commits: `SKIP=test-github-actions git commit`
- Skip steps locally: `if: ${{ !env.ACT }}`

---

## 14. Component Library

The extension includes reusable React components. See the full [Component Documentation](#component-library-1) below.

Quick usage:

```tsx
import { Button, Input, Card } from "../components";

<Card header="Settings">
  <Input label="Server URL" type="url" />
  <Button variant="primary">Save</Button>
</Card>;
```

---

## 15. Contributing Guidelines

### Before Submitting

1. **Run all checks**:

   ```bash
   pre-commit run --all-files
   ```

   **⚠️ Important**: Never use `git commit --no-verify` to bypass checks. These hooks catch the same issues CI will enforce. Skipping them locally only delays failures and wastes CI resources.

2. **Test your changes**:

   - Unit tests pass
   - Manual testing done
   - No regressions

3. **Update documentation**:
   - Code comments if needed
   - Update relevant docs
   - Add to TODOS.md if applicable

### Code Style

- Follow existing patterns
- Self-documenting code > comments
- Small, focused commits
- See [Git Guidelines](GIT.md)

---

## 16. Next Steps

- **Architecture details**: See [Architecture](ARCHITECTURE.md)
- **Common issues**: See [Troubleshooting](TROUBLESHOOTING.md)
- **Git workflow**: See [Git Guidelines](GIT.md)
- **Pending tasks**: See [TODOs](TODOS.md)
- **Sync protocol**: See [Sync Protocol](SYNC-PROTOCOL.md)

---

## 17. Component Library

The extension includes a collection of reusable UI components built with React/Preact.

### Button

A versatile button component with multiple variants and states.

```tsx
import { Button } from '../components';

<Button variant="primary" onClick={handleClick}>
  Click me
</Button>

<Button variant="danger" loading>
  Deleting...
</Button>
```

**Props:**

- `variant`: 'primary' | 'secondary' | 'danger'
- `size`: 'small' | 'medium' | 'large'
- `loading`: boolean
- `disabled`: boolean
- `fullWidth`: boolean

### Input

Form input component with built-in validation and error handling.

```tsx
import { Input } from "../components";

<Input
  label="Email"
  type="email"
  required
  validate={(value) => (!value.includes("@") ? "Invalid email" : undefined)}
  onChange={handleChange}
/>;
```

**Props:**

- `type`: 'text' | 'email' | 'password' | 'url' | 'number'
- `label`: string
- `error`: string | boolean
- `validate`: (value: string) => string | undefined
- `required`: boolean

### LoadingSpinner

Animated loading indicator with size and color variants.

```tsx
import { LoadingSpinner } from "../components";

<LoadingSpinner size="large" color="primary" />;
```

**Props:**

- `size`: 'small' | 'medium' | 'large'
- `color`: 'primary' | 'secondary' | 'white'
- `ariaLabel`: string

### ErrorMessage

Display error, warning, or info messages with optional dismiss functionality.

```tsx
import { ErrorMessage } from "../components";

<ErrorMessage
  type="error"
  title="Connection Failed"
  message="Unable to connect to the server"
  onDismiss={() => setError(null)}
/>;
```

**Props:**

- `type`: 'error' | 'warning' | 'info'
- `title`: string (optional)
- `message`: string
- `dismissible`: boolean
- `onDismiss`: () => void

### Card

Container component with optional header and footer sections.

```tsx
import { Card } from "../components";

<Card variant="elevated" header="Settings" footer={<Button>Save Changes</Button>}>
  <p>Card content goes here</p>
</Card>;
```

**Props:**

- `variant`: 'default' | 'outlined' | 'elevated'
- `padding`: 'none' | 'small' | 'medium' | 'large'
- `header`: ReactNode
- `footer`: ReactNode
- `interactive`: boolean
- `onClick`: () => void

---

## 18. Debugging & Troubleshooting

### Extension Debugging

1. **Extension Console**: `about:debugging` → This Firefox → Tanaka → Inspect
2. **Storage inspection**: `await browser.storage.local.get()`
3. **Performance profiling**: Use `console.time()` and browser DevTools
4. **Network monitoring**: Check DevTools Network tab for sync requests

### Server Debugging

1. **Enable debug logging**: `RUST_LOG=debug cargo run`
2. **Database inspection**: `sqlite3 tanaka.db .tables`
3. **Monitor performance**: Check request logs and response times

### Common Issues

- **Extension not loading**: Check manifest.json syntax with `npx web-ext lint`
- **Server connection failures**: Verify certificate acceptance and token match
- **Sync not working**: Check both extension console and server logs
- **High memory usage**: Monitor tab count and implement data cleanup

For detailed troubleshooting, see [Troubleshooting Guide](TROUBLESHOOTING.md).

---

## 19. Security Best Practices

### WebExtension Security

- Validate all external data before processing
- Use Content Security Policy in manifest.json
- Never store sensitive data in plain text
- Request minimal permissions

### API Communication Security

- Always use HTTPS in production
- Implement request timeouts
- Validate server certificates
- Use strong authentication tokens

### Development Security

- Review all code changes for security implications
- Keep dependencies updated
- Follow secure coding practices
- Test with security-focused mindset

---

## 20. Performance Optimization

### Extension Performance

- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Debounce frequent operations
- Profile with Firefox Performance tools

### Server Performance

- Use connection pooling for database
- Implement caching with DashMap
- Optimize database queries
- Monitor response times

### Network Performance

- Batch operations where possible
- Implement compression for large payloads
- Use incremental sync
- Monitor bandwidth usage

### Adaptive Sync Manager

The extension includes an optimized sync manager that dynamically adjusts sync behavior based on user activity and system state:

#### Key Features

1. **Adaptive Sync Intervals**

   - Active: 1s (during user activity)
   - Idle: 10s (no activity for 30s)
   - Error backoff: Exponential (5s, 10s, 20s... up to 60s)

2. **Priority-based Operation Batching**
   | Priority | Operations | Delay |
   |----------|------------|-------|
   | CRITICAL | close_tab, track/untrack_window | 50ms |
   | HIGH | upsert_tab, move_tab | 200ms |
   | NORMAL | set_active, window_focus | 500ms |
   | LOW | change_url | 1000ms |

3. **Operation Deduplication**

   - Multiple URL changes → Keep only latest
   - Redundant updates → Single operation
   - Reduces server load by ~70%

4. **Queue Management**
   - Max 1000 operations
   - Early sync at 50 operations
   - Drops oldest when full

#### Usage

```typescript
import { SyncManager } from "./sync";

const syncManager = new SyncManager({
  syncIntervalMs: 5000, // Base interval (adapts 1-10s)
  api: tanakaAPI,
  windowTracker: tracker,
  browser: browserAdapter,
});
```

#### Testing

```bash
npm test -- sync-manager.test.ts
```

---

## 21. Error Handling Architecture

### Extension Error System

```typescript
// Result pattern for explicit error handling
import { Result, ok, err } from "neverthrow";

async function syncTabs(): Promise<Result<Tab[], SyncError>> {
  try {
    const tabs = await api.syncTabs();
    return ok(tabs);
  } catch (error) {
    return err(SyncError.NetworkFailure);
  }
}
```

### Server Error System

```rust
// Comprehensive error types with proper HTTP status mapping
#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {message}")]
    Database {
        message: String,
        #[source]
        source: sqlx::Error,
    },
    // ... more error types
}
```

### Error Recovery

- Automatic retry with exponential backoff
- Circuit breaker pattern for repeated failures
- Graceful degradation when possible
- User-friendly error messages

For complete error handling details, see the error handling implementation in the codebase.
