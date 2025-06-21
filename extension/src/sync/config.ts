import browser from 'webextension-polyfill';
import { DEFAULT_CONFIG } from '../config/defaults';

export interface Config {
  serverUrl: string;
}

export class ConfigManager {
  async load(): Promise<Config> {
    const stored = await browser.storage.local.get(['serverUrl']);
    return {
      serverUrl: (stored.serverUrl as string) || DEFAULT_CONFIG.serverUrl,
    };
  }

  async save(config: Partial<Config>): Promise<void> {
    await browser.storage.local.set(config);
  }

  getDefaultConfig(): Config {
    return { ...DEFAULT_CONFIG };
  }
}
