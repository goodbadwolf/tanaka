import { useSettings } from '../hooks/useSettings';
import { getConfig } from '../../config/index.js';
import browser from 'webextension-polyfill';

export function SettingsApp() {
  const { authToken, isSaving, saveStatus, saveAuthToken } = useSettings();
  const config = getConfig();
  const manifest = browser.runtime.getManifest();

  const handleSave = async (e: Event) => {
    e.preventDefault();
    const input = (e.currentTarget as HTMLFormElement).authToken as HTMLInputElement;
    await saveAuthToken(input.value);
  };

  return (
    <div className="container">
      <header>
        <h1>Tanaka Settings</h1>
        <p className="version">Version {manifest.version}</p>
      </header>

      <main>
        <section className="auth-section">
          <h2>Authentication</h2>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label htmlFor="auth-token">Auth Token</label>
              <input
                type="password"
                id="auth-token"
                name="authToken"
                defaultValue={authToken}
                placeholder="Enter your authentication token"
                disabled={isSaving}
              />
              <small className="help-text">
                This token is used to authenticate with the Tanaka server
              </small>
            </div>
            <button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Authentication'}
            </button>
          </form>
          
          {saveStatus && (
            <div
              className={`status-message ${saveStatus.type}`}
              style={{ display: 'block' }}
            >
              {saveStatus.message}
            </div>
          )}
        </section>

        <section className="server-info">
          <h2>Server Information</h2>
          <p id="server-info">Connected to: {config.serverUrl}</p>
        </section>
      </main>
    </div>
  );
}