import { useCallback, useEffect } from 'preact/hooks';
import type { IBrowser } from '../../browser/core';
import { ErrorMessage } from '../../components/deprecated/ErrorMessage';
import { LoadingSpinner } from '../../components/deprecated/LoadingSpinner';
import { useService } from '../../di/provider';
import { error, initializePopup, isLoading } from '../../store/popup';
import { WindowTracker } from './WindowTracker';

export function PopupApp() {
  const browser = useService<IBrowser>('IBrowser');

  useEffect(() => {
    initializePopup(browser);
  }, [browser]);

  const handleSettingsClick = useCallback(
    (e: Event) => {
      e.preventDefault();
      browser.runtime.openOptionsPage();
      window.close();
    },
    [browser],
  );

  const loading = isLoading.value;
  const errorMessage = error.value;

  if (loading) {
    return (
      <div className="container">
        <h1>Tanaka</h1>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <LoadingSpinner size="medium" />
          <span style={{ marginLeft: '8px' }}>Loading...</span>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="container">
        <h1>Tanaka</h1>
        <p className="subtitle">Tab Synchronization</p>
        <ErrorMessage type="error" message={errorMessage} dismissible={false} />
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Tanaka</h1>
      <p className="subtitle">Tab Synchronization</p>

      <WindowTracker />

      <div className="footer">
        <a href="#" onClick={handleSettingsClick}>
          Settings
        </a>
      </div>
    </div>
  );
}
