/**
 * Vite config for Capacitor native builds.
 * Uses mobile.html as the entry point → src/mobile-entry.tsx
 * Outputs to build-mobile/ which Capacitor reads as webDir.
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'build-mobile',
    rollupOptions: {
      input: path.resolve(__dirname, 'mobile.html'),
    },
  },
});
