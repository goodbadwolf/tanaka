/**
 * Development-only logger utility
 * Only logs messages when NODE_ENV is 'development'
 */

export function debugLog(...args: unknown[]) {
  if (process.env.NODE_ENV === "development") {
    console.info("[Tanaka Debug]", ...args)
  }
}

export function debugError(...args: unknown[]) {
  if (process.env.NODE_ENV === "development") {
    console.error("[Tanaka Error]", ...args)
  }
}

export function debugWarn(...args: unknown[]) {
  if (process.env.NODE_ENV === "development") {
    console.warn("[Tanaka Warning]", ...args)
  }
}
