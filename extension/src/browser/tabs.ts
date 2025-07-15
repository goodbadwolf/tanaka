import browser, { type Tabs } from 'webextension-polyfill';
import type { ITabs } from './core';

export class BrowserTabs implements ITabs {
  query(queryInfo: Tabs.QueryQueryInfoType): Promise<Tabs.Tab[]> {
    return browser.tabs.query(queryInfo);
  }

  create(createProperties: Tabs.CreateCreatePropertiesType): Promise<Tabs.Tab> {
    return browser.tabs.create(createProperties);
  }

  remove(tabId: number): Promise<void> {
    return browser.tabs.remove(tabId);
  }

  update(tabId: number, updateProperties: Tabs.UpdateUpdatePropertiesType): Promise<Tabs.Tab> {
    return browser.tabs.update(tabId, updateProperties);
  }

  move(tabId: number, moveProperties: Tabs.MoveMovePropertiesType): Promise<Tabs.Tab> {
    return browser.tabs.move(tabId, moveProperties) as Promise<Tabs.Tab>;
  }

  onCreated = browser.tabs.onCreated;
  onRemoved = browser.tabs.onRemoved;
  onUpdated = browser.tabs.onUpdated;
  onMoved = browser.tabs.onMoved;
}
