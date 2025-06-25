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

  const mockStorage = {
    getItem: jest.fn((key: string) => storage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete storage[key];
    }),
    clear: jest.fn(() => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      Object.keys(storage).forEach((key) => delete storage[key]);
    }),
    get storage() {
      return { ...storage };
    },
    get: jest.fn(async (keys: string[]) => {
      const result: Record<string, unknown> = {};
      keys.forEach((key) => {
        const value = storage[key];
        if (value !== undefined) {
          result[key] = value;
        }
      });
      return result;
    }),
    set: jest.fn(async (data: Record<string, unknown>) => {
      Object.entries(data).forEach(([key, value]) => {
        storage[key] = String(value);
      });
    }),
  };

  return mockStorage;
}
