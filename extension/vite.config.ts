import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background.ts'),
        popup: resolve(__dirname, 'src/popup/popup.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
  plugins: [
    {
      name: 'move-popup',
      writeBundle() {
        // Move popup.html to root of dist
        if (fs.existsSync('dist/src/popup/popup.html')) {
          fs.copyFileSync('dist/src/popup/popup.html', 'dist/popup.html');
          fs.rmSync('dist/src', { recursive: true });
        }
      },
    },
  ],
});
