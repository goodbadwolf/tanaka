import { injectable } from 'tsyringe';
import { BrowserTabs } from './tabs';
import { BrowserWindows } from './windows';
import { BrowserStorage } from './storage';
import { BrowserRuntime } from './runtime';
import type { IBrowser, ITabs, IWindows, ILocalStorage, IRuntime } from './core';

export * from './core';

@injectable()
export class Browser implements IBrowser {
  public readonly tabs: ITabs;
  public readonly windows: IWindows;
  public readonly localStorage: ILocalStorage;
  public readonly runtime: IRuntime;

  constructor() {
    this.tabs = new BrowserTabs();
    this.windows = new BrowserWindows();
    this.localStorage = new BrowserStorage();
    this.runtime = new BrowserRuntime();
  }
}
