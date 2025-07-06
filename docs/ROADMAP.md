# Tanaka Development Roadmap

This roadmap tracks all pending work for the Tanaka project.

## 🎯 Current Status

- **Extension**: 85%+ test coverage, React/Preact UI, CRDT Web Worker, full permission management
- **Server**: Clean architecture with repositories, services, error handling, CRDT sync, complete security hardening

**🎉 MILESTONE**: All critical bugs fixed! Multi-device synchronization is fully functional.

--

## 📝 Progress Tracking Rules

- Use `[ ]` for pending, `[x]` for completed
- Update this file as part of each PR
- Each branch should result in working software
- Run all tests before marking complete
- **Always create a PR when a branch is ready for review**
- Include comprehensive testing and documentation in each PR
- NEVER push directly to main branch of the remote `origin`

---

## 📋 Pending Tasks

All work to be completed.

### Documentation

#### 📝 Branch: `docs/operational-basics`

**Basic Documentation**

- [ ] Write simple deployment steps
- [ ] Document backup/restore process
- [ ] List common issues and fixes

### Baseline Measurements

#### 📊 Branch: `docs/baseline-metrics`

**Establish Baselines**

- [ ] Test with 200+ tabs and note performance
- [ ] Check memory usage patterns
- [ ] Document sync frequency
- [ ] Document why Yjs was chosen for CRDT
- [ ] Document current architecture decisions

### Core Stability

#### 🔧 Branch: `fix/memory-leaks`

**Fix Memory Leaks**

- [ ] Extension: Fix event handler cleanup in TabEventHandler
  - Add cleanup methods for all browser event listeners
  - Clear timers and intervals on dispose
  - Remove listeners for onActivated, windowRemoved events
- [ ] Extension: Fix window tracking memory issues
  - Replace weak references with proper Set<number>
  - Clean up tracked windows on untrack
- [ ] Server: Improve concurrency handling
  - Consider RwLock instead of Mutex for better read performance
- [ ] Tests: Verify no memory growth over extended usage

#### 🚀 Branch: `feat/performance`

**Basic Performance Improvements**

- [ ] Extension: Implement simple operation batching
  - Batch size: 50-100 operations
  - Max wait time: 1 second
  - Deduplicate operations for same tab
- [ ] Extension: Add operation priorities
  - High: close_tab, track/untrack (send immediately)
  - Medium: tab updates (batch with 200ms delay)
  - Low: URL changes (batch with 1s delay)
- [ ] Server: Add database indices
  - Index on (device_id, clock) for sync queries
  - Index on operation_type for filtering
  - Consider partial index for active tabs only
- [ ] Server: Basic SQLite tuning
  - Increase cache size for better performance
  - Use WAL mode (already enabled)
  - VACUUM periodically
- [ ] Tests: Verify handles 200+ tabs smoothly

#### 🔄 Branch: `feat/error-recovery`

**Error Recovery**

- [ ] Extension: Add exponential backoff
  - Start: 1s, max: 60s, multiplier: 2
  - Add small random jitter to prevent thundering herd
  - Reset on successful sync
- [ ] Extension: Implement offline queue
  - Store failed operations in browser.storage.local
  - Limit queue to 1000 operations
  - Retry when connection restored
- [ ] Extension: Handle common failures gracefully
  - Network timeouts
  - Server errors (500s)
  - Auth failures (401s)
- [ ] Server: Add request timeouts
  - Set reasonable timeout (30s) for sync endpoint
  - Return partial results if possible
- [ ] Tests: Verify recovery from network outages

### User Experience

#### 🎨 Branch: `feat/ui-polish`

**UI Improvements**

- [ ] Add dark mode
- [ ] Improve error messages
- [ ] Add loading indicators
- [ ] Test on different screen sizes

#### 🧹 Branch: `feat/code-cleanup`

**Code Quality**

- [ ] Fix TypeScript strict mode issues
- [ ] Increase test coverage to 80%
- [ ] Remove dead code
- [ ] Update dependencies

### Release Preparation

#### 🚀 Branch: `feat/v1-release`

**Release**

- [ ] Submit to Mozilla addon store
- [ ] Create signed release builds
- [ ] Write installation guide
- [ ] Test full user journey
- [ ] Tag v1.0 release

---

## 🔑 Key Principles

1. **Unified Changes**: Related extension and server changes in same branch
2. **Incremental Progress**: Each branch should be independently mergeable
3. **Test Everything**: Both sides need comprehensive tests
4. **Performance First**: Every change considers 200+ tab scenarios
5. **Clean Architecture**: Apply same patterns to both extension and server

---

## ✅ Completion Criteria

- [ ] Basic documentation complete (deployment, backup, common issues)
- [ ] Performance baselines documented
- [ ] No memory growth over 24 hours
- [ ] Handles 200+ tabs smoothly
- [ ] Error recovery implemented
- [ ] Dark mode working
- [ ] 80%+ test coverage
- [ ] All TypeScript errors fixed
- [ ] Submitted to Mozilla addon store
- [ ] Release tagged and ready
