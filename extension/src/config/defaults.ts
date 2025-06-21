export const DEFAULT_CONFIG = {
  serverUrl: import.meta.env.VITE_DEFAULT_SERVER_URL || 'http://localhost:3000',
  authToken: import.meta.env.VITE_DEFAULT_AUTH_TOKEN || 'tanaka-secret-token',
} as const;

export type DefaultConfig = typeof DEFAULT_CONFIG;
