import 'reflect-metadata';
import { container } from 'tsyringe';
import { UserSettingsManager } from '../sync/user-settings';
import { TanakaAPI } from '../api/api';
import { WindowTracker } from '../sync/window-tracker';
import { SyncManager } from '../sync/sync-manager';
import { TabEventHandler } from '../sync/tab-event-handler';
import { MessageHandler } from '../sync/message-handler';
import { getConfig } from '../config';

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
    return new SyncManager(api, windowTracker);
  },
});

// Register TabEventHandler with factory
container.register<TabEventHandler>(TabEventHandler, {
  useFactory: (dependencyContainer) => {
    const windowTracker = dependencyContainer.resolve(WindowTracker);
    const syncManager = dependencyContainer.resolve(SyncManager);
    return new TabEventHandler(windowTracker, syncManager);
  },
});

// Register MessageHandler with factory
container.register<MessageHandler>(MessageHandler, {
  useFactory: (dependencyContainer) => {
    const windowTracker = dependencyContainer.resolve(WindowTracker);
    const syncManager = dependencyContainer.resolve(SyncManager);
    return new MessageHandler(windowTracker, syncManager);
  },
});

export { container };
