import { useCallback, useEffect, useState } from 'preact/hooks';
import { useService } from '../../di/provider.js';
import type { IBrowser } from '../../browser/core.js';
import { debugError } from '../../utils/logger';
import { UserSettingsManager, type UserSettings } from '../../sync/user-settings';

interface SaveStatus {
  type: 'success' | 'error';
  message: string;
}

export function useSettings() {
  const browser = useService<IBrowser>('IBrowser');
  const manager = useService<UserSettingsManager>(UserSettingsManager);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus | null>(null);

  // Load current settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const loadedSettings = await manager.load();
        setSettings(loadedSettings);
      } catch (error) {
        debugError('Error loading settings:', error);
        setSaveStatus({
          type: 'error',
          message: 'Failed to load settings',
        });
      }
    };

    loadSettings();
  }, [manager]);

  const saveSettings = useCallback(
    async (updates: Partial<UserSettings>) => {
      if (!settings) return;

      // Validate auth token if it's being updated
      if ('authToken' in updates && !updates.authToken?.trim()) {
        setSaveStatus({
          type: 'error',
          message: 'Auth token is required',
        });
        setTimeout(() => setSaveStatus(null), 3000);
        return;
      }

      setIsSaving(true);
      setSaveStatus(null);

      try {
        // Trim auth token if provided
        const cleanedUpdates = { ...updates };
        if (cleanedUpdates.authToken) {
          cleanedUpdates.authToken = cleanedUpdates.authToken.trim();
        }

        await manager.save(cleanedUpdates);
        await browser.runtime.sendMessage({ type: 'SETTINGS_UPDATED' });

        // Update local state
        setSettings({ ...settings, ...cleanedUpdates });

        setSaveStatus({
          type: 'success',
          message: 'Settings saved successfully',
        });
      } catch (error) {
        debugError('Error saving settings:', error);
        setSaveStatus({
          type: 'error',
          message: 'Failed to save settings',
        });
      } finally {
        setIsSaving(false);
        setTimeout(() => setSaveStatus(null), 3000);
      }
    },
    [settings, manager, browser],
  );

  return {
    settings,
    isSaving,
    saveStatus,
    saveSettings,
  };
}
