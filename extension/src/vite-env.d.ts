/// <reference types="vite/client" />

declare module '@env' {
  export const config: {
    readonly serverUrl: string;
  };
}
