import 'reflect-metadata';
import { container } from './di/container';
import { type MessageResponse } from './core';
import type { IBrowser } from './browser/core';
import { TanakaAPI } from './api/api';
import { debugLog } from './utils/logger';
import { SyncManager, TabEventHandler, MessageHandler, UserSettingsManager } from './sync';

export class BackgroundService {
  private readonly browser: IBrowser;
  private readonly api: TanakaAPI;
  private readonly syncManager: SyncManager;
  private readonly tabEventHandler: TabEventHandler;
  private readonly userSettingsManager: UserSettingsManager;
  private readonly messageHandler: MessageHandler;

  constructor(serviceContainer: typeof container) {
    this.browser = serviceContainer.resolve<IBrowser>('IBrowser');
    this.api = serviceContainer.resolve<TanakaAPI>(TanakaAPI);
    this.syncManager = serviceContainer.resolve(SyncManager);
    this.tabEventHandler = serviceContainer.resolve(TabEventHandler);
    this.userSettingsManager = serviceContainer.resolve(UserSettingsManager);
    this.messageHandler = serviceContainer.resolve(MessageHandler);
  }

  async initialize(): Promise<void> {
    const settings = await this.userSettingsManager.load();
    this.api.setAuthToken(settings.authToken);
    this.setupListeners();
    debugLog('Tanaka background service initialized');
  }

  private setupListeners(): void {
    this.tabEventHandler.setupListeners();

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

    // Restart sync manager with new interval if it's running
    if (this.syncManager.isRunning()) {
      await this.syncManager.restart();
    }

    debugLog('Reinitialized with updated settings');
  }

  cleanup(): void {
    this.tabEventHandler.cleanup();
    this.syncManager.stop();
  }
}

// Only create and initialize if this is the main script
if (typeof module === 'undefined') {
  const backgroundService = new BackgroundService(container);
  backgroundService.initialize();
}
