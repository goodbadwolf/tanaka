/*
import { WindowTracker } from '../window-tracker';
import { beforeEach, describe, expect, it } from '@jest/globals';

describe('WindowTracker', () => {
  let windowTracker: WindowTracker;

  beforeEach(() => {
    windowTracker = new WindowTracker();
  });

  describe('track', () => {
    it('adds window ID to tracked set', () => {
      windowTracker.track(123);

      expect(windowTracker.isTracked(123)).toBe(true);
    });

    it('handles duplicate tracking gracefully', () => {
      windowTracker.track(123);
      windowTracker.track(123);

      expect(windowTracker.getTrackedCount()).toBe(1);
    });

    it('tracks multiple windows', () => {
      windowTracker.track(123);
      windowTracker.track(456);
      windowTracker.track(789);

      expect(windowTracker.getTrackedCount()).toBe(3);
      expect(windowTracker.isTracked(123)).toBe(true);
      expect(windowTracker.isTracked(456)).toBe(true);
      expect(windowTracker.isTracked(789)).toBe(true);
    });
  });

  describe('untrack', () => {
    it('removes window ID from tracked set', () => {
      windowTracker.track(123);
      windowTracker.untrack(123);

      expect(windowTracker.isTracked(123)).toBe(false);
    });

    it('handles untracking non-existent window gracefully', () => {
      windowTracker.untrack(999);

      expect(windowTracker.getTrackedCount()).toBe(0);
    });

    it('only removes specified window', () => {
      windowTracker.track(123);
      windowTracker.track(456);
      windowTracker.untrack(123);

      expect(windowTracker.isTracked(123)).toBe(false);
      expect(windowTracker.isTracked(456)).toBe(true);
      expect(windowTracker.getTrackedCount()).toBe(1);
    });
  });

  describe('isTracked', () => {
    it('returns false for untracked window', () => {
      expect(windowTracker.isTracked(123)).toBe(false);
    });

    it('returns true for tracked window', () => {
      windowTracker.track(123);

      expect(windowTracker.isTracked(123)).toBe(true);
    });

    it('returns correct status after untracking', () => {
      windowTracker.track(123);
      windowTracker.untrack(123);

      expect(windowTracker.isTracked(123)).toBe(false);
    });
  });

  describe('getTrackedWindows', () => {
    it('returns empty array when no windows are tracked', () => {
      const windows = windowTracker.getTrackedWindows();

      expect(windows).toEqual([]);
    });

    it('returns array of tracked window IDs', () => {
      windowTracker.track(123);
      windowTracker.track(456);
      windowTracker.track(789);

      const windows = windowTracker.getTrackedWindows();

      expect(windows).toHaveLength(3);
      expect(windows).toContain(123);
      expect(windows).toContain(456);
      expect(windows).toContain(789);
    });

    it('returns a new array instance', () => {
      windowTracker.track(123);

      const windows1 = windowTracker.getTrackedWindows();
      const windows2 = windowTracker.getTrackedWindows();

      expect(windows1).not.toBe(windows2);
      expect(windows1).toEqual(windows2);
    });
  });

  describe('getTrackedCount', () => {
    it('returns 0 when no windows are tracked', () => {
      expect(windowTracker.getTrackedCount()).toBe(0);
    });

    it('returns correct count of tracked windows', () => {
      windowTracker.track(123);
      windowTracker.track(456);

      expect(windowTracker.getTrackedCount()).toBe(2);
    });

    it('updates count after untracking', () => {
      windowTracker.track(123);
      windowTracker.track(456);
      windowTracker.untrack(123);

      expect(windowTracker.getTrackedCount()).toBe(1);
    });
  });

  describe('clear', () => {
    it('removes all tracked windows', () => {
      windowTracker.track(123);
      windowTracker.track(456);
      windowTracker.track(789);

      windowTracker.clear();

      expect(windowTracker.getTrackedCount()).toBe(0);
      expect(windowTracker.isTracked(123)).toBe(false);
      expect(windowTracker.isTracked(456)).toBe(false);
      expect(windowTracker.isTracked(789)).toBe(false);
    });

    it('works on empty tracker', () => {
      windowTracker.clear();

      expect(windowTracker.getTrackedCount()).toBe(0);
    });
  });

  describe('integration scenarios', () => {
    it('handles complex tracking/untracking sequence', () => {
      // Track some windows
      windowTracker.track(1);
      windowTracker.track(2);
      windowTracker.track(3);
      expect(windowTracker.getTrackedCount()).toBe(3);

      // Untrack one
      windowTracker.untrack(2);
      expect(windowTracker.getTrackedCount()).toBe(2);
      expect(windowTracker.isTracked(2)).toBe(false);

      // Track a new one
      windowTracker.track(4);
      expect(windowTracker.getTrackedCount()).toBe(3);

      // Clear all
      windowTracker.clear();
      expect(windowTracker.getTrackedCount()).toBe(0);

      // Track again
      windowTracker.track(5);
      expect(windowTracker.getTrackedCount()).toBe(1);
      expect(windowTracker.isTracked(5)).toBe(true);
    });
  });
});
*/
