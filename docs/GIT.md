### Git Commit Guidelines

When making commits in this repository, follow these simple conventions:

#### Commit Message Format

```
<type>: <description>

<optional body>
```

#### Types (use your judgment)

- `feat` - New features or functionality
- `fix` - Bug fixes
- `docs` - Documentation changes only
- `refactor` - Code restructuring without changing behavior
- `test` - Adding or fixing tests
- `chore` - Maintenance tasks (dependencies, config, etc.)

#### Guidelines

- Keep the first line under 72 characters
- Use present tense ("Add feature" not "Added feature")
- Don't capitalize the first letter after the type
- Don't end with a period
- Make small, frequent commits rather than large, infrequent ones
- Each commit should represent one logical change
- If a commit does multiple things, consider splitting into separate commits
- If you must combine changes, use the most important type and keep the description focused on the primary change
- Keep commit messages concise - if the title clearly explains the change, skip redundant bullet points
- Don't explain what's obvious from the diff (e.g., "uncommented X" when diff shows commented lines becoming uncommented)
- Focus on the "why" rather than the "what" when adding details
- Use precise, technical verbs: for example "harden" (for security/robustness improvements) over generic "improve"

#### Examples

```
feat: add server-side push events for real-time sync
fix: prevent duplicate tab creation on fast clicks
docs: update installation instructions for macOS
refactor: extract sync logic into separate module
test: add integration tests for tab merging
chore: update dependencies to latest versions
```

#### When in doubt

- Focus on clarity over convention
- A clear message without a type is better than a confusing typed message
- For mixed changes, pick the primary purpose
- Don't stress about edge cases - just be consistent

#### Staging Changes Selectively

When you have multiple unrelated changes in your working directory:

```bash
# Stage specific hunks interactively
git add -p <file>

# Stage entire files selectively
git add <file1> <file2>

# Review what's staged before committing
git diff --cached
```

Use `git add -p` (patch mode) to:

- Stage only specific parts of a file
- Split large changes into logical commits
- Keep commits focused on one change

### Pre-commit Hooks

This repository uses automated pre-commit hooks to ensure code quality. The hooks run various linters and formatters before each commit.

#### Features

- **Parallel Execution**: Linters run concurrently by default for better performance (30-70% faster)
- **Quick Mode**: Skip expensive checks for rapid iteration with `PRE_COMMIT_QUICK=1`
- **Auto-formatting**: Automatically fixes many issues (formatting, import ordering)
- **Multi-language Support**: TypeScript, Rust, Python, Markdown, and Shell scripts
- **Emergency Bypass**: Multiple options for urgent commits

#### Usage

```bash
# Normal commit (runs all checks in parallel)
git commit

# Quick mode (syntax checks only)
PRE_COMMIT_QUICK=1 git commit

# Force sequential execution
PRE_COMMIT_SEQUENTIAL=1 git commit

# Skip hooks entirely (emergency use only)
git commit --no-verify

# Persistent bypass (remove to re-enable)
touch .git/BYPASS_PRECOMMIT
git commit
rm .git/BYPASS_PRECOMMIT
```

#### Performance Tips

- The hooks warn when linting more than 20 files
- Use quick mode for rapid iteration during development
- Auto-fixes are applied and staged automatically
- Review changes with `git diff --cached` after auto-fixes

#### Troubleshooting

If pre-commit fails:

1. **Review the error messages** - they include specific commands to fix issues
2. **Check staged changes**: `git diff --cached`
3. **Check unstaged changes**: `git diff`
4. **Reset if needed**: `git reset` to unstage and review manually

#### Required Tools

Most tools are installed automatically, but for shell script linting:

```bash
# macOS
brew install shellcheck shfmt

# Linux
apt-get install shellcheck
go install mvdan.cc/sh/v3/cmd/shfmt@latest
```
