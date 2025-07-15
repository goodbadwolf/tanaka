import browser from 'webextension-polyfill';
import type { IRuntime } from './core';

export class BrowserRuntime implements IRuntime {
  getManifest(): { version: string; [key: string]: unknown } {
    return browser.runtime.getManifest() as unknown as {
      version: string;
      [key: string]: unknown;
    };
  }

  openOptionsPage(): Promise<void> {
    return browser.runtime.openOptionsPage();
  }

  sendMessage(message: unknown): Promise<unknown> {
    return browser.runtime.sendMessage(message);
  }

  onMessage = browser.runtime.onMessage;
}
