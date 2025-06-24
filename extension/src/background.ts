import 'reflect-metadata';
import browser from 'webextension-polyfill';
import { type MessageResponse } from './core.js';
import { container } from './di/container.js';
import { TanakaAPI } from './api/api.js';
import { debugLog } from './utils/logger.js';
import { SyncManager, TabEventHandler, MessageHandler, UserSettingsManager } from './sync';

class BackgroundService {
  private readonly api: TanakaAPI;
  private readonly syncManager: SyncManager;
  private readonly tabEventHandler: TabEventHandler;
  private readonly userSettingsManager: UserSettingsManager;
  private readonly messageHandler: MessageHandler;

  constructor() {
    this.api = container.resolve(TanakaAPI);
    this.syncManager = container.resolve(SyncManager);
    this.tabEventHandler = container.resolve(TabEventHandler);
    this.userSettingsManager = container.resolve(UserSettingsManager);
    this.messageHandler = container.resolve(MessageHandler);
  }

  async initialize(): Promise<void> {
    const settings = await this.userSettingsManager.load();
    this.api.setAuthToken(settings.authToken);
    this.setupListeners();
    debugLog('Tanaka background service initialized');
  }

  private setupListeners(): void {
    this.tabEventHandler.setupListeners();

    browser.runtime.onMessage.addListener(async (message: unknown): Promise<MessageResponse> => {
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
    });
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
}

const backgroundService = new BackgroundService();
backgroundService.initialize();
