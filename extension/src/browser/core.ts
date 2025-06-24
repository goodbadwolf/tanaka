import type { Tabs, Windows, Runtime } from 'webextension-polyfill';

export interface IEventEmitter<T extends unknown[]> {
  addListener(callback: (...args: T) => void): void;
  removeListener(callback: (...args: T) => void): void;
}

export interface ITabs {
  query(queryInfo: Tabs.QueryQueryInfoType): Promise<Tabs.Tab[]>;
  create(createProperties: Tabs.CreateCreatePropertiesType): Promise<Tabs.Tab>;
  remove(tabId: number): Promise<void>;
  update(tabId: number, updateProperties: Tabs.UpdateUpdatePropertiesType): Promise<Tabs.Tab>;
  move(tabId: number, moveProperties: Tabs.MoveMovePropertiesType): Promise<Tabs.Tab>;
  onCreated: IEventEmitter<[tab: Tabs.Tab]>;
  onRemoved: IEventEmitter<[tabId: number, removeInfo: Tabs.OnRemovedRemoveInfoType]>;
  onUpdated: IEventEmitter<
    [tabId: number, changeInfo: Tabs.OnUpdatedChangeInfoType, tab: Tabs.Tab]
  >;
  onMoved: IEventEmitter<[tabId: number, moveInfo: Tabs.OnMovedMoveInfoType]>;
}

export interface IWindows {
  getCurrent(): Promise<Windows.Window>;
  getAll(getInfo?: Windows.GetAllGetInfoType): Promise<Windows.Window[]>;
  onRemoved: IEventEmitter<[windowId: number]>;
}

export interface ILocalStorage {
  get(keys?: string | string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
  clear(): Promise<void>;
}

export interface IRuntime {
  getManifest(): { version: string; [key: string]: unknown };
  openOptionsPage(): Promise<void>;
  sendMessage(message: unknown): Promise<unknown>;
  onMessage: IEventEmitter<
    [message: unknown, sender: Runtime.MessageSender, sendResponse: (response?: unknown) => void]
  >;
}

export interface IBrowser {
  tabs: ITabs;
  windows: IWindows;
  localStorage: ILocalStorage;
  runtime: IRuntime;
}
