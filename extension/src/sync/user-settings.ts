import { inject, injectable } from "tsyringe"
import type { IBrowser } from "../browser/core"

const USER_SETTINGS_DEFAULTS = {
  authToken: "unset-token",
  syncInterval: 5000,
}

export type UserSettings = typeof USER_SETTINGS_DEFAULTS

const USER_SETTINGS_KEYS = Object.keys(
  USER_SETTINGS_DEFAULTS,
) as (keyof UserSettings)[]

@injectable()
export class UserSettingsManager {
  constructor(@inject("IBrowser") private readonly browser: IBrowser) {}

  async load(): Promise<UserSettings> {
    const stored = await this.browser.localStorage.get(USER_SETTINGS_KEYS)

    return {
      ...USER_SETTINGS_DEFAULTS,
      ...stored,
    } as UserSettings
  }

  async save(settings: Partial<UserSettings>): Promise<void> {
    await this.browser.localStorage.set(settings)
  }

  async clear(): Promise<void> {
    await this.browser.localStorage.remove(USER_SETTINGS_KEYS)
  }
}
