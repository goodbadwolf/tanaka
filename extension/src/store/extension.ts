import { signal, computed } from '@preact/signals';

export interface TrackedWindow {
  id: number;
  title?: string;
  tracked: boolean;
  lastSync?: number;
}

export interface SyncStatus {
  syncing: boolean;
  lastSyncTime?: number;
  error?: string;
}

export const trackedWindows = signal<Map<number, TrackedWindow>>(new Map());

export const syncStatus = signal<SyncStatus>({
  syncing: false,
});

export const isAnySyncing = computed(() => syncStatus.value.syncing);

export const trackedWindowCount = computed(() => {
  return Array.from(trackedWindows.value.values()).filter(w => w.tracked).length;
});

export const allTrackedWindowIds = computed(() => {
  return Array.from(trackedWindows.value.entries())
    .filter(([_, window]) => window.tracked)
    .map(([id]) => id);
});

export function trackWindow(windowId: number, title?: string) {
  const updatedWindows = new Map(trackedWindows.value);
  updatedWindows.set(windowId, {
    id: windowId,
    title,
    tracked: true,
    lastSync: Date.now(),
  });
  trackedWindows.value = updatedWindows;
}

export function untrackWindow(windowId: number) {
  const updatedWindows = new Map(trackedWindows.value);
  const window = updatedWindows.get(windowId);
  if (window) {
    updatedWindows.set(windowId, {
      ...window,
      tracked: false,
    });
    trackedWindows.value = updatedWindows;
  }
}

export function removeWindow(windowId: number) {
  const updatedWindows = new Map(trackedWindows.value);
  updatedWindows.delete(windowId);
  trackedWindows.value = updatedWindows;
}

export function toggleWindowTracking(windowId: number) {
  const window = trackedWindows.value.get(windowId);
  if (window) {
    if (window.tracked) {
      untrackWindow(windowId);
    } else {
      trackWindow(windowId, window.title);
    }
  }
}

export function setSyncStatus(status: Partial<SyncStatus>) {
  syncStatus.value = {
    ...syncStatus.value,
    ...status,
  };
}

export function startSync() {
  setSyncStatus({ syncing: true, error: undefined });
}

export function endSync(error?: string) {
  setSyncStatus({
    syncing: false,
    lastSyncTime: error ? syncStatus.value.lastSyncTime : Date.now(),
    error,
  });
}

export function getTrackedWindow(windowId: number): TrackedWindow | undefined {
  return trackedWindows.value.get(windowId);
}

export function isWindowTracked(windowId: number): boolean {
  const window = trackedWindows.value.get(windowId);
  return window?.tracked ?? false;
}