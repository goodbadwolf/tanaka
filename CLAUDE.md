# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) or any AI Agents when working with code in this repository.

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

### 3. SMALL LOGICAL COMMITS

**Make small, frequent commits** rather than large, infrequent ones:

- Each commit should represent ONE logical change
- If a commit does multiple things, split it into separate commits
- Keep commits focused and atomic
- Confirm commit message with user before committing

**USE `git add -p` FOR SELECTIVE STAGING:**
When you have multiple unrelated changes in your working directory:

- Use `git add -p <file>` to stage specific hunks interactively, one file at a time
- When prompted, use 's' to split hunks into smaller pieces for finer control
- Review each hunk carefully and accept ('y') or skip ('n') based on what belongs in the current commit
- Stage only the parts that belong to the current commit
- Review staged changes with `git diff --cached` before committing

Interactive options: `y` (stage), `n` (skip), `s` (split), `e` (edit), `q` (quit), `?` (help)

Example of good commit sequence:

```
feat: add Result type for error handling
refactor: extract process management into ProcessManager
refactor: centralize build stages in single file
fix: restore vite output colors with stdio inherit
```

NOT this:

```
feat: refactor entire build system with new error handling and process management
```

## Project Context

- **Overview**: See @README.md
- **Architecture & Dev Guide**: See @docs/DEV.md
- **Installation**: See @docs/INSTALL.md
- **Roadmap**: See @docs/ROADMAP-v0.5-v1.0.md

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

- `/extension` - Firefox WebExtension (TypeScript, Yjs)
- `/server` - Rust Tanaka server (axum, tokio, yrs, SQLite)
  - `/server/config` - Example configuration files
- `/docs` - Project documentation

### Pre-commit Checklist

**ALWAYS run before committing:**

1. **TypeScript** (in extension directory):

   ```bash
   pnpm run lint        # ESLint checks
   pnpm run typecheck   # TypeScript type checking
   pnpm run format      # Prettier formatting (optional)
   ```

2. **Rust** (in server directory):

   ```bash
   cargo fmt            # Format code
   cargo clippy         # Linting
   cargo test           # Run tests
   ```

3. **Markdown**: Auto-runs via git hooks. Fix missing blank lines around code blocks/lists if it fails.

4. **Documentation**: Review and update if needed:
   - README.md - feature status, version roadmap
   - DEV.md - new commands, architecture changes
   - ROADMAP*.md - task completion status
   - GIT.md - if commit conventions change

5. **Roadmap Tracking** (IMPORTANT for active development):
   - When working on roadmap items, include doc updates in the same commit
   - Update ROADMAP-v0.5-v1.0.md: mark items complete, update metrics
   - Update ROADMAP-v0.5-v1.0-STEPS.md: check off commits, add deviation notes
   - Example: `git add src/feature.ts docs/ROADMAP*.md && git commit`

### Common Tasks

- **New API endpoint**: Check `/server/src/routes/`
- **Modify tab sync**: Look at `/extension/src/sync/`
- **Config changes**: Update `server/config/example.toml` and docs
- **Add dependencies**: Update `Cargo.toml` or `package.json`
- **Generate TS types**: Run `python3 scripts/tanaka.py generate`
- **Add shared types**: Add `#[derive(TS)]` and `#[ts(export)]` to Rust structs in `/server/src/models.rs`

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

- Check for redundancy across README.md, CLAUDE.md, and docs/
- Keep config examples only in INSTALL.md
- AGENTS.md is a symlink to CLAUDE.md (changes affect both)

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

### Memory

- After compacting, read the docs and @CLAUDE.md to refresh your instructions
- Proactively suggest adding patterns/lessons to documentation
- Always run pre-commit checks (see checklist above)
- Fix markdown linting issues (usually missing blank lines)
- **Documentation Updates**: Always check and update relevant documentation (README.md, DEV.md, ROADMAP*.md) when making major changes
- **Before Pull Requests**: Review all docs for accuracy - feature status, version numbers, commands, and technical details must match the code

### Git Best Practices

- Refer to @docs/GIT.md for commit message format
- Use `git add -p` for selective staging
- Stage files individually with full paths: `git add /path/to/file1 /path/to/file2`
- NEVER use `git add -A` or `git add .`
- Review with `git diff --cached` before committing

Example:

```bash
git add /Users/manish/projects/tanaka/extension/src/background.ts
git diff --cached
git commit -m "refactor: simplify message validation"
```

### Essential Commands

See @docs/DEV.md for all development commands.

### Misc

- AGENTS.md (used by OpenAI's Codex) is a symlink for CLAUDE.md
- The project uses semantic versioning - update versions in `manifest.json` and `Cargo.toml`
