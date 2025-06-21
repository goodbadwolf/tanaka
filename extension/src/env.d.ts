/// <reference types="@rspack/core/module" />

declare module '@env' {
  export const config: {
    readonly serverUrl: string;
  };
}

declare const __APP_VERSION__: string;
