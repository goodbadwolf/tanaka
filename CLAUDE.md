## CRITICAL RULES - MUST FOLLOW

### 0. THINK DEEPLY AND PLAN

**THINK DEEPLY AND PLAN** before acting.

### 1. NO UNNECESSARY COMMENTS

**DO NOT ADD COMMENTS** unless the code is genuinely unclear or complex. Most code should be self-documenting through good naming and structure.

**BAD examples (DO NOT DO THIS):**

```javascript
// Start the server
server.start();

// Define user interface
interface User {
  name: string;
}
```

**GOOD examples (ONLY when truly needed):**

```javascript
// Implements Fisher-Yates shuffle algorithm
function shuffle(array) {}

// Workaround for Firefox bug #12345
element.style.display = "none";
setTimeout(() => (element.style.display = ""), 0);
```

Only add comments when:

- The code uses a non-obvious algorithm or mathematical formula
- There's a workaround for a specific bug or browser quirk
- The business logic is genuinely complex and not evident from the code

### 2. ENGINEERING PHILOSOPHY

Be a **pragmatic, experienced engineer** who values:

**Clean Architecture & DRY Principles**

- Extract common functionality into reusable utilities
- Eliminate code duplication ruthlessly
- Prefer composition over repetition
- Create abstractions when patterns emerge (ProcessManager, file operations, etc.)

**Type Safety & Error Handling**

- Use Rust-style Results for error propagation (via `neverthrow` or similar)
- Centralize error management
- Make invalid states unrepresentable through types
- Prefer compile-time errors over runtime errors
- NEVER use `any` type in TypeScript - the linter will reject it. Use proper types or `unknown` with type guards

**Code Organization**

- Keep files small and focused on a single responsibility
- Maintain clear separation of concerns
- Use descriptive names that make code self-documenting

**Pragmatic Solutions**

- Use existing well-tested libraries over custom implementations
- Think deeply before refactoring - make meaningful changes
- Balance perfectionism with shipping working code

**Quality Assurance**

- ALWAYS run pre-commit hooks before committing (`pre-commit run --all-files`)
- NEVER use `git commit --no-verify`
- Fix linting issues locally rather than pushing broken code
- Understand that CI enforces the same checks as pre-commit

## Project Context

### Overview

Tanaka is a Firefox tab synchronization system built with:

- **Extension**: TypeScript WebExtension using Yjs CRDT
- **Server**: Rust server using axum, tokio, yrs, and SQLite
- **Architecture**: Client-server with CRDT-based sync

### Documentation References

- **Project Overview**: @README.md
- **Architecture Details**: @docs/ARCHITECTURE.md
- **Development Setup**: @docs/DEVELOPMENT.md
- **Git Workflow**: @docs/GIT.md
- **Getting Started**: @docs/GETTING-STARTED.md
- **Roadmap**: @docs/ROADMAP.md
- **Troubleshooting**: @docs/TROUBLESHOOTING.md

## AI Agent Guidelines

### Working with this Codebase

- Firefox WebExtension (TypeScript) + Rust backend server
- Extension uses Yjs for CRDT-based tab synchronization
- TypeScript types generated from Rust models using ts-rs - import from `types/generated`
- Always check existing patterns in neighboring files before implementing
- Run `cargo fmt` and `pnpm run lint` before suggesting code changes
- Prefer editing existing files over creating new ones
- Ensure Firefox WebExtension API compatibility

### Project Structure

```
tanaka/
├── extension/          # Firefox WebExtension (TypeScript, Yjs)
├── server/            # Rust Tanaka server (axum, tokio, yrs, SQLite)
│   └── config/        # Example configuration files
└── docs/              # Project documentation
```

### Git Workflow

For commit guidelines, pre-commit hooks, and git best practices, see @docs/GIT.md

### Technical Patterns

#### Error Handling (Result Pattern)

```typescript
import { Result, ok, err } from "neverthrow";

enum SyncError {
  NetworkFailure = "NETWORK_FAILURE",
  InvalidData = "INVALID_DATA",
  AuthError = "AUTH_ERROR",
  ServerError = "SERVER_ERROR",
}

async function syncTabs(tabs: Tab[]): Promise<Result<SyncResponse, SyncError>> {
  if (!tabs.length) return err(SyncError.InvalidData);

  try {
    const response = await api.sync(tabs);
    if (!response.ok) {
      return err(response.status === 401 ? SyncError.AuthError : SyncError.ServerError);
    }
    return ok(response.data);
  } catch (e) {
    return err(SyncError.NetworkFailure);
  }
}

// Chain operations safely
const result = await syncTabs(tabs)
  .map((data) => updateLocalState(data))
  .mapErr(handleError);
```

#### TypeScript Guidelines

```typescript
// Import generated types (NEVER redefine)
import type { Tab, Window } from "../types/generated";

// Extend when needed
interface TabWithMetadata extends Tab {
  lastAccessed: number;
  syncStatus: "pending" | "synced" | "error";
}

// Type guards for runtime validation
function isValidTab(obj: unknown): obj is Tab {
  return typeof obj === "object" && obj !== null && "id" in obj && "url" in obj && typeof (obj as Tab).id === "string";
}

// Discriminated unions for messages
type BackgroundMessage =
  | { type: "TRACK_WINDOW"; windowId: number }
  | { type: "UNTRACK_WINDOW"; windowId: number }
  | { type: "SYNC_NOW" }
  | { type: "GET_STATUS" };
```

#### Performance Best Practices

1. **Memory**: Use browser storage instead of keeping all data in memory
2. **Events**: Debounce frequent events (tab updates, etc.)
3. **Heavy ops**: Use Web Workers for CRDT operations
4. **Loading**: Lazy load non-critical features
5. **Storage**: Batch writes instead of multiple small writes
6. **Monitoring**: Use performance marks for critical operations

### Writing Testable Code

**Core Principles:**

- Dependency injection for easy mocking
- Single responsibility per class/function
- Prefer pure functions
- Test interfaces, not implementations

```typescript
// Good - dependencies injected
class SyncManager {
  constructor(private api: TanakaAPI, private tracker: WindowTracker) {}
}

// Bad - hardcoded dependencies
class SyncManager {
  private api = new TanakaAPI("https://api.com");
}
```

**TDD Workflow:**

1. Write failing test
2. Write minimal code to pass
3. Refactor while keeping tests green
4. Focus on behavior, not implementation

**Test Quality:**

- Descriptive test names
- Arrange-Act-Assert pattern
- Independent tests (no shared state)
- Test edge cases

### Common Issues & Solutions

#### Documentation

- Check for redundancy across documentation files
- Keep configuration examples in GETTING-STARTED.md
- Follow the documentation structure in docs/
- AGENTS.md is a symlink to CLAUDE.md (changes affect both)

### Project Organization

- Keep language/framework-specific files in their respective directories
- Repository-level tools (like git hooks) belong at the repository root
- Run commands from the appropriate directory context
- Always verify file contents after moving or modifying them

### Memory Management

- After compacting, read the docs and this guide to refresh your instructions
- Proactively suggest adding patterns/lessons to documentation
- Always run pre-commit checks before committing
- Fix markdown linting issues
- **File References**: Use @<path> notation for file references in CLAUDE.md (not Markdown links)
- **Documentation Updates**: Always check and update relevant documentation when making major changes
- **Before Pull Requests**: Review all docs for accuracy - feature status, version numbers, commands, and technical details must match the code

### Essential Commands

See @docs/DEVELOPMENT.md for all development commands.

### Development Roadmap

For the unified development roadmap covering both extension and server improvements, see @docs/ROADMAP.md.

### Misc

- AGENTS.md is a symlink to this file for compatibility (used by OpenAI's Codex)
- The project uses semantic versioning - update versions in `manifest.json` and `Cargo.toml`

## Quality Checklist

Before suggesting code changes:

1. ✓ Code follows existing patterns in the codebase
2. ✓ No unnecessary comments added
3. ✓ Types are properly defined (no `any`)
4. ✓ Tests would pass with the changes
5. ✓ Documentation is updated if needed
6. ✓ Changes are focused and minimal
7. ✓ Pre-commit hooks run locally (`pre-commit run --all-files`)
