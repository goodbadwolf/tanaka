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

## Prerequisites

| Tool    | Version | Purpose |
| ------- | ------- | ------- |
| Rust    | 1.83+   | Server development |
| Node.js | 24+     | Extension development |
| pnpm    | 10.11+  | Package management |
| SQLite  | 3.40+   | Database |
| Firefox | 126+    | Extension testing |

### Automated Setup

The easiest way to install all prerequisites:

```bash
# Install all development tools
python3 scripts/tanaka.py setup-dev

# Preview what would be installed
python3 scripts/tanaka.py setup-dev --dry-run

# Install specific tools only
python3 scripts/tanaka.py setup-dev --include rust node
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
<summary>4. Install Optional Tools</summary>

```bash
# SQLx CLI for migrations
cargo install sqlx-cli --no-default-features --features sqlite

# Python development tools
pip install uv  # Fast Python package manager
```
</details>

---

## First-Time Setup

### 1. Clone the Repository

```bash
git clone https://github.com/goodbadwolf/tanaka.git
cd tanaka
```

### 2. Install Development Dependencies

```bash
# Python tools (linting, code generation)
uv sync --dev

# Pre-commit hooks
pre-commit install
pre-commit install --hook-type commit-msg
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

## Development Workflow

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

## Essential Commands Reference

### Server Commands (Rust)

```bash
cargo test              # Run tests
cargo build             # Debug build
cargo build --release   # Release build
cargo run               # Run server
cargo fmt               # Format code
cargo clippy            # Lint code
cargo doc --open        # Generate docs
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
pnpm run webapp        # Run as webapp

# Building
pnpm run build:dev     # Development build
pnpm run build:prod    # Production build
pnpm run watch         # Watch mode

# Quality
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

## Testing Strategy

### Unit Tests

- **Rust**: Tests next to source files (`mod tests`)
- **TypeScript**: Tests in `__tests__` folders or `.test.ts` files
- **Coverage targets**: 80%+ for both

### Integration Tests

- **Server**: `tests/` directory for API tests
- **Extension**: Mock browser APIs for testing
- **Focus**: Critical paths and edge cases

### Manual Testing

1. Load extension in Firefox
2. Test with multiple windows/devices
3. Verify sync functionality
4. Check error handling

---

## Local Development Configuration

### Server Configuration

Create `server/.env` for development:

```bash
RUST_LOG=debug
DATABASE_URL=sqlite://tabs.db
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

## Webapp Mode

Test the extension without Firefox:

```bash
pnpm run webapp
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

## Python Tooling

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

## Release Process

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

## Testing GitHub Actions Locally

Test CI workflows before pushing:

```bash
# Install tools
python3 scripts/tanaka.py setup-dev --include act podman

# Test all workflows
python3 scripts/tanaka.py test-ci

# Test specific workflow
python3 scripts/tanaka.py test-ci -w ci.yml

# Dry run
python3 scripts/tanaka.py test-ci --dry-run
```

Troubleshooting:
- Start podman: `podman machine start`
- Skip in commits: `SKIP=test-github-actions git commit`
- Skip steps locally: `if: ${{ !env.ACT }}`

---

## Component Library

The extension includes reusable React components. See the full [Component Documentation](#component-library-1) below.

Quick usage:

```tsx
import { Button, Input, Card } from '../components';

<Card header="Settings">
  <Input label="Server URL" type="url" />
  <Button variant="primary">Save</Button>
</Card>
```

---

## Contributing Guidelines

### Before Submitting

1. **Run all checks**:
   ```bash
   pre-commit run --all-files
   ```

2. **Test your changes**:
   - Unit tests pass
   - Manual testing done
   - No regressions

3. **Update documentation**:
   - Code comments if needed
   - Update relevant docs
   - Add to ROADMAP.md if applicable

### Code Style

- Follow existing patterns
- Self-documenting code > comments
- Small, focused commits
- See [Git Guidelines](GIT.md)

---

## Next Steps

- **Architecture details**: See [Architecture](ARCHITECTURE.md)
- **Common issues**: See [Troubleshooting](TROUBLESHOOTING.md)
- **Git workflow**: See [Git Guidelines](GIT.md)
- **Project roadmap**: See [Roadmap](ROADMAP.md)

---

## Component Library

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
import { Input } from '../components';

<Input
  label="Email"
  type="email"
  required
  validate={(value) => !value.includes('@') ? 'Invalid email' : undefined}
  onChange={handleChange}
/>
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
import { LoadingSpinner } from '../components';

<LoadingSpinner size="large" color="primary" />
```

**Props:**
- `size`: 'small' | 'medium' | 'large'
- `color`: 'primary' | 'secondary' | 'white'
- `ariaLabel`: string

### ErrorMessage

Display error, warning, or info messages with optional dismiss functionality.

```tsx
import { ErrorMessage } from '../components';

<ErrorMessage
  type="error"
  title="Connection Failed"
  message="Unable to connect to the server"
  onDismiss={() => setError(null)}
/>
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
import { Card } from '../components';

<Card
  variant="elevated"
  header="Settings"
  footer={<Button>Save Changes</Button>}
>
  <p>Card content goes here</p>
</Card>
```

**Props:**
- `variant`: 'default' | 'outlined' | 'elevated'
- `padding`: 'none' | 'small' | 'medium' | 'large'
- `header`: ReactNode
- `footer`: ReactNode
- `interactive`: boolean
- `onClick`: () => void
