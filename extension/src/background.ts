import 'reflect-metadata';
import { container } from './di/container';
import { type MessageResponse } from './core';
import type { IBrowser } from './browser/core';
import { TanakaAPI } from './api/api';
import { debugLog } from './utils/logger';
import {
  SyncManager,
  SyncV2Manager,
  TabEventHandler,
  MessageHandler,
  UserSettingsManager,
  WindowTracker,
} from './sync';
import { TabEventHandlerV2 } from './sync/tab-event-handler-v2';

export class BackgroundService {
  private readonly browser: IBrowser;
  private readonly api: TanakaAPI;
  private syncManager: SyncManager | SyncV2Manager;
  private tabEventHandler: TabEventHandler | TabEventHandlerV2 | null = null;
  private readonly userSettingsManager: UserSettingsManager;
  private readonly messageHandler: MessageHandler;
  private readonly windowTracker: WindowTracker;
  private useSyncV2 = false;

  constructor(private readonly serviceContainer: typeof container) {
    this.browser = serviceContainer.resolve<IBrowser>('IBrowser');
    this.api = serviceContainer.resolve<TanakaAPI>(TanakaAPI);
    this.userSettingsManager = serviceContainer.resolve(UserSettingsManager);
    this.messageHandler = serviceContainer.resolve(MessageHandler);
    this.windowTracker = serviceContainer.resolve(WindowTracker);
    // Initial sync manager will be set in initialize()
    this.syncManager = serviceContainer.resolve(SyncManager);
  }

  async initialize(): Promise<void> {
    const settings = await this.userSettingsManager.load();
    this.api.setAuthToken(settings.authToken);
    this.useSyncV2 = settings.useSyncV2;

    // Initialize the appropriate sync manager
    await this.initializeSyncManager();

    this.setupListeners();
    debugLog(`Tanaka background service initialized with Sync ${this.useSyncV2 ? 'v2' : 'v1'}`);
  }

  private async initializeSyncManager(): Promise<void> {
    // Stop any existing sync manager
    if (this.syncManager) {
      this.syncManager.stop();
    }

    if (this.tabEventHandler) {
      this.tabEventHandler.cleanup();
      this.tabEventHandler = null;
    }

    if (this.useSyncV2) {
      // Initialize Sync v2
      this.syncManager = new SyncV2Manager({
        api: this.api,
        windowTracker: this.windowTracker,
        browser: this.browser,
        syncIntervalMs: (await this.userSettingsManager.load()).syncInterval,
      });

      // Setup tab event handler for v2
      this.tabEventHandler = await (this.syncManager as SyncV2Manager).setupTabEventHandler();
    } else {
      // Use existing Sync v1
      this.syncManager = this.serviceContainer.resolve(SyncManager);
      this.tabEventHandler = this.serviceContainer.resolve(TabEventHandler);
    }

    // Start the sync manager
    if ('start' in this.syncManager) {
      await this.syncManager.start();
    }
  }

  private setupListeners(): void {
    // For v1, tab event handler needs explicit setup
    if (this.tabEventHandler && !this.useSyncV2) {
      this.tabEventHandler.setupListeners();
    }

    this.browser.runtime.onMessage.addListener(
      async (message: unknown): Promise<MessageResponse> => {
        // Handle SETTINGS_UPDATED directly in background service
        if (
          typeof message === 'object' &&
          message !== null &&
          'type' in message &&
          message.type === 'SETTINGS_UPDATED'
        ) {
          await this.reinitializeWithNewSettings();
          return { success: true };
        }

        return this.messageHandler.handleMessage(message);
      },
    );
  }

  private async reinitializeWithNewSettings(): Promise<void> {
    const settings = await this.userSettingsManager.load();
    this.api.setAuthToken(settings.authToken);

    // Check if sync version has changed
    if (settings.useSyncV2 !== this.useSyncV2) {
      this.useSyncV2 = settings.useSyncV2;
      await this.initializeSyncManager();

      // If switching to v1, we need to set up the tab event listeners
      if (!this.useSyncV2 && this.tabEventHandler) {
        this.tabEventHandler.setupListeners();
      }

      debugLog(`Switched to Sync ${this.useSyncV2 ? 'v2' : 'v1'}`);
    } else {
      // Just restart sync manager with new interval if it's running
      if ('isRunning' in this.syncManager && this.syncManager.isRunning()) {
        await this.syncManager.restart();
      } else if (this.useSyncV2) {
        // For v2, stop and start
        this.syncManager.stop();
        await this.initializeSyncManager();
      }
    }

    debugLog('Reinitialized with updated settings');
  }

  cleanup(): void {
    if (this.tabEventHandler) {
      this.tabEventHandler.cleanup();
    }
    this.syncManager.stop();
  }
}

// Only create and initialize if this is the main script
if (typeof module === 'undefined') {
  const backgroundService = new BackgroundService(container);
  backgroundService.initialize();
}
