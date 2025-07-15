import browser from 'webextension-polyfill';
import type { ILocalStorage } from './core';

export class BrowserStorage implements ILocalStorage {
  get(keys?: string | string[] | null): Promise<Record<string, unknown>> {
    return browser.storage.local.get(keys);
  }

  set(items: Record<string, unknown>): Promise<void> {
    return browser.storage.local.set(items);
  }

  remove(keys: string | string[]): Promise<void> {
    return browser.storage.local.remove(keys);
  }

  clear(): Promise<void> {
    return browser.storage.local.clear();
  }
}
