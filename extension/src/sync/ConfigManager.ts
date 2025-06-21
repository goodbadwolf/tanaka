import browser from 'webextension-polyfill';
import type { TanakaAPI } from '../api';

export interface Config {
  serverUrl: string;
  authToken: string;
}

export class ConfigManager {
  private static readonly DEFAULT_SERVER_URL = 'http://localhost:3000';
  private static readonly DEFAULT_AUTH_TOKEN = 'tanaka-secret-token';

  constructor(private readonly api: TanakaAPI) {}

  async loadConfig(): Promise<Config> {
    const stored = await browser.storage.local.get(['serverUrl', 'authToken']);
    const config: Config = {
      serverUrl: (stored.serverUrl as string) || ConfigManager.DEFAULT_SERVER_URL,
      authToken: (stored.authToken as string) || ConfigManager.DEFAULT_AUTH_TOKEN,
    };

    this.api.updateConfig(config.serverUrl, config.authToken);
    return config;
  }

  async saveConfig(config: Partial<Config>): Promise<void> {
    await browser.storage.local.set(config);
  }
}
