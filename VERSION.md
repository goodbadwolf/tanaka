# Tanaka Version History

This document tracks what features and changes were included in each release.

## v0.5.0 - Core Functionality (2024-12-16)

### Features Delivered
- ✅ **CRDT Synchronization**: Yjs/yrs integration for conflict-free tab merging
- ✅ **Bidirectional Sync**: Real-time tab create/move/close propagation
- ✅ **Security**: TLS support + bearer token authentication
- ✅ **Selective Tracking**: Per-window opt-in sync control
- ✅ **Test Coverage**: 86.8% coverage achieved (PR #22)

### Technical Highlights
- Extension migrated to Rspack (118ms builds, 36% faster than Vite)
- Preact Signals for state management
- Component library foundation (Button, Input, Card, etc.)
- Comprehensive API and browser module tests

### Release Notes
This release establishes the core synchronization functionality. The extension reliably syncs tabs across devices using CRDTs for consistency. The remaining UI modernization tasks continue as v0.5.1 development.

---

## v0.5.1 - UI Enhancements (In Development)

### Planned Features
- [ ] Complete React/Preact UI migration
- [ ] Remove remaining vanilla JavaScript code
- [ ] Full component test coverage
- [ ] E2E testing with Playwright
- [ ] Production performance validation

### Focus
Completing the UI modernization started in v0.5.0 while maintaining the stable core functionality.

---

## v1.0 - First Stable Release (Planned)

### Planned Features
- [ ] Clean architecture implementation
- [ ] Adaptive polling (5s → 1s on activity)
- [ ] Session resurrection
- [ ] 200+ tab performance optimization
- [ ] Mozilla Add-ons submission
- [ ] Single-binary server distribution

### Server Improvements
Complete architectural overhaul as detailed in [SERVER-ROADMAP-v1.0.md](docs/SERVER-ROADMAP-v1.0.md)

---

## Version Numbering

- **Major (X.0.0)**: Breaking changes or major architectural shifts
- **Minor (0.X.0)**: New features, backwards compatible
- **Patch (0.0.X)**: Bug fixes and minor improvements
