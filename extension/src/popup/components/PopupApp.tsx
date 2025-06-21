import { useEffect, useState } from 'preact/hooks';
import { WindowTracker } from './WindowTracker';
import browser from 'webextension-polyfill';

export function PopupApp() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize popup
    const initializePopup = async () => {
      try {
        // Check if we can access the windows API
        const currentWindow = await browser.windows.getCurrent();
        if (!currentWindow.id) {
          throw new Error('Unable to get current window');
        }
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    };

    initializePopup();
  }, []);

  if (isLoading) {
    return (
      <div className="container">
        <h1>Tanaka</h1>
        <p className="subtitle">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <h1>Tanaka</h1>
        <p className="subtitle">Tab Synchronization</p>
        <div className="error">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Tanaka</h1>
      <p className="subtitle">Tab Synchronization</p>
      
      <WindowTracker />

      <div className="footer">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            browser.runtime.openOptionsPage();
            window.close();
          }}
        >
          Settings
        </a>
      </div>
    </div>
  );
}