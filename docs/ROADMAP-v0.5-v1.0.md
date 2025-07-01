# Tanaka Development Roadmap (v0.5 - v1.0)

This document tracks the detailed implementation tasks for Tanaka v0.5 (Core Functionality) and v1.0 (First Stable Release).

> **Note**: v0.5.0 was released on 2024-12-16 with core functionality (CRDT sync, auth, window tracking). The remaining UI enhancements listed below continue as v0.5.1 development.

## 📋 Roadmap Overview

### Current Status

- **Active**: Performance Optimization (Phase 5 of v0.5)
- **Completed**: Component Migration, State Management, Test Infrastructure
- **Next**: E2E Testing, Production Readiness
- **Current Version**: v0.5.0

---

## 🚀 Part 1: v0.5 - Modern UI Migration (Active)

Migrating the extension from Vite to Rspack with React/Preact UI components. The `feat/rspack-react-migration` branch was merged in PR #13.

- **Build Performance**: 118ms (36% faster than Vite)

### 🔄 Component Migration

- [x] Create shared component library ✅
  - [x] Button, Input, LoadingSpinner components
  - [x] ErrorMessage, Card components
- [x] Implement state management with Preact Signals ✅
- [x] Add component tests
- [ ] Remove remaining vanilla JS UI code

### 📊 Performance Optimization

- [x] Implement lazy loading for settings ✅
- [x] Add performance monitoring utilities ✅
- [x] Enable tree shaking and minification ✅
- [x] Run bundle analyzer and optimize ✅

### 🧪 Testing & Quality

- [ ] Configure React Testing Library
- [ ] Write unit tests for all components/hooks
- [ ] Set up Playwright for integration tests
- [x] Achieve 80%+ test coverage ✅ (86.8% achieved in PR #22)
- [ ] Add E2E tests for full extension flow

### 🏁 Production Ready

- [ ] Performance validation against baseline
- [ ] Security audit (CSP, permissions)
- [ ] Update documentation
- [ ] Update CI/CD pipeline
- [ ] Final QA and sign-off

### Success Metrics

| Metric        | Target  | Current  |
| ------------- | ------- | -------- |
| Build time    | < 10s   | 0.118s ✓ |
| Bundle size   | < 500KB | 88.2KB ✓ |
| Popup load    | < 100ms | TBD      |
| Test coverage | 80%+    | 86.8% ✓  |

### Troubleshooting Guide

| Issue                  | Solution                                        |
| ---------------------- | ----------------------------------------------- |
| HMR not working        | Ensure `writeToDisk: true` in devServer config  |
| CSP violations         | Set `runtimeChunk: false` in rspack.config      |
| React DevTools missing | Add `preact/debug` in development               |
| Build too slow         | Check for circular dependencies                 |
| Extension won't load   | Verify manifest.json paths match dist structure |
| Styles not loading     | Check CSS imports in entry files                |

---

## 🏗️ Part 2: v1.0 - Clean Architecture & Performance (Planned)

Implementing core business models and clean architecture to solve type confusion, improve maintainability, and optimize for 200+ tabs.

### Problem Statement

- Tab type confusion (3 different "Tab" types)
- Missing business model layer
- Performance issues with 200+ tabs
- Poor testability due to tight coupling

### Implementation Phases

#### Step 1: DI Tokens and Core Models

- [ ] Create Symbol-based DI tokens
- [ ] Define Tab, Window, Settings models
- [ ] Add memoized validation for performance
- [ ] Implement business logic methods
- [ ] Write container health check tests

**Key Code Pattern:**

```typescript
// DI tokens to prevent collisions
export const TOKENS = {
  TanakaAPI: Symbol.for("ITanakaAPI"),
  TabRepository: Symbol.for("ITabRepository"),
} as const;

// Memoized validation for performance
export const parseTab = memoize(
  (data: unknown): Tab | null => {
    if (process.env.NODE_ENV === "production") {
      return data as Tab; // Skip validation in prod
    }
    const result = TabSchema.safeParse(data);
    return result.success ? result.data : null;
  },
  (data: any) => `${data.id}-${data.updatedAt}`
);
```

#### Step 2: Browser Anti-Corruption Layer

- [ ] Create browser mappers with compatibility fallbacks
- [ ] Update Browser class to use core models internally
- [ ] Ensure BrowserTab never leaves browser/ directory
- [ ] Add ESLint rules for boundary enforcement

#### Step 3: API Layer with Schema Evolution

- [ ] Move generated types to proper directory
- [ ] Create mappers with schema versioning
- [ ] Add error handling for data corruption
- [ ] Write contract tests for conversions

#### Step 4: Repository Pattern

- [ ] Create repository interfaces
- [ ] Implement concurrency control with Mutex
- [ ] Add performance instrumentation
- [ ] Register with Symbol tokens in DI

#### Step 5: Service Refactoring

- [ ] Update services to use Symbol tokens
- [ ] Create interfaces for all major services
- [ ] Add mock and offline implementations
- [ ] Implement observability

#### Step 6: Comprehensive Testing

- [ ] Container health checks
- [ ] Mapper contract tests
- [ ] Repository concurrency tests
- [ ] Performance benchmarks

### Key Improvements

1. **Type Safety**: Symbol-based DI tokens prevent collisions
2. **Performance**: Memoized validation, conditional parsing in production
3. **Schema Evolution**: Version-aware data migration
4. **Testing**: Mock implementations for offline development
5. **Observability**: Built-in performance monitoring
6. **Browser Compatibility**: Graceful fallbacks for missing APIs

---

## 📅 Timeline

### Q1 2025 (Current)

- Complete Rspack/React migration
- Begin Clean Architecture implementation
- Release v0.5 with core functionality

### Q2 2025

- Complete Clean Architecture refactor
- Add comprehensive test coverage
- Performance optimization for 200+ tabs
- Release v1.0 stable

### Future

- Scroll position sync
- Cross-browser support
- P2P sync capabilities

---

## 🔗 Related Documents

- **Product Roadmap**: See [@README.md](../README.md#-roadmap) for version-based features
- **Development Guide**: See [@docs/DEV.md](./DEV.md) for build instructions
- **Architecture**: See clean architecture design in Part 2 above

---

**Status**: 🟡 Active Development  
**Last Updated**: 2025-01-30  
**Next Milestone**: Complete Component Migration
