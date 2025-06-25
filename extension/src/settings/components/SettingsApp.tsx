import { useEffect } from 'preact/hooks';
import { getConfig } from '../../config/index';
import { useService } from '../../di/provider';
import type { IBrowser } from '../../browser/core';
import {
  settings,
  isLoading,
  isSaving,
  saveStatus,
  loadSettings,
  saveSettings as saveSettingsToStore,
  enablePersistence,
} from '../../store/settings';
import { Button, Input, Card, ErrorMessage, LoadingSpinner } from '../../components';

export function SettingsApp() {
  const browser = useService<IBrowser>('IBrowser');
  const config = getConfig();
  const manifest = browser.runtime.getManifest();

  useEffect(() => {
    // Load settings on mount
    loadSettings(browser.localStorage);

    // Enable auto-persistence
    const dispose = enablePersistence(browser.localStorage);

    return dispose;
  }, [browser]);

  const handleSave = async (e: Event) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const authTokenInput = form.authToken as HTMLInputElement;
    const syncIntervalInput = form.syncInterval as HTMLInputElement;

    try {
      await saveSettingsToStore(
        {
          authToken: authTokenInput.value,
          syncInterval: parseInt(syncIntervalInput.value, 10) * 1000,
        },
        browser.localStorage,
      );

      // Notify background script
      await browser.runtime.sendMessage({ type: 'SETTINGS_UPDATED' });
    } catch {
      // Error is already handled by the store
    }
  };

  if (isLoading.value) {
    return (
      <div className="container">
        <header>
          <h1>Tanaka Settings</h1>
          <p className="version">Version {manifest.version}</p>
        </header>
        <main>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
            }}
          >
            <LoadingSpinner size="large" />
            <span style={{ marginLeft: '12px' }}>Loading settings...</span>
          </div>
        </main>
      </div>
    );
  }

  const currentSettings = settings.value;
  const saving = isSaving.value;
  const status = saveStatus.value;

  return (
    <div className="container">
      <header>
        <h1>Tanaka Settings</h1>
        <p className="version">Version {manifest.version}</p>
      </header>

      <main>
        <form onSubmit={handleSave}>
          <Card header="Authentication" padding="medium">
            <Input
              id="auth-token"
              name="authToken"
              type="password"
              label="Auth Token"
              defaultValue={
                currentSettings.authToken === 'unset-token' ? '' : currentSettings.authToken
              }
              placeholder="Enter your authentication token"
              disabled={saving}
              helperText="This token is used to authenticate with the Tanaka server"
              required
            />
          </Card>

          <Card header="Synchronization" padding="medium">
            <Input
              id="sync-interval"
              name="syncInterval"
              type="number"
              label="Sync Interval (seconds)"
              defaultValue={(currentSettings.syncInterval / 1000).toString()}
              disabled={saving}
              helperText="How often to sync tabs with the server (1-60 seconds)"
              required
            />
          </Card>

          <div className="form-actions">
            <Button type="submit" disabled={saving} loading={saving}>
              Save Settings
            </Button>
          </div>

          {status && (
            <ErrorMessage
              type={status.type === 'success' ? 'info' : 'error'}
              message={status.message}
              dismissible={false}
            />
          )}
        </form>

        <Card header="Server Information" padding="medium" variant="outlined">
          <p id="server-info">Connected to: {config.serverUrl}</p>
        </Card>
      </main>
    </div>
  );
}
