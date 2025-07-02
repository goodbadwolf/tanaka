export { WindowTracker } from './window-tracker';
export { SyncManager } from './sync-manager';
export { AdaptiveSyncManager } from './adaptive-sync-manager';
export { TabEventHandler } from './tab-event-handler';
export { UserSettingsManager, type UserSettings } from './user-settings';
export { MessageHandler } from './message-handler';

import type { TanakaAPI } from '../api/api';
import type { IBrowser } from '../browser/core';
import type { WindowTracker } from './window-tracker';
import { SyncManager } from './sync-manager';

// Feature flag to enable adaptive sync
export const ENABLE_ADAPTIVE_SYNC = process.env.ENABLE_ADAPTIVE_SYNC === 'true';

interface SyncManagerConfig {
  syncIntervalMs?: number;
  deviceId?: string;
  api: TanakaAPI;
  windowTracker: WindowTracker;
  browser: IBrowser;
}

// Factory function to create the appropriate sync manager
export async function createSyncManager(config: SyncManagerConfig) {
  if (ENABLE_ADAPTIVE_SYNC) {
    const { AdaptiveSyncManager } = await import('./adaptive-sync-manager');
    return new AdaptiveSyncManager(config);
  } else {
    return new SyncManager(config);
  }
}
