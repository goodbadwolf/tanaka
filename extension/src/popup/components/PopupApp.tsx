import { useEffect } from 'preact/hooks';
import { WindowTracker } from './WindowTracker';
import { useService } from '../../di/provider';
import type { IBrowser } from '../../browser/core';
import { isLoading, error, initializePopup } from '../../store/popup';
import { LoadingSpinner, ErrorMessage } from '../../components';

export function PopupApp() {
  const browser = useService<IBrowser>('IBrowser');

  useEffect(() => {
    initializePopup(browser);
  }, [browser]);

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
