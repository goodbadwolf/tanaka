import browser from 'webextension-polyfill';
import { type MessageResponse } from './core.js';
import { TanakaAPI } from './api/api.js';
import {
  WindowTracker,
  SyncManager,
  TabEventHandler,
  ConfigManager,
  MessageHandler,
  UserSettingsManager,
} from './sync';

class BackgroundService {
  private readonly api: TanakaAPI;
  private readonly windowTracker: WindowTracker;
  private readonly syncManager: SyncManager;
  private readonly tabEventHandler: TabEventHandler;
  private readonly configManager: ConfigManager;
  private readonly userSettingsManager: UserSettingsManager;
  private readonly messageHandler: MessageHandler;

  constructor() {
    this.api = new TanakaAPI();
    this.windowTracker = new WindowTracker();
    this.syncManager = new SyncManager(this.api, this.windowTracker);
    this.tabEventHandler = new TabEventHandler(this.windowTracker, this.syncManager);
    this.configManager = new ConfigManager();
    this.userSettingsManager = new UserSettingsManager();
    this.messageHandler = new MessageHandler(
      this.windowTracker,
      this.syncManager,
      this.configManager,
      this.userSettingsManager,
      this.api,
    );
  }

  async initialize(): Promise<void> {
    const [config, settings] = await Promise.all([
      this.configManager.load(),
      this.userSettingsManager.load(),
    ]);
    this.api.updateConfig(config.serverUrl, settings.authToken);
    this.setupListeners();
    console.log('Tanaka background service initialized');
  }

  private setupListeners(): void {
    this.tabEventHandler.setupListeners();

    browser.runtime.onMessage.addListener(async (message: unknown): Promise<MessageResponse> => {
      return this.messageHandler.handleMessage(message);
    });
  }
}

const backgroundService = new BackgroundService();
backgroundService.initialize();
