export const DEFAULT_CONFIG = {
  serverUrl: import.meta.env.VITE_DEFAULT_SERVER_URL || 'http://localhost:3000',
} as const;

export type DefaultConfig = typeof DEFAULT_CONFIG;
