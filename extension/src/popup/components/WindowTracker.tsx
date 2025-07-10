import { useCallback, useEffect, useState } from 'preact/hooks';
import type { IBrowser } from '../../browser/core';
import { LoadingSpinner } from '../../components/deprecated/LoadingSpinner';
import { useService } from '../../di/provider';
import {
  isWindowTracked,
  toggleWindowTracking,
  trackedWindows,
  trackWindow,
} from '../../store/extension';

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
        const response = (await browser.runtime.sendMessage(message)) as {
          windowIds?: number[];
          titles?: string[];
          error?: string;
        };

        if (response.windowIds) {
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
        } else if (response.error) {
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

  const handleToggle = useCallback(async () => {
    if (!currentWindowId || isLoading) return;

    try {
      setError(null);
      const wasTracked = isWindowTracked(currentWindowId);

      // Optimistically update the UI
      if (wasTracked) {
        toggleWindowTracking(currentWindowId);
      } else {
        trackWindow(currentWindowId);
      }

      // Send message to background
      const message = wasTracked
        ? { type: 'UNTRACK_WINDOW', windowId: currentWindowId }
        : { type: 'TRACK_WINDOW', windowId: currentWindowId };

      const response = (await browser.runtime.sendMessage(message)) as {
        success?: boolean;
        error?: string;
      };

      if (response.error) {
        // Revert on error
        toggleWindowTracking(currentWindowId);
        throw new Error(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [currentWindowId, isLoading, browser]);

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
