# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) or any AI Agents when working with code in this repository.

## CRITICAL RULES - MUST FOLLOW

### 1. NO UNNECESSARY COMMENTS

**DO NOT ADD COMMENTS** unless the code is genuinely unclear or complex. Most code should be self-documenting through good naming and structure.

**BAD examples (DO NOT DO THIS):**

```javascript
// Start the server
server.start();

// Log error message
logger.error("Failed to connect");

// Define user interface
interface User {
  name: string;
}

// Check if user exists
if (userExists) {
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
- Confirm commit message with user before commiting

**USE `git add -p` FOR SELECTIVE STAGING:**
When you have multiple unrelated changes in your working directory:

- Use `git add -p <file>` to stage specific hunks interactively, one file at a time
- When prompted, use 's' to split hunks into smaller pieces for finer control
- Review each hunk carefully and accept ('y') or skip ('n') based on what belongs in the current commit
- This allows you to separate mixed changes into logical commits
- Stage only the parts that belong to the current commit
- Review staged changes with `git diff --cached` before committing

Interactive options:

- `y` - stage this hunk
- `n` - skip this hunk
- `s` - split this hunk into smaller hunks (when available)
- `e` - manually edit the hunk
- `q` - quit (skip remaining hunks)
- `?` - help

Example workflow:

```bash
# Process each file individually
git add -p extension/manifest.json
# Review the diff, press 'y' to accept if it's a single logical change

git add -p extension/src/background.ts
# If the hunk is too large, press 's' to split it
# Then review each smaller hunk and press 'y' or 'n' accordingly

# Review what you've staged so far
git diff --cached

# Commit when you have one logical change staged
git commit -m "fix: improve error handling in data fetcher"

# Continue with next set of changes
git add -p extension/src/background.ts
# Stage the remaining hunks for the next logical change
```

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

## Project Overview

See [@README.md](README.md) for project overview

## Architecture

For architecture, development setup, commands, testing details and practical developer guidance (commands, running the system, configuration, testing, security, and coding style), see [@docs/DEV.md](docs/DEV.md).

## Installation

For installation and setup instructions, see [@docs/INSTALL.md](docs/INSTALL.md).

## AI Agent Guidelines

### Working with this Codebase

- This is a Firefox WebExtension written in TypeScript with a Rust backend server
- The extension uses Yjs for CRDT-based tab synchronization
- Always check existing patterns in neighboring files before implementing new features
- Run `cargo fmt` and `pnpm run lint` before suggesting code changes
- Prefer editing existing files over creating new ones
- When modifying extension code, ensure compatibility with Firefox WebExtension APIs
- TypeScript types are generated from Rust models using ts-rs - import from `types/generated`

### Project Structure

- `/extension` - Firefox WebExtension (TypeScript, Yjs)
- `/server` - Rust Tanaka server (axum, tokio, yrs, SQLite)
  - `/server/config` - Example configuration files
- `/docs` - Project documentation

### Essential Commands

See [@docs/DEV.md](docs/DEV.md#8-essential-commands) for all development commands.

### Code Style

- Always use descriptive variable names, but keep the names sane.
- **CRITICAL: See "NO UNNECESSARY COMMENTS" rule above - most code should have NO comments**

### Documentation and Maintenance

- As part of a commit or major changes to the code, scan the docs and update them based on the changes if necessary
- When updating documentation, ensure README.md reflects any new features or changed behavior
- Keep CLAUDE.md updated with new conventions or frequently used commands

### Testing and Validation

- Always run tests before suggesting code changes: `cargo test` for server, `npm test` for extension
- When fixing bugs, write a test that reproduces the bug first
- When adding features, write tests BEFORE implementation (TDD)
- Update related tests when modifying existing code
- Validate that changes work with both server and extension components

### Documentation Maintenance

- When cleaning up docs, check for redundancy across README.md, CLAUDE.md, and docs/
- Keep configuration examples only in INSTALL.md
- Use `[@path](link name)` syntax for internal markdown links
- Remove `$` prefix from commands for easier copy-paste
- AGENTS.md is a symlink to CLAUDE.md (changes affect both)

### Common String Replacement Issues

- Multi-line replacements often fail due to hidden characters
- For complex deletions, use `sed` instead of Edit tool
- Always verify exact content before attempting replacements
- On macOS, use `od -c` instead of `cat -A` (BSD vs GNU tools)

### Bash Command Best Practices

- Avoid `cd` in bash commands - it fails with "no such file or directory" in subshells
- Use full paths instead: `/Users/manish/projects/tanaka/extension` not just `extension`
- When running pnpm/npm commands, stay in the correct directory context
- File operations (mv, rm, ls) need full paths when not in the expected directory
- Check current working directory context before running commands

### Project Organization

When working with this codebase:

- Keep language/framework-specific files in their respective directories (e.g., extension-related files in `extension/`, server-related files in `server/`)
- Repository-level tools (like git hooks) belong at the repository root
- Run commands from the appropriate directory context based on where the tools are installed
- Always verify file contents after moving or modifying them

### Common Tasks

- To add a new API endpoint: Check existing routes in `/server/src/routes/`
- To modify tab sync behavior: Look at `/extension/src/sync/`
- For configuration changes: Update both `server/config/example.toml` and docs
- When adding dependencies: Update `Cargo.toml` or `package.json` appropriately
- To generate TypeScript types from Rust models: Run `pnpm run gen:api-models`
- To add new shared types: Add `#[derive(TS)]` and `#[ts(export)]` to Rust structs in `/server/src/models.rs`

### Misc

- AGENTS.md (used by OpenAI's Codex) is a symlink for CLAUDE.md (used by Anthropic's Claude)
- The project uses semantic versioning - update versions in `manifest.json` and `Cargo.toml`

### Memory

- After compacting, read the docs and @CLAUDE.md to refresh your instructions.
- When you encounter patterns or lessons that would be helpful to remember, proactively suggest adding them to CLAUDE.md or relevant documentation

### Writing Testable Code

**Core Principles:**

1. **Dependency Injection**
   - Pass dependencies as constructor parameters or function arguments
   - Avoid hardcoded dependencies or global imports within classes
   - This allows easy mocking during tests

   ```typescript
   // Good - dependencies injected
   class SyncManager {
     constructor(private api: TanakaAPI, private tracker: WindowTracker) {}
   }
   
   // Bad - hardcoded dependencies
   class SyncManager {
     private api = new TanakaAPI('https://hardcoded.com');
   }
   ```

2. **Single Responsibility**
   - Each class/function should do ONE thing well
   - Makes tests focused and easier to write
   - If a test needs many mocks, the code might be doing too much

3. **Pure Functions**
   - Prefer pure functions that return values based on inputs
   - Avoid side effects where possible
   - Side effects should be isolated to specific methods

4. **Interface Segregation**
   - Define minimal interfaces for dependencies
   - Test against interfaces, not concrete implementations
   - Makes mocking simpler and tests more maintainable

### Test Development Workflow

**When modifying existing code:**

1. **Run existing tests first** to understand current behavior
2. **Read the tests** before changing code - they document expected behavior
3. **Update tests BEFORE changing implementation** (TDD approach)
4. **Add tests for new behavior** before implementing it
5. **Refactor tests** if the code structure changes significantly

**When adding new features:**

1. **Write interface/API first** - how will this be used?
2. **Write tests for the interface** - what should it do?
3. **Implement the simplest solution** that makes tests pass
4. **Refactor** while keeping tests green
5. **Add edge case tests** after basic functionality works

### Test Quality Guidelines

1. **Test Behavior, Not Implementation**
   - Test WHAT the code does, not HOW it does it
   - Tests shouldn't break when refactoring internals
   - Focus on public APIs and observable behavior

2. **Use Descriptive Test Names**

   ```typescript
   // Good
   it('should return error when API responds with 500')
   
   // Bad  
   it('should handle errors')
   ```

3. **Arrange-Act-Assert Pattern**

   ```typescript
   it('should track window when TRACK_WINDOW message received', () => {
     // Arrange
     const windowId = 123;
     const message = { type: 'TRACK_WINDOW', windowId };
     
     // Act
     const result = messageHandler.handleMessage(message);
     
     // Assert
     expect(mockTracker.track).toHaveBeenCalledWith(windowId);
     expect(result).toEqual({ success: true });
   });
   ```

4. **Keep Tests Independent**
   - Each test should be able to run in isolation
   - Don't rely on test execution order
   - Clean up state in beforeEach/afterEach

5. **Test Edge Cases**
   - Null/undefined inputs
   - Empty arrays/objects
   - Error conditions
   - Boundary values

### Code Design for Testability

1. **Constructor Injection Pattern**

   ```typescript
   // Testable design
   class BackgroundService {
     constructor(
       private api: TanakaAPI,
       private windowTracker: WindowTracker,
       private syncManager: SyncManager
     ) {}
   }
   
   // In tests
   const mockApi = createMockApi();
   const service = new BackgroundService(mockApi, mockTracker, mockManager);
   ```

2. **Factory Functions**
   - Use factories to create complex objects
   - Makes it easy to create test doubles
   - Centralizes object creation logic

3. **Avoid Static Methods**
   - Static methods are hard to mock
   - Use instance methods or pure functions instead

4. **Return Early, Fail Fast**
   - Validate inputs at the beginning
   - Makes error cases easier to test
   - Reduces nested logic complexity

### When NOT to Test

1. **Third-party library internals** - Trust they work
2. **Simple getters/setters** - Unless they have logic
3. **Framework glue code** - Focus on your business logic
4. **Console.log statements** - Mock console in tests
5. **Private methods directly** - Test through public API

### Test Maintenance

1. **Update tests when requirements change** - Tests are living documentation
2. **Delete obsolete tests** - Don't keep tests for deleted features
3. **Refactor tests** - Apply same quality standards as production code
4. **Review test coverage** - But don't chase 100% blindly
5. **Run tests before committing** - Always ensure tests pass

### Red-Green-Refactor Cycle

1. **Red**: Write a failing test for new functionality
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve the code while keeping tests green
4. **Repeat**: Continue for next piece of functionality

### Git Workflow

Refer to [@docs/GIT.md](docs/GIT.md) for git workflow guidelines

### Git Staging Best Practices

**NEVER use `git add -A` or `git add .`** - these commands can stage unrelated changes accidentally.

Instead:

- Stage files individually with their full paths: `git add /path/to/file1 /path/to/file2`
- Use `git add -p <file>` for selective staging when you have mixed changes
- Always review staged changes with `git diff --cached` before committing

**Good example:**

```bash
# Stage specific files
git add /Users/manish/projects/tanaka/extension/src/background.ts
git add /Users/manish/projects/tanaka/extension/src/core.ts

# Review what's staged
git diff --cached

# Then commit
git commit -m "refactor: simplify message validation"
```

**Bad example:**

```bash
# DON'T DO THIS - stages everything including unintended files
git add -A
git commit -m "refactor: simplify message validation"
```
