import 'reflect-metadata';
import { container } from './di/container';
import { type MessageResponse } from './core';
import type { IBrowser } from './browser/core';
import { TanakaAPI } from './api/api';
import { debugLog } from './utils/logger';
import {
  MessageHandler,
  SyncManager,
  TabEventHandler,
  UserSettingsManager,
  WindowTracker,
} from './sync';

export class BackgroundService {
  private readonly browser: IBrowser;
  private readonly api: TanakaAPI;
  private syncManager: SyncManager;
  private tabEventHandler: TabEventHandler | null = null;
  private readonly userSettingsManager: UserSettingsManager;
  private readonly messageHandler: MessageHandler;
  private readonly windowTracker: WindowTracker;

  constructor(serviceContainer: typeof container) {
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

    // Initialize the sync manager
    await this.initializeSyncManager();

    this.setupListeners();
    debugLog('Tanaka background service initialized');
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

    // Initialize Sync manager
    this.syncManager = new SyncManager({
      api: this.api,
      windowTracker: this.windowTracker,
      browser: this.browser,
      syncIntervalMs: (await this.userSettingsManager.load()).syncInterval,
    });

    // Setup tab event handler
    this.tabEventHandler = await this.syncManager.setupTabEventHandler();

    // Start the sync manager
    if ('start' in this.syncManager) {
      await this.syncManager.start();
    }
  }

  private setupListeners(): void {
    // Tab event handler is already setup via sync manager

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

    // Restart sync manager with new settings
    if (this.syncManager.isRunning()) {
      await this.syncManager.restart();
    } else {
      // Stop and start
      this.syncManager.stop();
      await this.initializeSyncManager();
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
