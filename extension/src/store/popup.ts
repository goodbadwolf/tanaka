import { signal, computed } from '@preact/signals';
import type { Browser } from '../browser';

export interface PopupState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  currentWindowId: number | null;
}

export const popupState = signal<PopupState>({
  isInitialized: false,
  isLoading: true,
  error: null,
  currentWindowId: null,
});

export const isInitialized = computed(() => popupState.value.isInitialized);
export const isLoading = computed(() => popupState.value.isLoading);
export const error = computed(() => popupState.value.error);
export const currentWindowId = computed(() => popupState.value.currentWindowId);

export function setPopupState(updates: Partial<PopupState>) {
  popupState.value = {
    ...popupState.value,
    ...updates,
  };
}

export function setLoadingState(loading: boolean) {
  setPopupState({ isLoading: loading });
}

export function setError(errorMessage: string | null) {
  setPopupState({ error: errorMessage });
}

export function setCurrentWindow(windowId: number | null) {
  setPopupState({
    currentWindowId: windowId,
    isInitialized: windowId !== null,
  });
}

export async function initializePopup(browser: Browser): Promise<void> {
  try {
    setLoadingState(true);
    setError(null);

    const currentWindow = await browser.windows.getCurrent();
    if (!currentWindow.id) {
      throw new Error('Unable to get current window');
    }

    setCurrentWindow(currentWindow.id);
    setLoadingState(false);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unknown error');
    setLoadingState(false);
  }
}

export function resetPopupState() {
  popupState.value = {
    isInitialized: false,
    isLoading: true,
    error: null,
    currentWindowId: null,
  };
}
