# Migration Plan: Husky to pre-commit

This document tracks the migration from Husky to pre-commit for the Tanaka project.

**Branch**: `feat/migrate-to-precommit`  
**Started**: 2025-01-26  
**Status**: 🟡 In Progress  

---

## 🎯 Goals

1. Replace Husky with pre-commit while maintaining all current functionality
2. Preserve performance optimizations (parallel execution, quick mode)
3. Maintain auto-fix capabilities
4. Keep the development experience smooth
5. Ensure CI/CD integration

---

## 📋 Pre-Migration Analysis

### Current Husky Setup

- **Pre-commit hook**: 7 language-specific checkers (TypeScript, Rust, Python, Shell, Markdown, Documentation, Roadmap)
- **Commit-msg hook**: Conventional commit format validation
- **Features**: Parallel execution, quick mode, auto-fix, color output, emergency bypass
- **Performance**: Optimized with concurrent checks

### Tools Currently Checked

| Language | Tools | Auto-fix |
|----------|-------|----------|
| TypeScript | ESLint, TypeScript compiler | ✅ ESLint |
| Rust | rustfmt, clippy | ✅ rustfmt |
| Python | ruff (lint + format) | ✅ ruff |
| Shell | shellcheck, shfmt | ✅ shfmt |
| Markdown | markdownlint | ✅ |
| Documentation | Custom consistency checks | ❌ |
| Roadmap | Custom reminder checks | ❌ |

---

## ✅ Work Completed So Far

1. Created new branch: `feat/migrate-to-precommit`
2. Created migration plan document
3. Created `.pre-commit-config.yaml` with all hooks translated
4. Created Python scripts for custom checks:
   - `scripts/pre_commit/check_documentation.py`
   - `scripts/pre_commit/roadmap_reminder.py`
   - `scripts/pre_commit/quick_mode.py`
5. Created `.cz.toml` for commit message validation
6. Added pre-commit to `pyproject.toml` dependencies
7. Created test script: `scripts/test_precommit_migration.sh`

## 🚀 Migration Steps

### Phase 1: Setup & Preparation

- [ ] **1.1 Snapshot Current State**
  ```bash
  git tag husky-backup-2025-01-26
  git push origin husky-backup-2025-01-26
  ```

- [ ] **1.2 Document Current Hook Behavior**
  - [ ] Create test cases for each checker
  - [ ] Document expected failures and fixes
  - [ ] Note performance benchmarks

- [ ] **1.3 Install pre-commit**
  - [ ] Add to pyproject.toml dev dependencies
  - [ ] Install locally: `pip install pre-commit`
  - [ ] Verify installation: `pre-commit --version`

### Phase 2: Create pre-commit Configuration

- [ ] **2.1 Create Base Configuration**
  - [ ] Create `.pre-commit-config.yaml`
  - [ ] Set up basic structure with language groups

- [ ] **2.2 Translate TypeScript Checks**
  - [ ] ESLint hook (with auto-fix)
  - [ ] TypeScript compiler check
  - [ ] Test with sample files

- [ ] **2.3 Translate Rust Checks**
  - [ ] rustfmt hook
  - [ ] clippy hook
  - [ ] Cargo test hook (if in quick mode)

- [ ] **2.4 Translate Python Checks**
  - [ ] ruff format hook
  - [ ] ruff lint hook (with auto-fix)
  - [ ] Test with existing Python files

- [ ] **2.5 Translate Shell Checks**
  - [ ] shellcheck hook
  - [ ] shfmt hook (with auto-fix)

- [ ] **2.6 Translate Markdown Checks**
  - [ ] markdownlint hook (with auto-fix)
  - [ ] Configure `.markdownlint.json` if needed

- [ ] **2.7 Create Custom Hooks**
  - [ ] Documentation consistency checker (Python script)
  - [ ] Roadmap reminder checker (Python script)
  - [ ] Migrate logic from shell to Python

- [ ] **2.8 Handle Commit Message Validation**
  - [ ] Keep Husky commit-msg hook temporarily
  - [ ] OR: Create commitizen integration
  - [ ] OR: Use commitlint pre-commit hook

### Phase 3: Feature Parity

- [ ] **3.1 Implement Quick Mode**
  - [ ] Create environment variable handling
  - [ ] Skip expensive checks in quick mode
  - [ ] Document usage

- [ ] **3.2 Preserve Auto-fix Behavior**
  - [ ] Ensure all fixable hooks have `--fix` flags
  - [ ] Test auto-staging of fixed files
  - [ ] Verify no conflicts with git staging

- [ ] **3.3 Add Performance Optimizations**
  - [ ] Configure concurrent hook execution
  - [ ] Set appropriate `pass_filenames` settings
  - [ ] Optimize file filtering patterns

- [ ] **3.4 Emergency Bypass Options**
  - [ ] Document `--no-verify` usage
  - [ ] Add `SKIP` environment variable support
  - [ ] Create bypass instructions

### Phase 4: Testing & Validation

- [ ] **4.1 Side-by-Side Testing**
  - [ ] Run both Husky and pre-commit on same changes
  - [ ] Compare outputs and timing
  - [ ] Verify all checks are caught

- [ ] **4.2 Performance Testing**
  - [ ] Benchmark with 1 file change
  - [ ] Benchmark with 10+ file changes
  - [ ] Compare with Husky baseline

- [ ] **4.3 Edge Case Testing**
  - [ ] Test with merge commits
  - [ ] Test with large files
  - [ ] Test with binary files
  - [ ] Test quick mode

- [ ] **4.4 Auto-fix Validation**
  - [ ] Stage files with known issues
  - [ ] Verify auto-fix works correctly
  - [ ] Check git staging behavior

### Phase 5: CI/CD Integration

- [x] **5.1 Add CI Workflow**
  - [x] Create `.github/workflows/pre-commit.yml`
  - [x] Run on all PRs
  - [x] Cache pre-commit environments

- [x] **5.2 Configure pre-commit.ci (Optional)**
  - [x] Enable for auto-fixing PRs
  - [x] Configure update schedule
  - [x] Set appropriate permissions

### Phase 6: Migration Execution

- [ ] **6.1 Install pre-commit Hooks**
  ```bash
  pre-commit install
  pre-commit install --hook-type commit-msg  # if using commitizen
  ```

- [ ] **6.2 Remove Husky**
  - [ ] Delete `.husky` directory
  - [ ] Remove husky from package.json (if present)
  - [ ] Remove any husky install scripts

- [ ] **6.3 Update Documentation**
  - [ ] Update DEV.md with new setup instructions
  - [ ] Update CLAUDE.md pre-commit checklist
  - [ ] Update GIT.md with new hook information
  - [ ] Add troubleshooting guide

- [ ] **6.4 Communicate Changes**
  - [ ] Update setup scripts (`tanaka.py`)
  - [ ] Add migration notes to commit message
  - [ ] Create before/after comparison

### Phase 7: Post-Migration

- [ ] **7.1 Monitor & Adjust**
  - [ ] Track any issues in first week
  - [ ] Adjust hook configuration as needed
  - [ ] Gather performance metrics

- [ ] **7.2 Cleanup**
  - [ ] Remove husky backup tag after 1 month
  - [ ] Archive this migration document
  - [ ] Remove any transition code

---

## 📊 Success Criteria

- [ ] All current checks are replicated in pre-commit
- [ ] Performance is equal or better than Husky
- [ ] Auto-fix functionality works seamlessly
- [ ] Quick mode is available and documented
- [ ] CI integration is working
- [ ] Documentation is updated
- [ ] Developer experience is improved

---

## 🔧 Troubleshooting Guide

### Common Issues

1. **Hooks not running**
   - Verify: `pre-commit install`
   - Check: `.git/hooks/pre-commit` exists

2. **Auto-fix not working**
   - Ensure hook has `args: [--fix]` or similar
   - Check `pass_filenames` setting

3. **Performance issues**
   - Use `require_serial: false` for parallel execution
   - Limit file patterns appropriately

4. **Python not found**
   - Ensure Python is in PATH
   - Consider using `language: system` for some hooks

---

## 📝 Notes

- Since you're the only developer, we can be more aggressive with the migration
- Consider keeping both systems briefly for comparison
- Focus on maintaining the excellent developer experience you've built

---

## 🔗 Resources

- [pre-commit documentation](https://pre-commit.com/)
- [Available hooks](https://pre-commit.com/hooks.html)
- [Creating custom hooks](https://pre-commit.com/#creating-new-hooks)

---

## 🎯 Immediate Next Steps

1. **Install pre-commit and dependencies**:
   ```bash
   uv sync --dev
   # or
   pip install pre-commit commitizen
   ```

2. **Test the configuration**:
   ```bash
   pre-commit validate-config
   pre-commit run --all-files
   ```

3. **Run the test script**:
   ```bash
   ./scripts/test_precommit_migration.sh
   ```

4. **Install hooks when satisfied**:
   ```bash
   pre-commit install
   pre-commit install --hook-type commit-msg
   ```

5. **Test with a real commit**:
   ```bash
   # Make a small change
   echo "# Test" >> README.md
   git add README.md
   git commit -m "test: validate pre-commit hooks"
   ```

6. **Compare with Husky**:
   - Run timing tests
   - Verify all checks work
   - Test quick mode: `PRE_COMMIT_QUICK=1 git commit`

7. **When ready, remove Husky**:
   ```bash
   rm -rf .husky
   git add -A
   git commit -m "chore: migrate from husky to pre-commit"
   ```
