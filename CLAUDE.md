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
- **TODOs**: @docs/TODOS.md
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
- GEMINI.md is a symlink to CLAUDE.md (changes affect both)

#### GitHub CLI with Backticks

When using `gh pr edit` or `gh pr create` with bodies containing backticks, always use a heredoc to prevent shell interpretation:

```bash
gh pr edit <number> --body "$(cat <<'EOF'
## Summary
Text with `backticks` works fine here
EOF
)"
```

The single quotes around 'EOF' prevent variable and command substitution.

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

### Development TODOs

For all pending development tasks, see @docs/TODOS.md.

#### Key Development Principles

1. **Unified Changes**: Related extension and server changes in same branch
   - Frontend and backend changes that depend on each other ship together
   - Reduces integration bugs and deployment complexity
   - Example: New CRDT operation needs both extension handler and server endpoint

2. **Incremental Progress**: Each branch should be independently mergeable
   - No "big bang" PRs - break work into digestible pieces
   - Each PR should leave the system in a working state
   - Feature flags for gradual rollout of larger changes

3. **Test Everything**: Both sides need comprehensive tests
   - Unit tests for business logic (aim for 80%+ coverage)
   - Integration tests for critical paths (sync, auth, persistence)
   - Manual testing checklist for UI changes
   - Performance benchmarks for changes affecting 200+ tabs

4. **Performance First**: Every change considers 200+ tab scenarios
   - Profile memory usage before and after changes
   - Measure sync latency impact
   - Consider battery life implications
   - Use Web Workers for heavy operations

5. **Clean Architecture**: Apply same patterns to both extension and server
   - Consistent error handling (Result types)
   - Shared domain models via code generation
   - Repository pattern for data access
   - Service layer for business logic

#### Progress Tracking Rules

##### Task Management
- Use `[ ]` for pending, `[x]` for completed tasks
- Break large tasks into subtasks when complexity emerges
- Add discovered work as new tasks rather than expanding existing ones
- Mark tasks complete only when fully done (not partially)

##### Pull Request Workflow
- **Always create a PR when a branch is ready for review**
- Update TODO file as part of each PR that completes tasks
- Include in PR description:
  - Which TODO tasks are addressed
  - Testing performed (automated + manual)
  - Performance impact analysis
  - Screenshots for UI changes

##### Quality Gates
- Run all tests before marking complete (`cargo nextest run` + `pnpm test`)
- Ensure pre-commit hooks pass (`pre-commit run --all-files`)
- Verify no memory leaks introduced (test with 200+ tabs)
- Update relevant documentation (user guides, API docs, comments)

##### Branch Protection
- NEVER push directly to main branch of the remote `origin`
- All changes must go through PR review process
- Squash commits for clean history when merging
- Delete feature branches after merge

### Misc

- AGENTS.md is a symlink to this file for compatibility (used by OpenAI's Codex)
- GEMINI.md is a symlink to this file for compatibility (used by Google's Gemini)
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
