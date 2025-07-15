import { vi } from "vitest"

// Mock browser API for tests
global.chrome = {
  runtime: {
    id: "test-extension-id",
  },
} as typeof chrome

// Mock webextension-polyfill
vi.mock("webextension-polyfill", () => ({
  default: {
    runtime: {
      id: "test-extension-id",
      getManifest: () => ({ version: "1.0.0" }),
    },
    storage: {
      local: {
        get: vi.fn(),
        set: vi.fn(),
      },
    },
  },
}))
