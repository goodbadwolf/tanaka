import 'reflect-metadata';
import { container } from 'tsyringe';
import { UserSettingsManager } from '../sync/user-settings';
import { TanakaAPI } from '../api/api';
import { WindowTracker } from '../sync/window-tracker';
import { SyncManager } from '../sync/sync-manager';
import { TabEventHandler } from '../sync/tab-event-handler';
import { MessageHandler } from '../sync/message-handler';
import { getConfig } from '../config';
import { MockBrowser } from '../browser/mock';
import type { IBrowser } from '../browser/core';

// Create webapp container
const webappContainer = container.createChildContainer();

// Register mock browser
webappContainer.register<IBrowser>('IBrowser', {
  useClass: MockBrowser,
});

// Register singleton instances
webappContainer.registerSingleton<UserSettingsManager>(UserSettingsManager);
webappContainer.registerSingleton<WindowTracker>(WindowTracker);

// Register TanakaAPI with factory
webappContainer.register<TanakaAPI>(TanakaAPI, {
  useFactory: () => new TanakaAPI(getConfig().serverUrl),
});

// Register SyncManager as singleton
webappContainer.registerSingleton<SyncManager>(SyncManager);

// Register TabEventHandler as singleton
webappContainer.registerSingleton<TabEventHandler>(TabEventHandler);

// Register MessageHandler with factory
webappContainer.register<MessageHandler>(MessageHandler, {
  useFactory: (dependencyContainer) => {
    const windowTracker = dependencyContainer.resolve(WindowTracker);
    const syncManager = dependencyContainer.resolve(SyncManager);
    return new MessageHandler(windowTracker, syncManager);
  },
});

export { webappContainer };
