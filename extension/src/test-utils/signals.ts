import { signal, effect, Signal } from '@preact/signals';
import { act } from '@testing-library/preact';

export function createTestSignal<T>(initialValue: T): Signal<T> {
  return signal(initialValue);
}

export async function waitForSignal<T>(
  sig: Signal<T>,
  predicate: (value: T) => boolean,
  timeout = 1000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Signal wait timeout'));
    }, timeout);

    let dispose: (() => void) | null = null;
    dispose = effect(() => {
      if (predicate(sig.value)) {
        clearTimeout(timeoutId);
        if (dispose) dispose();
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
      Reflect.deleteProperty(storage, key);
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach((key) => {
        Reflect.deleteProperty(storage, key);
      });
    }),
    get: jest.fn(async (keys: string[]) => {
      const result: Record<string, string | undefined> = {};
      for (const key of keys) {
        result[key] = storage[key];
      }
      return result;
    }),
    set: jest.fn(async (data: Record<string, unknown>): Promise<void> => {
      for (const [key, value] of Object.entries(data)) {
        storage[key] = String(value);
      }
    }),
    get storage() {
      return { ...storage };
    },
  };
}