import { signal, computed, effect } from '@preact/signals';

export interface UserSettings {
  authToken: string;
  syncInterval: number;
}

export interface SettingsState {
  settings: UserSettings;
  isLoading: boolean;
  isSaving: boolean;
  saveStatus: { type: 'success' | 'error'; message: string } | null;
}

const USER_SETTINGS_DEFAULTS: UserSettings = {
  authToken: 'unset-token',
  syncInterval: 5000,
};

export const settingsState = signal<SettingsState>({
  settings: USER_SETTINGS_DEFAULTS,
  isLoading: true,
  isSaving: false,
  saveStatus: null,
});

export const settings = computed(() => settingsState.value.settings);
export const authToken = computed(() => settingsState.value.settings.authToken);
export const syncInterval = computed(() => settingsState.value.settings.syncInterval);
export const isAuthenticated = computed(() => {
  const token = authToken.value;
  return !!(token && token !== 'unset-token' && token.trim().length > 0);
});

export const isLoading = computed(() => settingsState.value.isLoading);
export const isSaving = computed(() => settingsState.value.isSaving);
export const saveStatus = computed(() => settingsState.value.saveStatus);

let saveStatusTimer: ReturnType<typeof setTimeout> | null = null;

export function updateSettings(updates: Partial<UserSettings>) {
  settingsState.value = {
    ...settingsState.value,
    settings: {
      ...settingsState.value.settings,
      ...updates,
    },
  };
}

export function setLoadingState(loading: boolean) {
  settingsState.value = {
    ...settingsState.value,
    isLoading: loading,
  };
}

export function setSavingState(saving: boolean) {
  settingsState.value = {
    ...settingsState.value,
    isSaving: saving,
  };
}

export function setSaveStatus(status: { type: 'success' | 'error'; message: string } | null) {
  if (saveStatusTimer) {
    clearTimeout(saveStatusTimer);
    saveStatusTimer = null;
  }

  settingsState.value = {
    ...settingsState.value,
    saveStatus: status,
  };

  if (status) {
    saveStatusTimer = setTimeout(() => {
      setSaveStatus(null);
    }, 3000);
  }
}

export async function loadSettings(storage: {
  get: (keys: string[]) => Promise<Record<string, unknown>>;
}): Promise<void> {
  setLoadingState(true);
  try {
    const stored = await storage.get(['authToken', 'syncInterval']);
    const loadedSettings: UserSettings = {
      ...USER_SETTINGS_DEFAULTS,
    };
    if (stored.authToken !== undefined && stored.authToken !== null) {
      loadedSettings.authToken = String(stored.authToken);
    }
    if (stored.syncInterval !== undefined && stored.syncInterval !== null) {
      loadedSettings.syncInterval =
        typeof stored.syncInterval === 'string'
          ? parseInt(stored.syncInterval, 10) || USER_SETTINGS_DEFAULTS.syncInterval
          : Number(stored.syncInterval) || USER_SETTINGS_DEFAULTS.syncInterval;
    }
    settingsState.value = {
      ...settingsState.value,
      settings: loadedSettings,
      isLoading: false,
    };
  } catch (error) {
    setSaveStatus({
      type: 'error',
      message: 'Failed to load settings',
    });
    setLoadingState(false);
    throw error;
  }
}

export async function saveSettings(
  updates: Partial<UserSettings>,
  storage: { set: (data: Record<string, unknown>) => Promise<void> },
): Promise<void> {
  if ('authToken' in updates && !updates.authToken?.trim()) {
    setSaveStatus({
      type: 'error',
      message: 'Auth token is required',
    });
    throw new Error('Auth token is required');
  }

  setSavingState(true);
  setSaveStatus(null);

  try {
    const cleanedUpdates = { ...updates };
    if (cleanedUpdates.authToken) {
      cleanedUpdates.authToken = cleanedUpdates.authToken.trim();
    }

    await storage.set(cleanedUpdates);
    updateSettings(cleanedUpdates);

    setSaveStatus({
      type: 'success',
      message: 'Settings saved successfully',
    });
  } catch (error) {
    setSaveStatus({
      type: 'error',
      message: 'Failed to save settings',
    });
    throw error;
  } finally {
    setSavingState(false);
  }
}

export function resetSettings() {
  settingsState.value = {
    settings: USER_SETTINGS_DEFAULTS,
    isLoading: false,
    isSaving: false,
    saveStatus: null,
  };
}

let persistenceEffect: (() => void) | null = null;

export function enablePersistence(storage: {
  set: (data: Record<string, unknown>) => Promise<void>;
}) {
  if (persistenceEffect) {
    persistenceEffect();
  }

  persistenceEffect = effect(() => {
    const currentSettings = settings.value;
    if (!settingsState.value.isLoading) {
      storage.set({ ...currentSettings }).catch((error) => {
        console.error('Failed to persist settings:', error);
      });
    }
  });

  return () => {
    if (persistenceEffect) {
      persistenceEffect();
      persistenceEffect = null;
    }
  };
}

export function getSettingsForExport(): UserSettings {
  return { ...settings.value };
}
