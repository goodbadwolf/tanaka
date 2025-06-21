import { useCallback, useEffect, useState } from 'preact/hooks';
import browser from 'webextension-polyfill';

interface SaveStatus {
  type: 'success' | 'error';
  message: string;
}

export function useSettings() {
  const [authToken, setAuthToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus | null>(null);

  // Load current settings
  useEffect(() => {
    const loadSettings = async () => {
      const result = await browser.storage.local.get(['authToken']);
      setAuthToken(result.authToken || '');
    };

    loadSettings();
  }, []);

  const saveAuthToken = useCallback(async (token: string) => {
    const trimmedToken = token.trim();
    
    if (!trimmedToken) {
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
      await browser.storage.local.set({ authToken: trimmedToken });
      await browser.runtime.sendMessage({ type: 'SETTINGS_UPDATED' });
      
      setSaveStatus({
        type: 'success',
        message: 'Authentication saved successfully',
      });
      setAuthToken(trimmedToken);
    } catch (error) {
      console.error('Error saving authentication:', error);
      setSaveStatus({
        type: 'error',
        message: 'Failed to save authentication',
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  }, []);

  return {
    authToken,
    isSaving,
    saveStatus,
    saveAuthToken,
  };
}