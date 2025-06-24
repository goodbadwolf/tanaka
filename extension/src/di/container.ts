import 'reflect-metadata';
import { container } from 'tsyringe';
import { UserSettingsManager } from '../sync/user-settings';
import { TanakaAPI } from '../api/api';
import { WindowTracker } from '../sync/window-tracker';
import { SyncManager } from '../sync/sync-manager';
import { TabEventHandler } from '../sync/tab-event-handler';
import { MessageHandler } from '../sync/message-handler';
import { getConfig } from '../config';
import { Browser } from '../browser';
import type { IBrowser } from '../browser/core';

// Register browser adapter
container.register<IBrowser>('IBrowser', {
  useClass: Browser,
});

// Register singleton instances
container.registerSingleton<UserSettingsManager>(UserSettingsManager);
container.registerSingleton<WindowTracker>(WindowTracker);

// Register TanakaAPI with factory
container.register<TanakaAPI>(TanakaAPI, {
  useFactory: () => new TanakaAPI(getConfig().serverUrl),
});

// Register SyncManager with factory
container.register<SyncManager>(SyncManager, {
  useFactory: (dependencyContainer) => {
    const api = dependencyContainer.resolve(TanakaAPI);
    const windowTracker = dependencyContainer.resolve(WindowTracker);
    const userSettingsManager = dependencyContainer.resolve(UserSettingsManager);
    return new SyncManager(api, windowTracker, userSettingsManager);
  },
});

// Register TabEventHandler as singleton
container.registerSingleton<TabEventHandler>(TabEventHandler);

// Register MessageHandler with factory
container.register<MessageHandler>(MessageHandler, {
  useFactory: (dependencyContainer) => {
    const windowTracker = dependencyContainer.resolve(WindowTracker);
    const syncManager = dependencyContainer.resolve(SyncManager);
    return new MessageHandler(windowTracker, syncManager);
  },
});

export { container };

// Export a factory function for creating test containers
export function createTestContainer(): typeof container {
  const testContainer = container.createChildContainer();
  return testContainer;
}
