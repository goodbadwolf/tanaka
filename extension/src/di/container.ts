import 'reflect-metadata';
import { container } from 'tsyringe';
import { UserSettingsManager } from '../sync/user-settings';
import { TanakaAPI } from '../api/api';
import { WindowTracker } from '../sync/window-tracker';
import { SyncManager, SyncManagerWithWorker } from '../sync';
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
  useFactory: () =>
    new TanakaAPI(getConfig().serverUrl, {
      enableRetry: true,
      maxRetryAttempts: 3,
      enableCircuitBreaker: true,
    }),
});

// Register SyncManager as singleton
// Always use worker-based sync manager for better performance
container.register<SyncManager>(SyncManager, {
  useClass: SyncManagerWithWorker as unknown as typeof SyncManager,
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
