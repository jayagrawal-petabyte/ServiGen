import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'https://servigen-1.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/lists': {
        target: 'https://servigen-1.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/projects': {
        target: 'https://servigen-1.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/escalation': {
        target: 'https://servigen-1.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide')) {
              return 'vendor-lucide';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            return 'vendor';
          }
        },
      },
    },
  },
});
