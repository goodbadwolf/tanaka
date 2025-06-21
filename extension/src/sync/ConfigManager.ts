import browser from 'webextension-polyfill';
import type { TanakaAPI } from '../api';
import { DEFAULT_CONFIG } from '../config/defaults';

export interface Config {
  serverUrl: string;
  authToken: string;
}

export class ConfigManager {
  constructor(private readonly api: TanakaAPI) {}

  async loadConfig(): Promise<Config> {
    const stored = await browser.storage.local.get(['serverUrl', 'authToken']);
    const config: Config = {
      serverUrl: (stored.serverUrl as string) || DEFAULT_CONFIG.serverUrl,
      authToken: (stored.authToken as string) || DEFAULT_CONFIG.authToken,
    };

    this.api.updateConfig(config.serverUrl, config.authToken);
    return config;
  }

  async saveConfig(config: Partial<Config>): Promise<void> {
    await browser.storage.local.set(config);
  }
}
