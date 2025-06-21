import { describe, it, expect, beforeEach } from '@jest/globals';
import { WindowTracker } from '../window-tracker';

describe('WindowTracker', () => {
  let tracker: WindowTracker;

  beforeEach(() => {
    tracker = new WindowTracker();
  });

  it('should track and untrack windows', () => {
    expect(tracker.getTrackedCount()).toBe(0);
    expect(tracker.isTracked(1)).toBe(false);

    tracker.track(1);
    expect(tracker.getTrackedCount()).toBe(1);
    expect(tracker.isTracked(1)).toBe(true);

    tracker.track(2);
    expect(tracker.getTrackedCount()).toBe(2);
    expect(tracker.isTracked(2)).toBe(true);

    tracker.untrack(1);
    expect(tracker.getTrackedCount()).toBe(1);
    expect(tracker.isTracked(1)).toBe(false);
    expect(tracker.isTracked(2)).toBe(true);
  });

  it('should return tracked window IDs', () => {
    tracker.track(1);
    tracker.track(2);
    tracker.track(3);

    const windowIds = tracker.getTrackedWindows();
    expect(windowIds).toHaveLength(3);
    expect(windowIds).toContain(1);
    expect(windowIds).toContain(2);
    expect(windowIds).toContain(3);
  });

  it('should handle duplicate track calls', () => {
    tracker.track(1);
    tracker.track(1);
    expect(tracker.getTrackedCount()).toBe(1);
  });

  it('should clear all tracked windows', () => {
    tracker.track(1);
    tracker.track(2);
    tracker.track(3);
    expect(tracker.getTrackedCount()).toBe(3);

    tracker.clear();
    expect(tracker.getTrackedCount()).toBe(0);
    expect(tracker.getTrackedWindows()).toHaveLength(0);
  });
});
