import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const validModes = ['development', 'staging', 'production'];
  if (!validModes.includes(mode)) {
    throw new Error(`Invalid mode: ${mode}. Must be one of: ${validModes.join(', ')}`);
  }
  const cssDir = (name: string) => {
    if (name.includes('popup')) {
      return 'popup';
    }
    if (name.includes('settings')) {
      return 'settings';
    }
  };
  return {
    resolve: {
      alias: {
        '@env': resolve(__dirname, `src/config/environments/${mode}.ts`),
      },
    },
    publicDir: false,
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: true,
      rollupOptions: {
        input: {
          background: resolve(__dirname, 'src/background.ts'),
          'popup/popup': resolve(__dirname, 'src/popup/popup.html'),
          'settings/settings': resolve(__dirname, 'src/settings/settings.html'),
        },
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: '[name]-[hash].js',
          assetFileNames: (info) =>
            info.name?.endsWith('.css')
              ? `${cssDir(info.name!)}/[name][extname]`
              : '[name][extname]',
        },
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
    plugins: [
      {
        name: 'organize-html-files',
        apply: 'build',
        enforce: 'post',
        generateBundle(_, bundle) {
          for (const [, asset] of Object.entries(bundle)) {
            if (asset.fileName.endsWith('.html')) {
              if (asset.fileName.startsWith('src/')) {
                asset.fileName = asset.fileName.replace('src/', '');
              }
            }
          }
        },
      },
    ],
  };
});
