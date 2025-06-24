import { useEffect, useState } from 'preact/hooks';
import browser from 'webextension-polyfill';
import { getConfig } from '../config/index.js';

interface ExtensionState {
  isLoading: boolean;
  isConfigured: boolean;
  serverUrl: string;
  error: string | null;
}

export function useExtensionState() {
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExtensionState = async () => {
      try {
        // Get server URL from config
        const config = getConfig();
        const configServerUrl = config.serverUrl || '';
        setServerUrl(configServerUrl);

        // Check if auth token exists
        const result = (await browser.storage.local.get(['authToken'])) as { authToken?: string };
        const hasAuthToken = Boolean(result.authToken);

        // Extension is configured if both server URL and auth token exist
        setIsConfigured(Boolean(configServerUrl) && hasAuthToken);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load extension state';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadExtensionState();
  }, []);

  return {
    isLoading,
    isConfigured,
    serverUrl,
    error,
  } satisfies ExtensionState;
}
