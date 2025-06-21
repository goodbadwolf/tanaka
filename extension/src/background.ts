import browser from 'webextension-polyfill';
import { type MessageResponse } from './core.js';
import { TanakaAPI } from './api/api.js';
import { getConfig } from './config/index.js';
import {
  WindowTracker,
  SyncManager,
  TabEventHandler,
  MessageHandler,
  UserSettingsManager,
} from './sync';

class BackgroundService {
  private readonly api: TanakaAPI;
  private readonly windowTracker: WindowTracker;
  private readonly syncManager: SyncManager;
  private readonly tabEventHandler: TabEventHandler;
  private readonly userSettingsManager: UserSettingsManager;
  private readonly messageHandler: MessageHandler;

  constructor() {
    this.api = new TanakaAPI(getConfig().serverUrl);
    this.windowTracker = new WindowTracker();
    this.syncManager = new SyncManager(this.api, this.windowTracker);
    this.tabEventHandler = new TabEventHandler(this.windowTracker, this.syncManager);
    this.userSettingsManager = new UserSettingsManager();
    this.messageHandler = new MessageHandler(this.windowTracker, this.syncManager);
  }

  async initialize(): Promise<void> {
    const settings = await this.userSettingsManager.load();
    this.api.setAuthToken(settings.authToken);
    this.setupListeners();
    console.log('Tanaka background service initialized');
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
    console.log('Reinitialized with updated settings');
  }
}

const backgroundService = new BackgroundService();
backgroundService.initialize();
