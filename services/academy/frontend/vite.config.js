import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // ✅ CORRECTED: Add the base path for the Academy service.
  base: '/academy/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png'],
      manifest: {
        short_name: 'ABapp',
        name: 'CODED AB TECH Learning Platform',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
        start_url: '/academy/', // ✅ CORRECTED: PWA start URL must match the base path
        scope: '/academy/', // ✅ CORRECTED: PWA scope must match the base path
        display: 'standalone',
        theme_color: '#2c3e50',
        background_color: '#ffffff',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      // ✅ CORRECTED: Update proxy paths and targets to match your Nginx config for the Academy service
      '/academy/static': {
        target: 'http://127.0.0.1:8001', // Nginx routes to 8001
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/academy\/static/, '/static'),
        secure: false,
      },
      '/academy/api': {
        target: 'http://127.0.0.1:8001', // Nginx routes to 8001
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/academy\/api/, ''),
        secure: false,
      },
    },
  },
});