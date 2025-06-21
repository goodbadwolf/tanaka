export class WindowTracker {
  private trackedWindows = new Set<number>();

  track(windowId: number): void {
    this.trackedWindows.add(windowId);
  }

  untrack(windowId: number): void {
    this.trackedWindows.delete(windowId);
  }

  isTracked(windowId: number): boolean {
    return this.trackedWindows.has(windowId);
  }

  getTrackedWindows(): number[] {
    return Array.from(this.trackedWindows);
  }

  getTrackedCount(): number {
    return this.trackedWindows.size;
  }

  clear(): void {
    this.trackedWindows.clear();
  }
}
