# Tanaka v3 Prototype TODOs

## Git Usage Instructions

### Branch Rules

- **ALWAYS**: Feature branches only, use `git add -p` (not `-A`), get confirmation for destructive ops (rm, restore, reset, rebase)
- **NEVER**: Commit/push to main, use `git add -A`
- **ALL** changes via pull request

### ⚠️ Task Completion = PR Ready

**Workflow:**

```bash
git checkout -b feat/your-task-name

# Work on each item and commit after EACH one
# Example: After completing item a
git add -p
git commit -m "feat: add scrollbar to index.html"

# After completing item b
git add -p
git commit -m "feat: delete tab-search page"

# Continue this pattern for ALL items

# Update TODO file before PR
git add -p prototype/v3/TODOS-V3.md
git commit -m "docs: mark task complete"

git push origin feat/your-task-name
```

**IMPORTANT**: ALWAYS COMMIT after completing EACH lettered item in a task. This creates a clear history and allows for easier rollback if needed.

**PR Requirements:**

1. ✅ All checkboxes complete (no partial PRs)
2. 📝 TODO file updated in your branch
3. 📋 Before merge: Review commits & update PR description
4. 🗑️ After merge: Delete local branch

## Pending Tasks

1. **Branch: `feat/remove-redundant-pages`**

   a. [x] Add a scrollbar to index.html
   b. [x] Delete tab-search
   c. [x] Delete window-details
   d. [x] Check all HTML files for links to removed pages
   e. [x] Update tanaka.js if it references removed pages
   f. [x] Verify no broken references remain
   g. [x] Test all remaining pages still work correctly
   h. [x] Update grid layout in index.html if needed
   i. [x] Use 4 columns in index
   j. [x] Consolidate pages that contain design items, but are not actual pages for the extension, into a single page.
