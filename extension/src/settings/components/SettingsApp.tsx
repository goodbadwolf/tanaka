import { useSettings } from '../hooks/useSettings';
import { getConfig } from '../../config/index.js';
import { Browser } from '../../browser/index.js';

const browser = new Browser();

export function SettingsApp() {
  const { settings, isSaving, saveStatus, saveSettings } = useSettings();
  const config = getConfig();
  const manifest = browser.runtime.getManifest();

  const handleSave = async (e: Event) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const authTokenInput = form.authToken as HTMLInputElement;
    const syncIntervalInput = form.syncInterval as HTMLInputElement;

    await saveSettings({
      authToken: authTokenInput.value,
      syncInterval: parseInt(syncIntervalInput.value, 10) * 1000, // Convert seconds to milliseconds
    });
  };

  if (!settings) {
    return (
      <div className="container">
        <header>
          <h1>Tanaka Settings</h1>
          <p className="version">Version {manifest.version}</p>
        </header>
        <main>
          <p>Loading settings...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="container">
      <header>
        <h1>Tanaka Settings</h1>
        <p className="version">Version {manifest.version}</p>
      </header>

      <main>
        <form onSubmit={handleSave}>
          <section className="auth-section">
            <h2>Authentication</h2>
            <div className="form-group">
              <label htmlFor="auth-token">Auth Token</label>
              <input
                type="password"
                id="auth-token"
                name="authToken"
                defaultValue={settings.authToken === 'unset-token' ? '' : settings.authToken}
                placeholder="Enter your authentication token"
                disabled={isSaving}
              />
              <small className="help-text">
                This token is used to authenticate with the Tanaka server
              </small>
            </div>
          </section>

          <section className="sync-section">
            <h2>Synchronization</h2>
            <div className="form-group">
              <label htmlFor="sync-interval">Sync Interval (seconds)</label>
              <input
                type="number"
                id="sync-interval"
                name="syncInterval"
                min="1"
                max="60"
                defaultValue={settings.syncInterval / 1000} // Convert milliseconds to seconds for display
                disabled={isSaving}
              />
              <small className="help-text">
                How often to sync tabs with the server (1-60 seconds)
              </small>
            </div>
          </section>

          <div className="form-actions">
            <button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          {saveStatus && (
            <div className={`status-message ${saveStatus.type}`} style={{ display: 'block' }}>
              {saveStatus.message}
            </div>
          )}
        </form>

        <section className="server-info">
          <h2>Server Information</h2>
          <p id="server-info">Connected to: {config.serverUrl}</p>
        </section>
      </main>
    </div>
  );
}
