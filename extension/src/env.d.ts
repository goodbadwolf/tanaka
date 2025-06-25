/// <reference types="@rspack/core/module" />

declare module '@env' {
  export const config: {
    readonly serverUrl: string;
    readonly environment: string;
  };
}

declare const __APP_VERSION__: string;

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
