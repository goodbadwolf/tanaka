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
feat: add websocket support for real-time sync
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
