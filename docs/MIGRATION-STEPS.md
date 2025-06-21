# Tanaka Extension - Rspack Migration Checklist

This document provides a checklist-based approach for migrating the Tanaka extension from Vite to Rspack while adopting React/Preact for the UI layer.

## 📋 Migration Overview

- **Current State**: Vite + TypeScript + Vanilla JS
- **Target State**: Rspack + TypeScript + React/Preact
- **Estimated Timeline**: 4 weeks
- **Risk Level**: Medium

---

## ✅ Pre-Migration Checklist

### 🔧 Environment Setup
- [x] Ensure Node.js v20+ is installed ✓ (v22.16.0)
- [x] Verify pnpm v8+ is available ✓ (v10.11.0)
- [x] Create feature branch: `git checkout -b feat/rspack-react-migration` ✓
- [x] Run all tests to ensure green state: `pnpm test` ✓ (12 tests passed)
- [x] Document current bundle sizes: `pnpm build:prod && du -sh dist/* > bundle-sizes-before.txt` ✓
- [x] Backup current dist folder: `cp -r dist dist-backup-vite` ✓
- [x] Create rollback tag: `git tag pre-rspack-migration` ✓

### 📊 Metrics to Track
- [x] Record current build time ✓ (184ms)
- [x] Note current bundle sizes ✓ (Total: 160K)
- [x] Document memory usage during build ✓ (captured in metrics file)
- [x] Save performance profile ✓ (saved to pre-migration-metrics.txt)

---

## 📦 Phase 1: Build System Migration

### ❌ Remove Vite (Step 1.1)
```bash
# Run these commands:
pnpm remove vite @vitejs/plugin-react
rm vite.config.ts
echo "# Rspack\n.rspack/\nrspack-bundle-analyzer/" >> .gitignore
```
- [x] Vite dependencies removed ✓
- [x] vite.config.ts deleted ✓
- [x] .gitignore updated ✓

### ➕ Install Rspack (Step 1.2)
```bash
# Core Rspack
pnpm add -D @rspack/cli@^0.5.0 @rspack/core@^0.5.0

# React support
pnpm add -D @rspack/plugin-react-refresh@^0.5.0 react-refresh@^0.14.0
pnpm add -D @rspack/plugin-html@^0.5.0

# Optimization
pnpm add -D @rspack/plugin-bundle-analyzer@^0.5.0

# Preact
pnpm add preact@^10.19.0
pnpm add -D @preact/compat@^17.1.2
pnpm add -D @types/react@^18.2.0 @types/react-dom@^18.2.0

# Dev tools
pnpm add -D concurrently@^8.2.0
```
- [x] Rspack CLI installed ✓ (v0.5.9)
- [x] Rspack core installed ✓ (v0.5.9)
- [x] React/Preact plugins installed ✓
- [x] Preact dependencies added ✓ (v10.26.9)
- [x] Type definitions added ✓
- [x] Dev tools installed ✓ (concurrently already present)

### 🔧 Configure Rspack (Step 1.3)
- [x] Create `rspack.config.ts` file ✓ (created as .cjs)
- [x] Copy configuration from migration guide ✓
- [x] Set up entry points for background, popup, settings ✓
- [x] Configure output paths ✓
- [x] Set up module rules for TypeScript/TSX ✓
- [x] Configure CSS handling ✓
- [x] Add HTML plugins ✓
- [x] Set up environment variables ✓
- [x] Configure code splitting ✓

### 📝 Update Scripts (Step 1.4)
- [x] Create `scripts/rspack-utils.ts` ✓
- [x] Update build stages to use Rspack ✓
- [x] Update dev/watch scripts ✓
- [x] Test build script with: `pnpm build:dev` ✓

### 🔄 Update package.json (Step 1.5)
```json
"scripts": {
  "dev": "BUILD_ENV=development rspack serve",
  "dev:staging": "BUILD_ENV=staging rspack serve",
  "build": "rspack build",
  "build:dev": "BUILD_ENV=development NODE_ENV=production rspack build",
  "build:staging": "BUILD_ENV=staging NODE_ENV=production rspack build",
  "build:prod": "BUILD_ENV=production NODE_ENV=production rspack build",
  "build:all": "tsx scripts/build-rspack.ts",
  "watch": "rspack build --watch",
  "analyze": "RSPACK_BUNDLE_ANALYZE=true rspack build",
  "start": "web-ext run --source-dir dist --firefox-profile=dev-profile --keep-profile-changes",
  "dev:extension": "concurrently \"pnpm watch\" \"pnpm start\""
}
```
- [x] Dev script updated ✓
- [x] Build scripts updated ✓
- [x] Watch script added ✓
- [x] Analyze script added ✓
- [x] Extension run scripts updated ✓

### ✨ Verify Phase 1
- [x] Run `pnpm build:dev` - builds without errors ✓ (108ms)
- [x] Check dist folder structure is correct ✓
- [x] Verify manifest.json is copied ✓
- [x] Confirm icons are copied ✓
- [x] Test loading extension in Firefox ✓ (CSS issue fixed)
- [x] Fix CSS loading issue - added CSS imports to entry files ✓
- [x] Verify CSS files are generated in dist ✓

---

## ⚛️ Phase 2: React/Preact Setup

### 🎯 Create Entry Points (Step 2.1)
- [x] Create `src/popup/popup.tsx` ✓ (renamed from .ts)
- [x] Create `src/settings/settings.tsx` ✓ (renamed from .ts)
- [x] Add React/Preact imports ✓
- [x] Set up hot module replacement ✓ (configured in Rspack)
- [ ] Add development-only debugging

### 🧩 Create Base Components (Step 2.2)
- [x] Create `src/popup/components/` directory ✓
- [x] Create `PopupApp.tsx` component ✓
- [x] Create `WindowTracker.tsx` component ✓
- [x] Create `src/settings/components/` directory ✓
- [x] Create `SettingsApp.tsx` component ✓

### 🪝 Create Custom Hooks (Step 2.3)
- [x] Create `src/popup/hooks/` directory ✓
- [ ] Create `useExtensionState.ts` hook
- [x] Create `useWindowTracking.ts` hook ✓
- [x] Create `src/settings/hooks/` directory ✓
- [x] Create `useSettings.ts` hook ✓

### 📄 Update HTML Templates
- [x] Update `src/popup/popup.html` - add `<div id="root"></div>` ✓
- [x] Update `src/settings/settings.html` - add `<div id="root"></div>` ✓
- [x] Remove inline scripts ✓
- [x] Update meta tags ✓

### ✨ Verify Phase 2
- [x] Popup loads with React component ✓ (Preact)
- [x] Settings page loads with React component ✓ (Preact)
- [x] Hot reload works in development ✓
- [ ] No console errors
- [x] Build time improved: 118ms (36% faster than Vite) ✓

---

## 🔄 Phase 3: Component Migration

### 📝 Migration Planning
- [ ] List all existing UI components
- [ ] Prioritize migration order
- [ ] Create migration branches for each component
- [ ] Set up feature flags if needed

### 🎯 Popup Components
- [ ] ❏ Migrate WindowTracker
  - [ ] Create React version
  - [ ] Add tests
  - [ ] Remove vanilla JS version
- [ ] ❏ Migrate StatusIndicator
  - [ ] Create React version
  - [ ] Add tests
  - [ ] Remove vanilla JS version
- [ ] ❏ Migrate SettingsLink
  - [ ] Create React version
  - [ ] Add tests
  - [ ] Remove vanilla JS version

### ⚙️ Settings Components
- [ ] ❏ Migrate AuthForm
  - [ ] Create React version
  - [ ] Add form validation
  - [ ] Add tests
  - [ ] Remove vanilla JS version
- [ ] ❏ Migrate ServerInfo
  - [ ] Create React version
  - [ ] Add loading states
  - [ ] Add tests
  - [ ] Remove vanilla JS version
- [ ] ❏ Migrate AboutSection
  - [ ] Create React version
  - [ ] Add tests
  - [ ] Remove vanilla JS version

### 🔗 Shared Components
- [ ] Create `src/components/` directory
- [ ] ❏ Create Button component
- [ ] ❏ Create Input component
- [ ] ❏ Create LoadingSpinner component
- [ ] ❏ Create ErrorMessage component
- [ ] ❏ Create Card component

### 🏪 State Management
- [ ] Install Preact Signals: `pnpm add @preact/signals`
- [ ] Create `src/store/` directory
- [ ] Create `ExtensionStore.ts`
- [ ] Migrate window tracking state
- [ ] Migrate user settings state
- [ ] Add state persistence

### ✨ Verify Phase 3
- [ ] All components migrated
- [ ] All tests passing
- [ ] No vanilla JS UI code remaining
- [ ] State management working

---

## 🚀 Phase 4: Performance Optimization

### 📊 Code Splitting
- [ ] Configure vendor chunks
- [ ] Set up Yjs in separate chunk
- [ ] Configure Preact in separate chunk
- [ ] Set up shared UI components chunk
- [ ] Verify chunk sizes are reasonable

### ⚡ Lazy Loading
- [ ] Identify heavy components
- [ ] Implement lazy loading for settings
- [ ] Add loading boundaries
- [ ] Test lazy loading in extension context

### 📈 Performance Monitoring
- [ ] Add performance measurement utilities
- [ ] Set up component profiling
- [ ] Add build time tracking
- [ ] Configure bundle analyzer

### 🎯 Bundle Optimization
- [ ] Enable tree shaking
- [ ] Configure minification
- [ ] Set up source maps for production
- [ ] Optimize asset loading

### ✨ Verify Phase 4
- [ ] Bundle size reduced compared to baseline
- [ ] Build time acceptable (< 10s)
- [ ] No performance regressions
- [ ] Code splitting working correctly

---

## 🧪 Phase 5: Testing & Quality

### 🔧 Test Configuration
- [ ] Update `vitest.config.ts` for Preact
- [ ] Add React Testing Library
- [ ] Configure coverage reporting
- [ ] Set up test utilities

### ✅ Unit Tests
- [ ] ❏ Test all hooks
- [ ] ❏ Test all components
- [ ] ❏ Test state management
- [ ] ❏ Test utilities
- [ ] ❏ Achieve 80%+ coverage

### 🔗 Integration Tests
- [ ] Set up Playwright
- [ ] Test popup interactions
- [ ] Test settings page
- [ ] Test background script communication
- [ ] Test cross-component state

### 🔍 E2E Tests
- [ ] Test full extension flow
- [ ] Test in Firefox
- [ ] Test in Chrome (if applicable)
- [ ] Test error scenarios

### ✨ Verify Phase 5
- [ ] All tests passing
- [ ] Coverage meets targets
- [ ] No flaky tests
- [ ] CI/CD pipeline green

---

## 🏁 Phase 6: Production Ready

### 📊 Performance Validation
- [ ] Run bundle analyzer: `pnpm analyze`
- [ ] Compare bundle sizes with baseline
- [ ] Run build benchmarks
- [ ] Profile runtime performance

### 🔒 Security Audit
- [ ] Run `pnpm audit`
- [ ] Check for CSP violations
- [ ] Verify no eval() usage
- [ ] Review permissions

### 📝 Documentation
- [ ] Update README.md
- [ ] Update developer guide
- [ ] Document new build process
- [ ] Add component documentation
- [ ] Update CHANGELOG.md

### 🚀 CI/CD Updates
- [ ] Update GitHub Actions workflow
- [ ] Add Rspack build steps
- [ ] Update test commands
- [ ] Add bundle size checks
- [ ] Configure artifact uploads

### 🎯 Final Checklist
- [ ] All phases completed
- [ ] No regression bugs
- [ ] Performance targets met
- [ ] Documentation complete
- [ ] Team sign-off received

---

## 🔄 Rollback Procedures

### 🚨 Emergency Rollback
```bash
# If critical issues found:
git checkout main
git branch -D feat/rspack-react-migration
git checkout pre-rspack-migration -- .
pnpm install
pnpm build:prod
```

### 🔧 Partial Rollback
- [ ] Identify failing components
- [ ] Revert specific components to vanilla JS
- [ ] Keep Rspack, rollback React only
- [ ] Document issues for future retry

---

## 🐛 Quick Troubleshooting

### Common Issues & Solutions

| Issue | Solution | Checked |
|-------|----------|---------|
| HMR not working | Ensure `writeToDisk: true` in devServer | [ ] |
| CSP violations | Set `runtimeChunk: false` | [ ] |
| React DevTools missing | Add `preact/debug` in dev | [ ] |
| Build too slow | Check for circular dependencies | [ ] |
| Extension won't load | Verify manifest.json paths | [ ] |
| Styles not loading | Check CSS loader config | [ ] |

---

## 📊 Success Metrics

### Target Metrics
- [ ] Build time < 10 seconds
- [ ] Bundle size < 500KB total
- [ ] Popup load time < 100ms
- [ ] Zero runtime errors
- [ ] 80%+ test coverage

### Actual Results
- Build time: _____ seconds
- Bundle size: _____ KB
- Popup load: _____ ms
- Runtime errors: _____
- Test coverage: _____%

---

## 🎉 Completion

### Sign-offs
- [ ] Development team approval
- [ ] QA validation complete
- [ ] Performance benchmarks passed
- [ ] Security review passed
- [ ] Documentation reviewed

### Post-Migration
- [ ] Monitor error rates for 1 week
- [ ] Gather performance metrics
- [ ] Document lessons learned
- [ ] Plan next improvements
- [ ] Celebrate! 🎊

---

## 📚 Resources

- [Rspack Docs](https://www.rspack.dev/)
- [Preact Docs](https://preactjs.com/)
- [WebExtensions MDN](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Migration Guide](./MIGRATION.md)
- [Original PR](#) ← Add PR link here

---

**Last Updated**: _____  
**Migration Lead**: _____  
**Status**: ⏳ In Progress