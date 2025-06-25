import { signal, computed, effect, Signal } from '@preact/signals';
import { act } from '@testing-library/preact';

export function createTestSignal<T>(initialValue: T): Signal<T> {
  return signal(initialValue);
}

export async function waitForSignal<T>(
  sig: Signal<T>,
  predicate: (value: T) => boolean,
  timeout = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Signal wait timeout'));
    }, timeout);

    const dispose = effect(() => {
      if (predicate(sig.value)) {
        clearTimeout(timeoutId);
        dispose();
        resolve(sig.value);
      }
    });
  });
}

export function flushSignalUpdates() {
  return act(() => {
    return Promise.resolve();
  });
}

export function mockSignalStorage() {
  const storage: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => storage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key];
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
    get storage() {
      return { ...storage };
    }
  };
}