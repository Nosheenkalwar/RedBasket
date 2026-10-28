import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// /api and /uploads go to the NestJS backend, so the browser never needs a different address
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
    },
  },
});
