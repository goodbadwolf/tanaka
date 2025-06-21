import { useCallback, useEffect, useState } from 'preact/hooks';
import browser from 'webextension-polyfill';
import type { Message, MessageResponse } from '../../core.js';

export function useWindowTracking() {
  const [isTracked, setIsTracked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [windowId, setWindowId] = useState<number | null>(null);

  // Get current window tracking status
  useEffect(() => {
    const checkTrackingStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const currentWindow = await browser.windows.getCurrent();
        if (!currentWindow.id) {
          throw new Error('Current window has no ID');
        }

        setWindowId(currentWindow.id);

        const message: Message = { type: 'GET_TRACKED_WINDOWS' };
        const response = (await browser.runtime.sendMessage(message)) as MessageResponse;

        if ('windowIds' in response) {
          setIsTracked(response.windowIds.includes(currentWindow.id));
        } else if ('error' in response) {
          throw new Error(response.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    checkTrackingStatus();
  }, []);

  const toggleTracking = useCallback(async () => {
    if (!windowId || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      const message: Message = isTracked
        ? { type: 'UNTRACK_WINDOW', windowId }
        : { type: 'TRACK_WINDOW', windowId };

      const response = (await browser.runtime.sendMessage(message)) as MessageResponse;

      if ('error' in response) {
        throw new Error(response.error);
      } else {
        setIsTracked(!isTracked);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Revert the checkbox state on error
      setIsTracked(isTracked);
    } finally {
      setIsLoading(false);
    }
  }, [windowId, isTracked, isLoading]);

  return {
    isTracked,
    isLoading,
    error,
    toggleTracking,
  };
}