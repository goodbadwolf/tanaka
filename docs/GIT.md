# Git Guidelines

## Git Commit Guidelines

When making commits in this repository, follow these simple conventions:

### Commit Message Format

```text
<type>: <description>

<optional body>
```

### Types (use your judgment)

- `feat` - New features or functionality
- `fix` - Bug fixes
- `docs` - Documentation changes only
- `refactor` - Code restructuring without changing behavior
- `test` - Adding or fixing tests
- `chore` - Maintenance tasks (dependencies, config, etc.)

### Guidelines

- Keep the first line under 72 characters
- Use present tense ("Add feature" not "Added feature")
- Don't capitalize the first letter after the type
- Don't end with a period
- Make small, frequent commits rather than large, infrequent ones
- Each commit should represent one logical change
- If a commit does multiple things, consider splitting into separate commits
- If you must combine changes, use the most important type and keep the description focused on the primary change
- Keep commit messages concise - if the title clearly explains the change,
  skip redundant bullet points
- Don't explain what's obvious from the diff (e.g., "uncommented X" when
  diff shows commented lines becoming uncommented)
- Focus on the "why" rather than the "what" when adding details
- Use precise, technical verbs: for example "harden" (for
  security/robustness improvements) over generic "improve"

### Examples

```text
feat: add server-side push events for real-time sync
fix: prevent duplicate tab creation on fast clicks
docs: update installation instructions for macOS
refactor: extract sync logic into separate module
test: add integration tests for tab merging
chore: update dependencies to latest versions
```

### When in doubt

- Focus on clarity over convention
- A clear message without a type is better than a confusing typed message
- For mixed changes, pick the primary purpose
- Don't stress about edge cases - just be consistent

### Staging Changes Selectively

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

## Pre-commit Hooks

This repository uses the [pre-commit](https://pre-commit.com/) framework to ensure code quality. The hooks run various linters and formatters before each commit.

### Features

- **Auto-formatting**: Automatically fixes many issues (formatting, import ordering)
- **Multi-language Support**: TypeScript, Rust, Python, Markdown, and Shell scripts
- **Commit Message Validation**: Ensures conventional commit format
- **Custom Checks**: Documentation and roadmap reminders
- **Emergency Bypass**: Skip hooks when needed

### Usage

```bash
# Normal commit (runs all checks)
git commit

# Skip hooks entirely (emergency use only)
git commit --no-verify

# Skip specific hooks
SKIP=hook-id git commit
```

### Installation

```bash
# Install pre-commit

# Option 1: Using pip (traditional)
pip install pre-commit

# Option 2: Using uv (faster, recommended)
# If you don't have uv: pip install uv
uv sync --dev  # Installs all dev dependencies including pre-commit

# Install the git hooks
pre-commit install
pre-commit install --hook-type commit-msg
```

### Running Manually

```bash
# Run on all files
pre-commit run --all-files

# Run specific hook
pre-commit run <hook-id>

# Update hook versions
pre-commit autoupdate
```

### Troubleshooting

If pre-commit fails:

1. **Review the error messages** - they show what needs to be fixed
2. **Check staged changes**: `git diff --cached`
3. **Check unstaged changes**: `git diff`
4. **Reset if needed**: `git reset` to unstage and review manually

### Configuration

The hooks are configured in `.pre-commit-config.yaml`. Each hook can:

- Auto-fix issues (formatting, trailing whitespace)
- Check for problems (linting, type checking)
- Validate files (YAML, JSON, TOML)
- Run custom checks (documentation reminders)

### Required Tools

All tools are installed automatically via the setup script:

```bash
# Install all shell linting tools
uv run scripts/tanaka.py setup-dev --include shellcheck shfmt

# Or install all development dependencies including shell tools
uv run scripts/tanaka.py setup-dev
```

Manual installation (if needed):

```bash
# macOS
brew install shellcheck shfmt

# Linux
apt-get install shellcheck
go install mvdan.cc/sh/v3/cmd/shfmt@latest
```
