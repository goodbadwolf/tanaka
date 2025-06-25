import { effect } from '@preact/signals';
import {
  trackedWindows,
  syncStatus,
  isAnySyncing,
  trackedWindowCount,
  allTrackedWindowIds,
  trackWindow,
  untrackWindow,
  removeWindow,
  toggleWindowTracking,
  setSyncStatus,
  startSync,
  endSync,
  getTrackedWindow,
  isWindowTracked,
} from './extension';
import { waitForSignal } from '../test-utils/signals';

describe('Extension Store', () => {
  beforeEach(() => {
    trackedWindows.value = new Map();
    syncStatus.value = { syncing: false };
  });

  describe('Window Tracking', () => {
    it('tracks a window', () => {
      trackWindow(1, 'Window 1');

      expect(trackedWindows.value.size).toBe(1);
      expect(isWindowTracked(1)).toBe(true);

      const window = getTrackedWindow(1);
      expect(window).toEqual({
        id: 1,
        title: 'Window 1',
        tracked: true,
        lastSync: expect.any(Number),
      });
    });

    it('untracks a window', () => {
      trackWindow(1, 'Window 1');
      untrackWindow(1);

      expect(isWindowTracked(1)).toBe(false);
      const window = getTrackedWindow(1);
      expect(window?.tracked).toBe(false);
    });

    it('removes a window', () => {
      trackWindow(1, 'Window 1');
      removeWindow(1);

      expect(trackedWindows.value.size).toBe(0);
      expect(getTrackedWindow(1)).toBeUndefined();
    });

    it('toggles window tracking', () => {
      trackWindow(1, 'Window 1');
      expect(isWindowTracked(1)).toBe(true);

      toggleWindowTracking(1);
      expect(isWindowTracked(1)).toBe(false);

      toggleWindowTracking(1);
      expect(isWindowTracked(1)).toBe(true);
    });

    it('handles toggle for non-existent window', () => {
      toggleWindowTracking(999);
      expect(trackedWindows.value.size).toBe(0);
    });
  });

  describe('Computed Signals', () => {
    it('computes tracked window count', () => {
      expect(trackedWindowCount.value).toBe(0);

      trackWindow(1, 'Window 1');
      expect(trackedWindowCount.value).toBe(1);

      trackWindow(2, 'Window 2');
      expect(trackedWindowCount.value).toBe(2);

      untrackWindow(1);
      expect(trackedWindowCount.value).toBe(1);
    });

    it('computes all tracked window IDs', () => {
      expect(allTrackedWindowIds.value).toEqual([]);

      trackWindow(1, 'Window 1');
      trackWindow(2, 'Window 2');
      expect(allTrackedWindowIds.value).toEqual([1, 2]);

      untrackWindow(1);
      expect(allTrackedWindowIds.value).toEqual([2]);
    });
  });

  describe('Sync Status', () => {
    it('updates sync status', () => {
      setSyncStatus({ syncing: true });
      expect(syncStatus.value.syncing).toBe(true);

      setSyncStatus({ error: 'Network error' });
      expect(syncStatus.value).toEqual({
        syncing: true,
        error: 'Network error',
      });
    });

    it('starts sync', () => {
      syncStatus.value = { syncing: false, error: 'Previous error' };

      startSync();
      expect(syncStatus.value).toEqual({
        syncing: true,
        error: undefined,
      });
    });

    it('ends sync successfully', () => {
      startSync();
      endSync();

      expect(syncStatus.value.syncing).toBe(false);
      expect(syncStatus.value.lastSyncTime).toBeDefined();
      expect(syncStatus.value.error).toBeUndefined();
    });

    it('ends sync with error', () => {
      const previousSyncTime = Date.now() - 1000;
      syncStatus.value = { syncing: true, lastSyncTime: previousSyncTime };

      endSync('Connection failed');

      expect(syncStatus.value).toEqual({
        syncing: false,
        lastSyncTime: previousSyncTime,
        error: 'Connection failed',
      });
    });

    it('computes isAnySyncing', () => {
      expect(isAnySyncing.value).toBe(false);

      startSync();
      expect(isAnySyncing.value).toBe(true);

      endSync();
      expect(isAnySyncing.value).toBe(false);
    });
  });

  describe('Signal Updates and Subscriptions', () => {
    it('notifies subscribers when windows change', async () => {
      const updates: number[] = [];
      const dispose = effect(() => {
        updates.push(trackedWindowCount.value);
      });

      trackWindow(1);
      trackWindow(2);
      untrackWindow(1);

      await waitForSignal(trackedWindowCount, (count) => count === 1);

      expect(updates).toEqual([0, 1, 2, 1]);
      dispose();
    });

    it('notifies subscribers when sync status changes', async () => {
      const updates: boolean[] = [];
      const dispose = effect(() => {
        updates.push(isAnySyncing.value);
      });

      startSync();
      endSync();

      await waitForSignal(isAnySyncing, (syncing) => !syncing);

      expect(updates).toEqual([false, true, false]);
      dispose();
    });
  });
});
