# Tanaka Extension - Testability Refactoring Guide

## Overview

Your codebase already has a good foundation with `tsyringe` for dependency injection, but there are several areas where testability can be significantly improved. This guide provides a comprehensive refactoring strategy to make your code more testable, maintainable, and modular.

**Status**: Phases 1-4 COMPLETED ✅ | Phase 5 IN PROGRESS

## Key Problems Identified

1. **Direct Browser API Usage**: Components and services directly use `browser` APIs, making them impossible to test in isolation
2. **Global Container Access**: The DI container is accessed globally, making it hard to mock dependencies in tests
3. **Tight Coupling**: Business logic is mixed with browser-specific code
4. **Missing Abstractions**: No interfaces for external dependencies (browser APIs, storage, etc.)
5. **Component Testing**: React components directly use browser APIs and hooks without proper isolation

## Refactoring Strategy

### Phases 1-3: ✅ COMPLETED
- Created browser API abstractions, DI container setup, and test utilities
- Refactored all services and components to use dependency injection
- Removed direct browser API imports throughout the codebase

### Additional Best Practices

#### Create Core Models and Mappers

```typescript
// src/models/tab.ts
import { z } from 'zod';

// Schema for runtime validation
export const TabSchema = z.object({
  id: z.string(),
  windowId: z.string(),
  url: z.string().url(),
  title: z.string(),
  favIconUrl: z.string().optional(),
  index: z.number().int().min(0),
  pinned: z.boolean(),
  active: z.boolean(),
  lastAccessed: z.number().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Core business model
export type Tab = z.infer<typeof TabSchema>;

// Domain logic methods
export const TabMethods = {
  isSyncable(tab: Tab): boolean {
    const nonSyncablePatterns = [/^about:/, /^chrome:/, /^file:/];
    return !nonSyncablePatterns.some(pattern => pattern.test(tab.url));
  },
  
  isRecentlyAccessed(tab: Tab, thresholdMs = 24 * 60 * 60 * 1000): boolean {
    const lastAccessed = tab.lastAccessed || tab.updatedAt;
    return Date.now() - lastAccessed < thresholdMs;
  }
};

// src/browser/mappers.ts
import type { Tabs } from "webextension-polyfill";
import type { Tab } from "../models/tab";
import { TabSchema } from "../models/tab";

export function browserTabToTab(browserTab: Tabs.Tab, windowId?: number): Tab | null {
  if (!browserTab.url || !browserTab.id) return null;
  
  const now = Date.now();
  return TabSchema.parse({
    id: browserTab.id.toString(),
    windowId: (windowId || browserTab.windowId).toString(),
    url: browserTab.url,
    title: browserTab.title || '',
    favIconUrl: browserTab.favIconUrl,
    index: browserTab.index,
    pinned: browserTab.pinned,
    active: browserTab.active,
    lastAccessed: browserTab.lastAccessed,
    createdAt: now,
    updatedAt: now,
  });
}

// src/api/mappers.ts
import type { Tab } from "../models/tab";
import type { Tab as SyncTab } from "./generated/tab";

export function tabToSyncTab(tab: Tab): SyncTab {
  return {
    id: tab.id,
    windowId: tab.windowId,
    data: JSON.stringify({
      url: tab.url,
      title: tab.title,
      favIconUrl: tab.favIconUrl,
      index: tab.index,
      pinned: tab.pinned,
      active: tab.active,
    }),
    updatedAt: tab.updatedAt,
  };
}

export function syncTabToTab(syncTab: SyncTab): Tab {
  const data = JSON.parse(syncTab.data);
  return {
    id: syncTab.id,
    windowId: syncTab.windowId,
    ...data,
    createdAt: syncTab.updatedAt,
    updatedAt: syncTab.updatedAt,
  };
}
```

#### Create Repository Pattern for Data Access

```typescript
// src/repositories/interfaces.ts
import type { Tab, Window, Settings } from "../models";

export interface ITabRepository {
  syncTabs(tabs: Tab[]): Promise<Tab[]>;
  getTrackedTabs(): Promise<Tab[]>;
}

export interface IWindowRepository {
  getTrackedWindows(): Promise<Window[]>;
  trackWindow(windowId: string): Promise<void>;
  untrackWindow(windowId: string): Promise<void>;
}

export interface ISettingsRepository {
  load(): Promise<Settings>;
  save(settings: Partial<Settings>): Promise<void>;
  clear(): Promise<void>;
}

// src/repositories/tab-repository.ts
import { injectable, inject } from "tsyringe";
import type { ITabRepository } from "./interfaces";
import type { TanakaAPI } from "../api/client";
import type { Tab } from "../models/tab";
import { TabMethods } from "../models/tab";
import { tabToSyncTab, syncTabToTab } from "../api/mappers";

@injectable()
export class TabRepository implements ITabRepository {
  constructor(
    @inject("ITanakaAPI") private readonly api: TanakaAPI,
    @inject("IBrowser") private readonly browser: IBrowser
  ) {}

  async syncTabs(tabs: Tab[]): Promise<Tab[]> {
    // Convert to sync format
    const syncTabs = tabs.map(tabToSyncTab);
    
    // Send to server
    const response = await this.api.syncTabs(syncTabs);
    
    // Convert back to Tab format
    return response.map(syncTabToTab);
  }
  
  async getTrackedTabs(): Promise<Tab[]> {
    // Browser class already returns Tab[] (not BrowserTab[])
    const tabs = await this.browser.tabs.query({});
    
    // Filter syncable tabs using domain logic
    return tabs.filter(tab => TabMethods.isSyncable(tab));
  }
}
```

## Migration Steps

1. **Phase 1-4** ✅ COMPLETED
   - Created browser API abstractions and dependency injection setup
   - Refactored all services and components to use DI
   - Implemented comprehensive test suite with 80%+ coverage

5. **Phase 5: Domain Models with Tab Type Consolidation** (2-3 days)

   This phase solves the Tab type confusion and creates a clean domain layer.
   
   **Key Problems to Solve:**
   - **Tab Type Confusion**: Three different `Tab` types all named "Tab" causing import collisions
   - **Missing Domain Layer**: No clean domain models separate from external representations
   - **Data Access Pattern**: Need repository pattern to abstract storage/API access

   ### Type Definitions and Usage:
   
   **Tab** (in `src/models/`)
   - Our core business model with domain logic
   - Contains all relevant tab properties and business methods
   - Used throughout the application's business logic
   - Import as: `import { Tab } from "../models/tab"`
   
   **BrowserTab** (from `webextension-polyfill`)
   - The native Firefox WebExtension API tab type
   - **ONLY used inside the Browser class** - never exposed to the rest of the app
   - Browser class converts BrowserTab → Tab internally
   
   **SyncTab** (in `src/api/generated/`)
   - The server's representation for synchronization
   - Structure: `{ id: string, windowId: string, data: string, updatedAt: number }`
   - Only used in API client and mappers
   - Import as: `import type { Tab as SyncTab } from "../api/generated/tab"`

   ### Architecture Overview:
   ```
   Browser Boundary          Core Logic           API Boundary
   ────────────────         ──────────           ────────────
   browser/                 models/              api/
   ├── index.ts            ├── tab.ts           ├── client.ts
   │   (BrowserTab → Tab)  │   (Tab)            │   (Tab ↔ SyncTab)
   └── mappers.ts          └── window.ts        └── mappers.ts
   ```

   ### Step 1: Create Core Models (2 hours)
   - Create `/extension/src/models/` directory
   - Define core models:
     - `Tab` - Core tab model with business logic
     - `Window` - Window model
     - `Settings` - Settings model
   - Add Zod validation schemas
   - Include domain methods (isSyncable, isRecentlyAccessed, etc.)

   ### Step 2: Refactor Browser Class as Anti-Corruption Layer (3 hours)
   - Update Browser class to return `Tab` instead of browser's native type
   - Move BrowserTab → Tab conversions to `/browser/mappers.ts`
   - Update all Browser interface methods to use `Tab`
   - Ensure BrowserTab type never leaves the browser/ directory

   ### Step 3: Update API Layer (2 hours)
   - Move generated types to `/api/generated/`
   - Create Tab ↔ SyncTab mappers in `/api/mappers.ts`
   - Update API client to use mappers internally

   ### Step 4: Create Repository Pattern (2 hours)
   - Create `/extension/src/repositories/` directory
   - Define repository interfaces using core models
   - Implement repositories that handle data access
   - Register repositories in DI container

   ### Step 5: Refactor Services (3 hours)
   - Update all services to use `Tab` from models/
   - Remove any remaining references to old type names
   - Services now work exclusively with core models

   ### Step 6: Update Tests and Documentation (2 hours)
   - Update tests to use new type structure
   - Add tests for mappers
   - Update CLAUDE.md with new architecture
   - Document the boundary pattern

## Benefits of This Approach

1. **Complete Testability**: Every component and service can be tested in isolation
2. **Flexibility**: Easy to swap implementations (e.g., for different browsers)
3. **Maintainability**: Clear separation of concerns
4. **Type Safety**: Full TypeScript support with interfaces
5. **Scalability**: Easy to add new features without breaking existing code

## Conclusion

This refactoring will transform your codebase into a highly testable, maintainable system. The initial investment in setting up proper abstractions and dependency injection will pay dividends as your extension grows and evolves.

Remember to:

- Refactor incrementally
- Write tests as you go
- Keep the existing functionality working during migration
- Document any breaking changes

The result will be a professional-grade codebase that's a pleasure to work with and extend.

## Implementation Plan

### Branch Strategy

```
main
├── feat/testing-abstractions       # Phase 1-3: ✅ COMPLETED
├── feat/testing-services          # ✅ COMPLETED
├── feat/remove-browser-imports    # ✅ COMPLETED
├── feat/testing-components        # ✅ COMPLETED
├── feat/testing-suite             # Phase 4: ✅ COMPLETED
└── feat/domain-models             # Phase 5: Domain models with tab type consolidation (IN PROGRESS)
```

### Remaining Implementation

#### Branch: `feat/domain-models`
**Purpose**: Create core models and implement clean architecture boundaries

**TODO - Commits**:
1. `feat: create core models with business logic`
   - Create `/extension/src/models/` directory
   - Implement `Tab`, `Window`, `Settings` models
   - Add Zod schemas for validation
   - Include domain logic methods

2. `refactor: implement Browser class as anti-corruption layer`
   - Create `/extension/src/browser/mappers.ts`
   - Update Browser class to convert BrowserTab to Tab internally
   - Change all Browser interface methods to return Tab
   - Update event emitters to emit Tab instead of BrowserTab
   - Ensure BrowserTab type is only used within browser/ directory

3. `refactor: reorganize API types and add mappers`
   - Move generated types to `/extension/src/api/generated/`
   - Create `/extension/src/api/mappers.ts`
   - Implement Tab ↔ SyncTab conversion functions
   - Update API client to use mappers internally

4. `feat: implement repository pattern`
   - Create `/extension/src/repositories/` directory
   - Define repository interfaces using core models
   - Implement `TabRepository`, `WindowRepository`, `SettingsRepository`
   - Register repositories in DI container

5. `refactor: update services to use core models`
   - Update all services to import Tab from models/
   - Remove any LocalTab, DomainTab references
   - Ensure consistent use of core models throughout

6. `test: add tests for boundaries and mappers`
   - Test Browser boundary conversions
   - Test API boundary conversions
   - Test repository implementations
   - Ensure type safety at boundaries

7. `docs: update documentation with new architecture`
   - Update CLAUDE.md with boundary pattern
   - Document the three Tab types and where they're used
   - Add architecture diagram
   - Update import examples

### Execution Timeline

**Current Focus:**
- Complete `feat/domain-models` branch (2-3 days)

### Success Criteria

1. **Test Coverage**: Achieve minimum 80% code coverage across all metrics
2. **No Regressions**: All existing functionality continues to work ✅ (Phases 1-3 complete)
3. **CI/CD Integration**: All tests run in GitHub Actions
4. **Developer Experience**: Easy to write new tests for new features ✅ (Test utilities in place)
5. **Documentation**: Clear examples and patterns for future development

### Key Principles During Implementation

1. **Incremental Changes**: Each commit should keep the codebase functional
2. **Test as You Go**: Write tests immediately after refactoring each component
3. **Preserve Behavior**: Ensure no breaking changes to existing functionality
4. **Clean Git History**: Use interactive rebase to maintain clean commit history
5. **Regular Integration**: Merge branches back to main frequently to avoid conflicts

### Risk Mitigation

1. **Gradual Migration**: Keep old code working while adding new abstractions
2. **Feature Flags**: Use environment variables to toggle between old/new implementations if needed
3. **Extensive Testing**: Manual testing after each major change
4. **Rollback Plan**: Each branch can be reverted independently if issues arise
5. **Performance Monitoring**: Ensure DI doesn't introduce performance regressions

