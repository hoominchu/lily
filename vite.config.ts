import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'index.html'),
        settings: path.resolve(__dirname, 'settings.html')
      },
      output: {
        dir: 'dist/renderer',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true
  },
  publicDir: 'assets',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
});