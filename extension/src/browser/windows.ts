import browser, { type Windows } from 'webextension-polyfill';
import type { IWindows } from './core';

export class BrowserWindows implements IWindows {
  getCurrent(): Promise<Windows.Window> {
    return browser.windows.getCurrent();
  }

  getAll(getInfo?: Windows.GetAllGetInfoType): Promise<Windows.Window[]> {
    return browser.windows.getAll(getInfo);
  }

  onRemoved = browser.windows.onRemoved;
}
