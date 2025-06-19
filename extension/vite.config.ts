import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background.ts'),
        popup: resolve(__dirname, 'src/popup.html'),
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
      name: 'copy-manifest',
      writeBundle() {
        fs.copyFileSync('manifest.json', 'dist/manifest.json');
        // Move popup.html to root of dist
        if (fs.existsSync('dist/src/popup.html')) {
          fs.copyFileSync('dist/src/popup.html', 'dist/popup.html');
        }
      }
    }
  ]
});