# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) or any AI Agents when working with code in this repository.

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

### Project Structure

- `/extension` - Firefox WebExtension (TypeScript, Yjs)
- `/server` - Rust Tanaka server (axum, tokio, yrs, SQLite)
  - `/server/config` - Example configuration files
- `/docs` - Project documentation

### Essential Commands

See [@docs/DEV.md](docs/DEV.md#8-essential-commands) for all development commands.

### Code Style

- Always use descriptive variable names, but keep the names sane.
- Only add comments, when necessary, to code when the code is not obvious about what it is doing.
- Do not add comments for simple lines or for lines where it is easy to understand what it is doing.

### Documentation and Maintenance

- As part of a commit or major changes to the code, scan the docs and update them based on the changes if necessary
- When updating documentation, ensure README.md reflects any new features or changed behavior
- Keep CLAUDE.md updated with new conventions or frequently used commands

### Testing and Validation

- Always run tests before suggesting code changes: `cargo test` for server, `pnpm run lint` for extension
- When fixing bugs, check if similar issues exist in related code
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

### Misc

- AGENTS.md (used by OpenAI's Codex) is a symlink for CLAUDE.md (used by Anthropic's Claude)
- The project uses semantic versioning - update versions in `manifest.json` and `Cargo.toml`

### Memory

- After compacting, read the docs and @CLAUDE.md to refresh your instructions.
- When you encounter patterns or lessons that would be helpful to remember, proactively suggest adding them to CLAUDE.md or relevant documentation

### Git Workflow

Refer to [@docs/GIT.md](docs/GIT.md) for git workflow guidelines
