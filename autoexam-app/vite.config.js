import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true, //открытие браузера при запуске
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});