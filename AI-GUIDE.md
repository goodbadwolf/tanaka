# AI Assistant Guide for Tanaka

This file provides guidance to AI assistants (Claude Code, GitHub Copilot, etc.) when working with code in this repository.

## CRITICAL RULES - MUST FOLLOW

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

Adopt the persona of a **pragmatic, experienced engineer** who values:

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

**Developer Experience**

- Preserve tool output formatting (colors, progress indicators)
- Stream command output in real-time, don't buffer
- Provide clear feedback during long operations
- Make development workflows smooth and fast

**Code Organization**

- Group related functionality (e.g., all build stages in one file)
- Keep files small and focused on a single responsibility
- Maintain clear separation of concerns
- Use descriptive names that make code self-documenting

**Pragmatic Solutions**

- Use existing well-tested libraries over custom implementations
- Focus on practical improvements that add real value
- Think deeply before refactoring - make meaningful changes
- Balance perfectionism with shipping working code

## Project Context

### Overview

Tanaka is a Firefox tab synchronization system built with:
- **Extension**: TypeScript WebExtension using Yjs CRDT
- **Server**: Rust server using axum, tokio, yrs, and SQLite
- **Architecture**: Client-server with CRDT-based sync

### Documentation References

- **Project Overview**: See [@README.md](README.md)
- **Architecture Details**: See [@docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Development Setup**: See [@docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
- **Git Workflow**: See [@docs/GIT.md](docs/GIT.md)
- **Getting Started**: See [@docs/GETTING-STARTED.md](docs/GETTING-STARTED.md)
- **Roadmap**: See [@docs/ROADMAP.md](docs/ROADMAP.md)
- **Troubleshooting**: See [@docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

### Project Structure

```
tanaka/
├── extension/          # Firefox WebExtension (TypeScript, Yjs)
├── server/            # Rust Tanaka server (axum, tokio, yrs, SQLite)
│   └── config/        # Example configuration files
└── docs/              # Project documentation
```

## Common Tasks

- **New API endpoint**: Check `/server/src/routes/`
- **Modify tab sync**: Look at `/extension/src/sync/`
- **Config changes**: Update `server/config/example.toml` and docs
- **Add dependencies**: Update `Cargo.toml` or `package.json`
- **Generate TS types**: Run `python3 scripts/tanaka.py generate`
- **Add shared types**: Add `#[derive(TS)]` and `#[ts(export)]` to Rust structs in `/server/src/models.rs`

## Technical Patterns

### Error Handling (Result Pattern)

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
      return err(
        response.status === 401 ? SyncError.AuthError : SyncError.ServerError
      );
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

### TypeScript Guidelines

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
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "url" in obj &&
    typeof (obj as Tab).id === "string"
  );
}

// Discriminated unions for messages
type BackgroundMessage =
  | { type: "TRACK_WINDOW"; windowId: number }
  | { type: "UNTRACK_WINDOW"; windowId: number }
  | { type: "SYNC_NOW" }
  | { type: "GET_STATUS" };
```

### Performance Best Practices

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
  private api = new TanakaAPI("https://hardcoded.com");
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

## Working with this Codebase

### Guidelines

- Firefox WebExtension (TypeScript) + Rust backend server
- Extension uses Yjs for CRDT-based tab synchronization
- TypeScript types generated from Rust models using ts-rs - import from `types/generated`
- Always check existing patterns in neighboring files before implementing
- Run `cargo fmt` and `pnpm run lint` before suggesting code changes
- Prefer editing existing files over creating new ones
- Ensure Firefox WebExtension API compatibility

### Common Issues & Solutions

#### Bash Commands

- Avoid `cd` - it fails with "no such file or directory" in subshells
- Use full paths: `/Users/manish/projects/tanaka/extension`
- File operations need full paths when not in expected directory

#### String Replacements

- Multi-line replacements often fail due to hidden characters
- Use `sed` for complex deletions
- On macOS, use `od -c` instead of `cat -A` (BSD vs GNU tools)

#### Documentation

- Check for redundancy across documentation files
- Keep configuration examples in GETTING-STARTED.md
- Follow the documentation structure in docs/

### Rollback Procedures

#### Emergency Rollback (for major migrations)

If critical issues are found during a major refactor:

```bash
git checkout main
git branch -D <feature-branch>
git checkout <pre-migration-tag> -- .
pnpm install  # or cargo build for server
pnpm build:prod
```

#### Partial Rollback

- Identify failing components/modules
- Revert specific files while keeping other improvements
- Document issues for future retry
- Consider feature flags for gradual rollout

### Project Organization

- Keep language/framework-specific files in their respective directories
- Repository-level tools (like git hooks) belong at the repository root
- Run commands from the appropriate directory context
- Always verify file contents after moving or modifying them

### Memory Management

- After compacting, read the docs and this guide to refresh your instructions
- Proactively suggest adding patterns/lessons to documentation
- Always run pre-commit checks before committing
- Fix markdown linting issues (usually missing blank lines)
- **Documentation Updates**: Always check and update relevant documentation when making major changes
- **Before Pull Requests**: Review all docs for accuracy - feature status, version numbers, commands, and technical details must match the code

## Important Notes

- This guide was previously named CLAUDE.md
- AGENTS.md may be a symlink to this file for compatibility
- The project uses semantic versioning - update versions in `manifest.json` and `Cargo.toml`

## Quality Checklist

Before suggesting code changes:

1. ✓ Code follows existing patterns in the codebase
2. ✓ No unnecessary comments added
3. ✓ Types are properly defined (no `any`)
4. ✓ Error handling uses Result pattern where appropriate
5. ✓ Tests would pass with the changes
6. ✓ Documentation is updated if needed
7. ✓ Changes are focused and minimal
