# Tanaka Extension - Core Models and Clean Architecture

## Overview

This guide outlines the implementation of core business models and clean architecture boundaries to solve Tab type confusion and create a maintainable, testable codebase.

## Problem Statement

- **Tab Type Confusion**: Three different `Tab` types all named "Tab" causing import collisions
- **Missing Model Layer**: No clean business models separate from external representations
- **Data Access Pattern**: Need repository pattern to abstract storage/API access

## Architecture Design

### Type Definitions and Usage

**Tab** (in `src/models/`)
- Our core business model with business logic
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

### Architecture Overview

```
Browser Boundary          Core Logic           API Boundary
────────────────         ──────────           ────────────
browser/                 models/              api/
├── index.ts            ├── tab.ts           ├── client.ts
│   (BrowserTab → Tab)  │   (Tab)            │   (Tab ↔ SyncTab)
└── mappers.ts          └── window.ts        └── mappers.ts
```

## Implementation

### Core Models

```typescript
// src/models/tab.ts
import { z } from "zod";

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

// Business logic methods
export const TabMethods = {
  isSyncable(tab: Tab): boolean {
    const nonSyncablePatterns = [/^about:/, /^chrome:/, /^file:/];
    return !nonSyncablePatterns.some((pattern) => pattern.test(tab.url));
  },

  isRecentlyAccessed(tab: Tab, thresholdMs = 24 * 60 * 60 * 1000): boolean {
    const lastAccessed = tab.lastAccessed || tab.updatedAt;
    return Date.now() - lastAccessed < thresholdMs;
  },
};

// src/browser/mappers.ts
import type { Tabs } from "webextension-polyfill";
import type { Tab } from "../models/tab";
import { TabSchema } from "../models/tab";

export function browserTabToTab(
  browserTab: Tabs.Tab,
  windowId?: number
): Tab | null {
  if (!browserTab.url || !browserTab.id) return null;

  const now = Date.now();
  return TabSchema.parse({
    id: browserTab.id.toString(),
    windowId: (windowId || browserTab.windowId).toString(),
    url: browserTab.url,
    title: browserTab.title || "",
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

### Repository Pattern

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

    // Filter syncable tabs using business logic
    return tabs.filter((tab) => TabMethods.isSyncable(tab));
  }
}
```

## Implementation Steps

### Step 1: Create Core Models

- Create `/extension/src/models/` directory
- Define core models:
  - `Tab` - Core tab model with business logic
  - `Window` - Window model
  - `Settings` - Settings model
- Add Zod validation schemas
- Include business methods (isSyncable, isRecentlyAccessed, etc.)

### Step 2: Refactor Browser Class as Anti-Corruption Layer

- Update Browser class to return `Tab` instead of browser's native type
- Move BrowserTab → Tab conversions to `/browser/mappers.ts`
- Update all Browser interface methods to use `Tab`
- Ensure BrowserTab type never leaves the browser/ directory

### Step 3: Update API Layer

- Move generated types to `/api/generated/`
- Create Tab ↔ SyncTab mappers in `/api/mappers.ts`
- Update API client to use mappers internally

### Step 4: Create Repository Pattern

- Create `/extension/src/repositories/` directory
- Define repository interfaces using core models
- Implement repositories that handle data access
- Register repositories in DI container

### Step 5: Refactor Services

- Update all services to use `Tab` from models/
- Remove any remaining references to old type names
- Services now work exclusively with core models

### Step 6: Update Tests and Documentation

- Update tests to use new type structure
- Add tests for mappers
- Update CLAUDE.md with new architecture
- Document the boundary pattern

## Commit Plan

**Branch**: `feat/core-models`

1. `feat: create core models with business logic`
   - Create `/extension/src/models/` directory
   - Implement `Tab`, `Window`, `Settings` models
   - Add Zod schemas for validation
   - Include business logic methods

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

## Key Principles

- **Incremental Changes**: Each commit should keep the codebase functional
- **Test as You Go**: Write tests immediately after refactoring each component
- **Preserve Behavior**: Ensure no breaking changes to existing functionality
- **Type Safety**: Enforce boundaries through TypeScript types
