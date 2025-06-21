import browser from 'webextension-polyfill';

const USER_SETTINGS_DEFAULTS = {
  authToken: 'unset-token',
  syncInterval: 5000,
};

export type UserSettings = typeof USER_SETTINGS_DEFAULTS;

const USER_SETTINGS_KEYS = Object.keys(USER_SETTINGS_DEFAULTS) as (keyof UserSettings)[];

export class UserSettingsManager {
  async load(): Promise<UserSettings> {
    const stored = await browser.storage.local.get(USER_SETTINGS_KEYS);

    return {
      ...USER_SETTINGS_DEFAULTS,
      ...stored,
    } as UserSettings;
  }

  async save(settings: Partial<UserSettings>): Promise<void> {
    await browser.storage.local.set(settings);
  }

  async clear(): Promise<void> {
    await browser.storage.local.remove(USER_SETTINGS_KEYS);
  }
}
