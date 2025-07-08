# Tanaka v3 Prototype TODOs

## Git Usage Instructions

### Branch Rules

- **ALWAYS**: Feature branches only, use `git add -p` (not `-A`), get confirmation for destructive ops
- **NEVER**: Commit/push to main, use `git add -A`
- **ALL** changes via pull request

### ⚠️ Task Completion = PR Ready

**Workflow:**

```bash
git checkout -b feat/your-task-name
# Complete ALL checkboxes [ ] → [x]

git add -p                    # Review & stage changes
git commit -m "feat: ..."     # Feature commits

# Update BOTH TODO files before PR
git add -p docs/TODOS.md prototype/v3/TODOS-V3.md
git commit -m "docs: mark task complete"

git push origin feat/your-task-name
```

**PR Requirements:**

1. ✅ All checkboxes complete (no partial PRs)
2. 📝 Both TODO files updated in your branch
3. 📋 Before merge: Review commits & update PR description
4. 🗑️ After merge: Delete local branch

## Pending Tasks

1. **Branch: `feat/remove-redundant-pages`**

   1. [ ] Add a scrollbar to index.html
   2. [ ] Delete tab-search
   3. [ ] Delete window-details
   4. [ ] Check all HTML files for links to removed pages
   5. [ ] Update tanaka.js if it references removed pages
   6. [ ] Verify no broken references remain
   7. [ ] Test all remaining pages still work correctly
   8. [ ] Update grid layout in index.html if needed
