# Tanaka Extension - Testability Refactoring Guide

## Overview

Your codebase already has a good foundation with `tsyringe` for dependency injection, but there are several areas where testability can be significantly improved. This guide provides a comprehensive refactoring strategy to make your code more testable, maintainable, and modular.

**Status**: Phases 1-3 COMPLETED ✅ | Phases 4-5 TODO

## Key Problems Identified

1. **Direct Browser API Usage**: Components and services directly use `browser` APIs, making them impossible to test in isolation
2. **Global Container Access**: The DI container is accessed globally, making it hard to mock dependencies in tests
3. **Tight Coupling**: Business logic is mixed with browser-specific code
4. **Missing Abstractions**: No interfaces for external dependencies (browser APIs, storage, etc.)
5. **Component Testing**: React components directly use browser APIs and hooks without proper isolation

## Refactoring Strategy

### 1. Create Abstraction Layers for Browser APIs

First, create interfaces for all browser APIs you use:

```typescript
// src/interfaces/browser-apis.ts
export interface ITabsAPI {
  query(queryInfo: any): Promise<any[]>;
  onCreated: IEventEmitter<any>;
  onRemoved: IEventEmitter<any>;
  onUpdated: IEventEmitter<any>;
  onMoved: IEventEmitter<any>;
}

export interface IWindowsAPI {
  getCurrent(): Promise<{ id?: number }>;
  onRemoved: IEventEmitter<number>;
}

export interface IStorageAPI {
  get(keys: string[]): Promise<Record<string, any>>;
  set(items: Record<string, any>): Promise<void>;
  remove(keys: string[]): Promise<void>;
}

export interface IMessagingAPI {
  sendMessage(message: any): Promise<any>;
  onMessage: IEventEmitter<any>;
}

export interface IRuntimeAPI {
  getManifest(): { version: string };
  openOptionsPage(): Promise<void>;
  onMessage: IEventEmitter<any>;
}

export interface IEventEmitter<T> {
  addListener(callback: (data: T) => void): void;
  removeListener(callback: (data: T) => void): void;
}

export interface IBrowserAPI {
  tabs: ITabsAPI;
  windows: IWindowsAPI;
  storage: {
    local: IStorageAPI;
  };
  runtime: IRuntimeAPI;
}
```

### 2. Implement Browser API Adapters

Create concrete implementations that wrap the actual browser APIs:

```typescript
// src/adapters/browser-adapter.ts
import browser from "webextension-polyfill";
import { injectable } from "tsyringe";
import type {
  IBrowserAPI,
  ITabsAPI,
  IWindowsAPI,
  IStorageAPI,
  IRuntimeAPI,
} from "../interfaces/browser-apis";

@injectable()
export class BrowserAdapter implements IBrowserAPI {
  public readonly tabs: ITabsAPI = {
    query: (queryInfo) => browser.tabs.query(queryInfo),
    onCreated: browser.tabs.onCreated,
    onRemoved: browser.tabs.onRemoved,
    onUpdated: browser.tabs.onUpdated,
    onMoved: browser.tabs.onMoved,
  };

  public readonly windows: IWindowsAPI = {
    getCurrent: () => browser.windows.getCurrent(),
    onRemoved: browser.windows.onRemoved,
  };

  public readonly storage = {
    local: {
      get: (keys: string[]) => browser.storage.local.get(keys),
      set: (items: Record<string, any>) => browser.storage.local.set(items),
      remove: (keys: string[]) => browser.storage.local.remove(keys),
    } as IStorageAPI,
  };

  public readonly runtime: IRuntimeAPI = {
    getManifest: () => browser.runtime.getManifest(),
    openOptionsPage: () => browser.runtime.openOptionsPage(),
    onMessage: browser.runtime.onMessage,
  };
}
```

### 3. Refactor Services to Use Abstractions

Update your services to depend on abstractions instead of concrete implementations:

```typescript
// src/sync/user-settings.ts
import { injectable, inject } from "tsyringe";
import type { IBrowserAPI } from "../interfaces/browser-apis";

const USER_SETTINGS_DEFAULTS = {
  authToken: "unset-token",
  syncInterval: 5000,
};

export type UserSettings = typeof USER_SETTINGS_DEFAULTS;
const USER_SETTINGS_KEYS = Object.keys(
  USER_SETTINGS_DEFAULTS
) as (keyof UserSettings)[];

@injectable()
export class UserSettingsManager {
  constructor(@inject("IBrowserAPI") private readonly browser: IBrowserAPI) {}

  async load(): Promise<UserSettings> {
    const stored = await this.browser.storage.local.get(USER_SETTINGS_KEYS);

    return {
      ...USER_SETTINGS_DEFAULTS,
      ...stored,
    } as UserSettings;
  }

  async save(settings: Partial<UserSettings>): Promise<void> {
    await this.browser.storage.local.set(settings);
  }

  async clear(): Promise<void> {
    await this.browser.storage.local.remove(USER_SETTINGS_KEYS);
  }
}
```

```typescript
// src/sync/tab-event-handler.ts
import { injectable, inject } from "tsyringe";
import type { IBrowserAPI } from "../interfaces/browser-apis";
import type { WindowTracker } from "./window-tracker";
import type { SyncManager } from "./sync-manager";
import { debugLog } from "../utils/logger";

@injectable()
export class TabEventHandler {
  private unsubscribers: Array<() => void> = [];

  constructor(
    @inject("IBrowserAPI") private readonly browser: IBrowserAPI,
    @inject(WindowTracker) private readonly windowTracker: WindowTracker,
    @inject(SyncManager) private readonly syncManager: SyncManager
  ) {}

  setupListeners(): void {
    // Store references to bound methods for cleanup
    const handlers = {
      tabCreated: this.handleTabCreated.bind(this),
      tabRemoved: this.handleTabRemoved.bind(this),
      tabUpdated: this.handleTabUpdated.bind(this),
      tabMoved: this.handleTabMoved.bind(this),
      windowRemoved: this.handleWindowRemoved.bind(this),
    };

    this.browser.tabs.onCreated.addListener(handlers.tabCreated);
    this.browser.tabs.onRemoved.addListener(handlers.tabRemoved);
    this.browser.tabs.onUpdated.addListener(handlers.tabUpdated);
    this.browser.tabs.onMoved.addListener(handlers.tabMoved);
    this.browser.windows.onRemoved.addListener(handlers.windowRemoved);

    // Store cleanup functions
    this.unsubscribers = [
      () => this.browser.tabs.onCreated.removeListener(handlers.tabCreated),
      () => this.browser.tabs.onRemoved.removeListener(handlers.tabRemoved),
      () => this.browser.tabs.onUpdated.removeListener(handlers.tabUpdated),
      () => this.browser.tabs.onMoved.removeListener(handlers.tabMoved),
      () =>
        this.browser.windows.onRemoved.removeListener(handlers.windowRemoved),
    ];
  }

  cleanup(): void {
    this.unsubscribers.forEach((fn) => fn());
    this.unsubscribers = [];
  }

  // ... rest of the methods remain the same
}
```

### 4. Update DI Container Configuration

```typescript
// src/di/container.ts
import "reflect-metadata";
import { container } from "tsyringe";
import { UserSettingsManager } from "../sync/user-settings";
import { TanakaAPI } from "../api/api";
import { WindowTracker } from "../sync/window-tracker";
import { SyncManager } from "../sync/sync-manager";
import { TabEventHandler } from "../sync/tab-event-handler";
import { MessageHandler } from "../sync/message-handler";
import { BrowserAdapter } from "../adapters/browser-adapter";
import { getConfig } from "../config";
import type { IBrowserAPI } from "../interfaces/browser-apis";

// Register browser adapter
container.register<IBrowserAPI>("IBrowserAPI", {
  useClass: BrowserAdapter,
});

// Register singleton instances
container.registerSingleton<UserSettingsManager>(UserSettingsManager);
container.registerSingleton<WindowTracker>(WindowTracker);

// Register TanakaAPI with factory
container.register<TanakaAPI>("ITanakaAPI", {
  useFactory: () => new TanakaAPI(getConfig().serverUrl),
});

// Other registrations remain the same...

export { container };

// Export a factory function for creating test containers
export function createTestContainer(): typeof container {
  const testContainer = container.createChildContainer();
  return testContainer;
}
```

### 5. Create Context Provider for React Components

```typescript
// src/contexts/DIContext.tsx
import { createContext, ComponentChildren } from "preact";
import { useContext } from "preact/hooks";
import { container as defaultContainer } from "../di/container";
import type { DependencyContainer } from "tsyringe";

const DIContext = createContext<DependencyContainer>(defaultContainer);

export interface DIProviderProps {
  container?: DependencyContainer;
  children: ComponentChildren;
}

export function DIProvider({
  container = defaultContainer,
  children,
}: DIProviderProps) {
  return <DIContext.Provider value={container}>{children}</DIContext.Provider>;
}

export function useDI(): DependencyContainer {
  const container = useContext(DIContext);
  if (!container) {
    throw new Error("useDI must be used within a DIProvider");
  }
  return container;
}

export function useService<T>(token: any): T {
  const container = useDI();
  return container.resolve<T>(token);
}
```

### 6. Refactor Hooks to Use DI

```typescript
// src/hooks/useExtensionState.ts
import { useEffect, useState } from "preact/hooks";
import { getConfig } from "../config/index.js";
import { useService } from "../contexts/DIContext";
import type { IBrowserAPI } from "../interfaces/browser-apis";

interface ExtensionState {
  isLoading: boolean;
  isConfigured: boolean;
  serverUrl: string;
  error: string | null;
}

export function useExtensionState() {
  const browser = useService<IBrowserAPI>("IBrowserAPI");
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [serverUrl, setServerUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExtensionState = async () => {
      try {
        const config = getConfig();
        const configServerUrl = config.serverUrl || "";
        setServerUrl(configServerUrl);

        const result = (await browser.storage.local.get(["authToken"])) as {
          authToken?: string;
        };
        const hasAuthToken = Boolean(result.authToken);

        setIsConfigured(Boolean(configServerUrl) && hasAuthToken);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load extension state";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadExtensionState();
  }, [browser]);

  return {
    isLoading,
    isConfigured,
    serverUrl,
    error,
  } satisfies ExtensionState;
}
```

### 7. Update Components to Use DI Provider

```typescript
// src/popup/popup.tsx
import "reflect-metadata";
import { render } from "preact";
import { PopupApp } from "./components/PopupApp";
import { DIProvider } from "../contexts/DIContext";
import "./popup.css";

if (process.env.NODE_ENV === "development") {
  import("preact/debug");
}

render(
  <DIProvider>
    <PopupApp />
  </DIProvider>,
  document.getElementById("root")!
);
```

### 8. Create Test Utilities

```typescript
// src/test/test-utils.tsx
import { render as preactRender } from "@testing-library/preact";
import { ComponentChildren } from "preact";
import { DIProvider } from "../contexts/DIContext";
import { createTestContainer } from "../di/container";
import type { DependencyContainer } from "tsyringe";
import type { IBrowserAPI } from "../interfaces/browser-apis";

export function createMockBrowserAPI(): IBrowserAPI {
  return {
    tabs: {
      query: jest.fn().mockResolvedValue([]),
      onCreated: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
      onRemoved: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
      onUpdated: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
      onMoved: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
    },
    windows: {
      getCurrent: jest.fn().mockResolvedValue({ id: 1 }),
      onRemoved: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
    },
    storage: {
      local: {
        get: jest.fn().mockResolvedValue({}),
        set: jest.fn().mockResolvedValue(undefined),
        remove: jest.fn().mockResolvedValue(undefined),
      },
    },
    runtime: {
      getManifest: jest.fn().mockReturnValue({ version: "1.0.0" }),
      openOptionsPage: jest.fn().mockResolvedValue(undefined),
      onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
    },
  };
}

interface RenderOptions {
  container?: DependencyContainer;
  mockBrowserAPI?: IBrowserAPI;
}

export function render(
  ui: ComponentChildren,
  { container, mockBrowserAPI = createMockBrowserAPI() }: RenderOptions = {}
) {
  const testContainer = container || createTestContainer();

  // Override browser API with mock
  testContainer.register<IBrowserAPI>("IBrowserAPI", {
    useValue: mockBrowserAPI,
  });

  return preactRender(<DIProvider container={testContainer}>{ui}</DIProvider>);
}

export * from "@testing-library/preact";
```

### 9. Example Test Cases

```typescript
// src/sync/__tests__/user-settings.test.ts
import { createTestContainer } from "../../di/container";
import { UserSettingsManager } from "../user-settings";
import { createMockBrowserAPI } from "../../test/test-utils";
import type { IBrowserAPI } from "../../interfaces/browser-apis";

describe("UserSettingsManager", () => {
  let container: ReturnType<typeof createTestContainer>;
  let userSettingsManager: UserSettingsManager;
  let mockBrowserAPI: IBrowserAPI;

  beforeEach(() => {
    container = createTestContainer();
    mockBrowserAPI = createMockBrowserAPI();

    container.register<IBrowserAPI>("IBrowserAPI", {
      useValue: mockBrowserAPI,
    });

    userSettingsManager = container.resolve(UserSettingsManager);
  });

  test("load returns default settings when storage is empty", async () => {
    mockBrowserAPI.storage.local.get = jest.fn().mockResolvedValue({});

    const settings = await userSettingsManager.load();

    expect(settings).toEqual({
      authToken: "unset-token",
      syncInterval: 5000,
    });
  });

  test("save updates storage", async () => {
    await userSettingsManager.save({ authToken: "new-token" });

    expect(mockBrowserAPI.storage.local.set).toHaveBeenCalledWith({
      authToken: "new-token",
    });
  });
});
```

```typescript
// src/popup/hooks/__tests__/useWindowTracking.test.tsx
import { renderHook, act } from "../../test/test-utils";
import { useWindowTracking } from "../useWindowTracking";
import { createMockBrowserAPI } from "../../test/test-utils";

describe("useWindowTracking", () => {
  test("toggles window tracking", async () => {
    const mockBrowserAPI = createMockBrowserAPI();
    mockBrowserAPI.windows.getCurrent = jest
      .fn()
      .mockResolvedValue({ id: 123 });
    mockBrowserAPI.runtime.sendMessage = jest
      .fn()
      .mockResolvedValue({ windowIds: [] });

    const { result } = renderHook(() => useWindowTracking(), {
      mockBrowserAPI,
    });

    // Initial state
    expect(result.current.isTracked).toBe(false);

    // Toggle tracking
    await act(async () => {
      await result.current.toggleTracking();
    });

    expect(mockBrowserAPI.runtime.sendMessage).toHaveBeenCalledWith({
      type: "TRACK_WINDOW",
      windowId: 123,
    });
  });
});
```

### 10. Background Service Refactoring

```typescript
// src/background.ts
import "reflect-metadata";
import { container } from "./di/container.js";
import type { MessageResponse } from "./core.js";
import type { IBrowserAPI } from "./interfaces/browser-apis";
import { TanakaAPI } from "./api/api.js";
import { debugLog } from "./utils/logger.js";
import {
  WindowTracker,
  SyncManager,
  TabEventHandler,
  MessageHandler,
  UserSettingsManager,
} from "./sync";

export class BackgroundService {
  private readonly browser: IBrowserAPI;
  private readonly api: TanakaAPI;
  private readonly syncManager: SyncManager;
  private readonly tabEventHandler: TabEventHandler;
  private readonly userSettingsManager: UserSettingsManager;
  private readonly messageHandler: MessageHandler;

  constructor(serviceContainer: typeof container) {
    this.browser = serviceContainer.resolve<IBrowserAPI>("IBrowserAPI");
    this.api = serviceContainer.resolve<TanakaAPI>("ITanakaAPI");
    this.syncManager = serviceContainer.resolve(SyncManager);
    this.tabEventHandler = serviceContainer.resolve(TabEventHandler);
    this.userSettingsManager = serviceContainer.resolve(UserSettingsManager);
    this.messageHandler = serviceContainer.resolve(MessageHandler);
  }

  async initialize(): Promise<void> {
    const settings = await this.userSettingsManager.load();
    this.api.setAuthToken(settings.authToken);
    this.setupListeners();
    debugLog("Tanaka background service initialized");
  }

  private setupListeners(): void {
    this.tabEventHandler.setupListeners();

    this.browser.runtime.onMessage.addListener(
      async (message: unknown): Promise<MessageResponse> => {
        if (
          typeof message === "object" &&
          message !== null &&
          "type" in message &&
          message.type === "SETTINGS_UPDATED"
        ) {
          await this.reinitializeWithNewSettings();
          return { success: true };
        }

        return this.messageHandler.handleMessage(message);
      }
    );
  }

  private async reinitializeWithNewSettings(): Promise<void> {
    const settings = await this.userSettingsManager.load();
    this.api.setAuthToken(settings.authToken);

    if (this.syncManager.isRunning()) {
      await this.syncManager.restart();
    }

    debugLog("Reinitialized with updated settings");
  }

  cleanup(): void {
    this.tabEventHandler.cleanup();
    this.syncManager.stop();
  }
}

// Only create and initialize if this is the main script
if (typeof module === "undefined") {
  const backgroundService = new BackgroundService(container);
  backgroundService.initialize();
}
```

### 11. Testing Configuration

```json
// package.json updates
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "@testing-library/preact": "^3.2.3",
    "@types/jest": "^29.5.12",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "ts-jest": "^29.1.2"
  }
}
```

```javascript
// jest.config.js
export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.css$": "<rootDir>/src/test/__mocks__/styleMock.js",
  },
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
    "!src/test/**",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### 12. Additional Best Practices

#### Create Domain Models Separate from API Models

```typescript
// src/domain/models.ts
export interface Tab {
  id: string;
  windowId: string;
  url: string;
  title: string;
  favIconUrl: string;
  index: number;
  pinned: boolean;
  active: boolean;
  updatedAt: number;
}

// src/api/mappers.ts
import type { Tab as ApiTab } from "./models";
import type { Tab as DomainTab } from "../domain/models";

export function apiTabToDomain(apiTab: ApiTab): DomainTab {
  const data = JSON.parse(apiTab.data);
  return {
    id: apiTab.id,
    windowId: apiTab.windowId,
    url: data.url,
    title: data.title,
    favIconUrl: data.favIconUrl,
    index: data.index,
    pinned: data.pinned,
    active: data.active,
    updatedAt: apiTab.updatedAt,
  };
}
```

#### Create Repository Pattern for Data Access

```typescript
// src/repositories/interfaces.ts
export interface ITabRepository {
  syncTabs(localTabs: Tab[]): Promise<Tab[]>;
}

// src/repositories/tab-repository.ts
import { injectable, inject } from "tsyringe";
import type { ITabRepository } from "./interfaces";
import type { TanakaAPI } from "../api/api";
import { apiTabToDomain, domainTabToApi } from "../api/mappers";

@injectable()
export class TabRepository implements ITabRepository {
  constructor(@inject("ITanakaAPI") private readonly api: TanakaAPI) {}

  async syncTabs(localTabs: Tab[]): Promise<Tab[]> {
    const apiTabs = localTabs.map(domainTabToApi);
    const response = await this.api.syncTabs(apiTabs);
    return response.map(apiTabToDomain);
  }
}
```

## Migration Steps

1. **Phase 1: Create Abstractions** ✅ COMPLETED

   - Create all interface definitions ✅
   - Implement browser adapter ✅
   - Set up test utilities ✅

2. **Phase 2: Update Services** ✅ COMPLETED

   - Refactor services to use abstractions ✅
   - Update DI container configuration ✅
   - Remove direct browser imports ✅

3. **Phase 3: Update Components** ✅ COMPLETED

   - Add DI context provider ✅
   - Refactor hooks to use DI ✅
   - Update component initialization ✅

4. **Phase 4: Write Tests** (3-4 days) ✅

   - Write unit tests for services ✅
     - UserSettingsManager ✅
     - TabEventHandler ✅
     - WindowTracker ✅
     - SyncManager ✅
     - MessageHandler ✅
   - Write integration tests for components ✅
     - BackgroundService ✅
   - Achieve 80%+ coverage (Pending: Popup components due to Preact/Jest compatibility issues)

5. **Phase 5: Cleanup** (1 day)
   - Create domain models and repositories
   - Update documentation
   - Code review and refactoring

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
├── feat/testing-abstractions       # Phase 1: Create all abstractions and interfaces ✅ COMPLETED
├── feat/testing-services          # Phase 2: Refactor services to use abstractions ✅ COMPLETED
├── feat/remove-browser-imports    # Phase 2.5: Remove direct browser polyfill imports ✅ COMPLETED
├── feat/testing-components        # Phase 3: Update React components and hooks ✅ COMPLETED
├── feat/testing-suite             # Phase 4: Implement comprehensive test suite
└── feat/testing-cleanup           # Phase 5: Final cleanup and documentation
```

### Detailed Implementation Plan

#### Branch: `feat/testing-abstractions` ✅ COMPLETED
**Purpose**: Create all abstraction layers and interfaces without breaking existing functionality

**Completed Commits**:
1. `feat: add browser API abstractions with modular structure`
   - Created `/extension/src/browser/` directory with modular structure
   - `core.ts` - Interface definitions: `ITabs`, `IWindows`, `ILocalStorage`, `IRuntime`, `IBrowser`
   - `index.ts` - Main `Browser` class implementation
   - Individual implementations: `tabs.ts`, `windows.ts`, `storage.ts`, `runtime.ts`
   - `__mocks__/index.ts` - Mock implementations for testing

2. `feat: add test utilities and mock browser factory`
   - Created `/extension/src/test/utils.tsx` with custom render function
   - Created `/extension/src/test/setup.ts` for Jest environment setup
   - Added `createMockBrowser()` factory in browser mocks
   - Created style mock for CSS imports

3. `refactor: move DIContext to di directory for better organization`
   - Moved DI context to `/extension/src/di/provider.tsx`
   - Implemented `DIProvider`, `useDI`, and `useService` hooks
   - Added `createTestContainer()` to DI container

4. `chore: configure Jest testing framework`
   - Updated `package.json` with test scripts and dependencies
   - Created `jest.config.js` with TypeScript support
   - Added test coverage thresholds (80%)
   - Configured test environment and mocks

#### Branch: `feat/testing-services` ✅ COMPLETED
**Purpose**: Refactor all services to use dependency injection and abstractions

**Completed Commits**:
1. ✅ `refactor: update UserSettingsManager to use injected browser`
   - Modified `/extension/src/sync/user-settings.ts`
   - Added constructor injection for `IBrowser`
   - Replaced direct `browser.storage.local` with `this.browser.localStorage`
   - Updated all methods to use injected dependency

2. ✅ `refactor: update TabEventHandler to use injected browser`
   - Modified `/extension/src/sync/tab-event-handler.ts`
   - Added constructor injection for `IBrowser`
   - Stored event handler references for proper cleanup
   - Replaced all `browser.tabs` and `browser.windows` calls
   - Added cleanup() method for removing event listeners

3. ✅ `refactor: update SyncManager to use injected browser`
   - Modified `/extension/src/sync/sync-manager.ts`
   - Fixed UserSettingsManager instantiation (now injected via DI)
   - Updated container registration

4. ✅ `refactor: update WindowTracker to use injected browser`
   - No changes needed - WindowTracker doesn't use browser APIs
   - Kept as in-memory state tracker

5. ✅ `refactor: update MessageHandler to use injected browser`
   - No changes needed - MessageHandler doesn't use browser APIs directly

6. ✅ `refactor: update API client to use injected browser`
   - Modified `/extension/src/api/api.ts`
   - Removed direct browser import, using only types
   - Updated function signatures to use Tabs type directly

7. ✅ `refactor: create BackgroundService class for better testability`
   - Refactored `/extension/src/background.ts`
   - Created `BackgroundService` class with DI container injection
   - Added cleanup() method
   - Kept module check for backward compatibility

8. ✅ `chore: exclude test files from TypeScript compilation`
   - Updated `/extension/tsconfig.json`
   - Added exclusion patterns for test files to fix jest type conflicts
   - Fixed TypeScript compilation errors with test dependencies

#### Branch: `feat/remove-browser-imports` ✅ COMPLETED
**Purpose**: Remove all direct browser polyfill imports and centralize browser API access

**Completed Commits**:
1. ✅ `refactor: add browser API type re-exports to core.ts`
   - Modified `/extension/src/browser/core.ts`
   - Added type aliases for commonly used types (Tab, Window, etc.)
   - Did not re-export namespaces (not needed)

2. ✅ `refactor: replace webextension-polyfill type imports with browser/core imports`
   - Updated `/extension/src/api/api.ts` to use `Tab as BrowserTab`
   - Updated `/extension/src/sync/tab-event-handler.ts` to import types from core

3. ✅ `refactor: remove browser polyfill imports from remaining files`
   - Updated all hooks and components to use `Browser` class
   - Replaced direct `import browser from 'webextension-polyfill'`
   - Updated files:
     - `/extension/src/hooks/useExtensionState.ts`
     - `/extension/src/popup/hooks/useWindowTracking.ts`
     - `/extension/src/settings/hooks/useSettings.ts`
     - `/extension/src/popup/components/PopupApp.tsx`
     - `/extension/src/settings/components/SettingsApp.tsx`

4. ✅ `refactor: remove redundant namespace exports from core.ts`
   - Cleaned up unnecessary namespace re-exports
   - Kept only the type aliases that are actually used

#### Branch: `feat/testing-components` ✅ COMPLETED
**Purpose**: Update all React components and hooks to use dependency injection

**Completed Commits**:
1. ✅ `refactor: update popup entry point to use DIProvider`
   - Modified `/extension/src/popup/popup.tsx`
   - Imported and wrapped app with `DIProvider` from `../di/provider`
   - All child components now have access to DI container

2. ✅ `refactor: update options/settings page to use DIProvider`
   - Modified `/extension/src/settings/settings.tsx`
   - Added DI provider wrapper
   - Maintained existing functionality

3. ✅ `refactor: update hooks to use service injection`
   - Modified `/extension/src/hooks/useExtensionState.ts`
     - Used `useService<IBrowser>('IBrowser')` to get browser instance
     - Replaced direct Browser instantiation with injected service
   - Modified `/extension/src/popup/hooks/useWindowTracking.ts`
     - Injected browser through `useService` hook
     - Updated all browser API calls to use injected instance
   - Modified `/extension/src/settings/hooks/useSettings.ts`
     - Injected both IBrowser and UserSettingsManager through DI
     - Removed direct browser API usage

4. ✅ `refactor: update components to use injected services`
   - Updated `/extension/src/popup/components/PopupApp.tsx`
     - Replaced Browser instantiation with `useService<IBrowser>('IBrowser')`
   - Updated `/extension/src/settings/components/SettingsApp.tsx`
     - Used injected browser service instead of direct instantiation
   - All browser interactions now go through abstractions

#### Branch: `feat/testing-suite` 
**Purpose**: Implement comprehensive test coverage for all refactored code

**TODO - Commits**:
1. `test: add unit tests for UserSettingsManager`
   - Create `/extension/src/sync/__tests__/user-settings.test.ts`
   - Test load, save, and clear functionality
   - Verify proper browser API usage

2. `test: add unit tests for TabEventHandler`
   - Create `/extension/src/sync/__tests__/tab-event-handler.test.ts`
   - Test event listener setup and cleanup
   - Verify proper event handling

3. `test: add unit tests for WindowTracker`
   - Create `/extension/src/sync/__tests__/window-tracker.test.ts`
   - Test window tracking functionality
   - Verify state management

4. `test: add unit tests for SyncManager`
   - Create `/extension/src/sync/__tests__/sync-manager.test.ts`
   - Test sync initialization and lifecycle
   - Mock API calls and verify behavior

5. `test: add unit tests for MessageHandler`
   - Create `/extension/src/sync/__tests__/message-handler.test.ts`
   - Test all message types
   - Verify proper responses

6. `test: add integration tests for BackgroundService`
   - Create `/extension/src/__tests__/background.test.ts`
   - Test service initialization
   - Verify component integration

7. `test: add component tests for popup UI`
   - Create tests for all popup components
   - Use Testing Library for user interactions
   - Verify proper rendering and behavior

8. `test: add component tests for options UI`
   - Create tests for options page components
   - Test form interactions and validation
   - Verify settings persistence

9. `test: add hook tests for all custom hooks`
   - Create tests for `useExtensionState`, `useWindowTracking`, etc.
   - Use `renderHook` from Testing Library
   - Verify state management and side effects

#### Branch: `feat/testing-cleanup`
**Purpose**: Final cleanup, optimizations, and documentation

**TODO - Commits**:
1. `refactor: add domain models separate from API models`
   - Create `/extension/src/domain/models.ts`
   - Implement mappers between API and domain models
   - Update services to use domain models internally

2. `refactor: implement repository pattern for data access`
   - Create `/extension/src/repositories/` directory
   - Implement `TabRepository` and interfaces
   - Update services to use repositories

3. `refactor: remove all direct browser API imports`
   - Search and remove any remaining `webextension-polyfill` imports
   - Ensure all code uses injected dependencies
   - Update any missed components

4. `docs: update development documentation for testing`
   - Add testing section to DEV.md
   - Document test running procedures
   - Add examples of writing new tests

5. `chore: add pre-commit hooks for test coverage`
   - Configure git hooks to run tests
   - Ensure coverage thresholds are met
   - Add lint-staged configuration

6. `fix: address any edge cases found during testing`
   - Fix any bugs discovered
   - Handle error cases properly
   - Ensure backward compatibility

### Execution Timeline

**Week 1:** ✅ COMPLETED
- Day 1-2: Complete `feat/testing-abstractions` branch ✅
- Day 3-5: Complete `feat/testing-services` branch ✅

**Week 2:** ✅ COMPLETED  
- Day 1: Complete `feat/remove-browser-imports` branch ✅
- Day 2-3: Complete `feat/testing-components` branch ✅
- Day 4-5: Start `feat/testing-suite` branch

**Week 3:**
- Day 1-3: Continue and complete `feat/testing-suite` branch
- Day 4-5: Complete `feat/testing-cleanup` branch

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

### Notes on Implementation Approach

1. **Modular Browser API Structure**: Instead of a single adapter file, we use a modular approach with separate files for each browser API namespace (tabs, windows, storage, runtime). This makes the code more maintainable and easier to test.

2. **Simplified Naming**: Removed the "API" suffix from interfaces and classes (e.g., `IBrowser` instead of `IBrowserAPI`) for cleaner, more idiomatic code.

3. **LocalStorage vs Storage.Local**: Changed `storage.local` to `localStorage` property for simpler access patterns.

4. **Colocated Test Infrastructure**: Test utilities and mocks are organized within their respective modules (e.g., browser mocks in `src/browser/__mocks__/`) rather than scattered across different directories.

5. **DI Provider Location**: The DI provider is placed in `src/di/provider.tsx` alongside the container, keeping all DI-related code together.
