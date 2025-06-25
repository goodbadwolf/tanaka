import { useEffect, useState } from 'preact/hooks';
import { useService } from '../../di/provider.js';
import type { IBrowser } from '../../browser/core.js';
import { trackedWindows, toggleWindowTracking, isWindowTracked } from '../../store/extension';
import { LoadingSpinner } from '../../components';

export function WindowTracker() {
  const browser = useService<IBrowser>('IBrowser');
  const [currentWindowId, setCurrentWindowId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeWindow = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const currentWindow = await browser.windows.getCurrent();
        if (!currentWindow.id) {
          throw new Error('Current window has no ID');
        }

        setCurrentWindowId(currentWindow.id);

        // Initialize tracked windows from background
        const message = { type: 'GET_TRACKED_WINDOWS' };
        const response = await browser.runtime.sendMessage(message);

        if ('windowIds' in response && 'titles' in response) {
          // Initialize the tracked windows state
          const windowsMap = new Map();
          response.windowIds.forEach((id: number, index: number) => {
            windowsMap.set(id, {
              id,
              title: response.titles?.[index],
              tracked: true,
            });
          });
          trackedWindows.value = windowsMap;
        } else if ('error' in response) {
          throw new Error(response.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    initializeWindow();
  }, [browser]);

  const handleToggle = async () => {
    if (!currentWindowId || isLoading) return;

    try {
      setError(null);
      const wasTracked = isWindowTracked(currentWindowId);

      // Optimistically update the UI
      toggleWindowTracking(currentWindowId);

      // Send message to background
      const message = wasTracked
        ? { type: 'UNTRACK_WINDOW', windowId: currentWindowId }
        : { type: 'TRACK_WINDOW', windowId: currentWindowId };

      const response = await browser.runtime.sendMessage(message);

      if ('error' in response) {
        // Revert on error
        toggleWindowTracking(currentWindowId);
        throw new Error(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (isLoading) {
    return (
      <div className="window-control">
        <LoadingSpinner size="small" />
        <span style={{ marginLeft: '8px' }}>Loading window status...</span>
      </div>
    );
  }

  const isTracked = currentWindowId ? isWindowTracked(currentWindowId) : false;

  return (
    <>
      <div className="window-control">
        <label>
          <input
            type="checkbox"
            checked={isTracked}
            onChange={handleToggle}
            disabled={!currentWindowId}
          />
          <span>Sync this window</span>
        </label>
      </div>

      <div className="status" id="status">
        {error ? (
          <p style={{ color: 'red' }}>Error: {error}</p>
        ) : isTracked ? (
          <p style={{ color: 'green' }}>✓ This window is being synced</p>
        ) : (
          <p>This window is not being synced</p>
        )}
      </div>
    </>
  );
}