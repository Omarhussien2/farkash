import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'images/Gemini_Generated_Image_6cwwmb6cwwmb6cww.jpg', 'images/Gemini_Generated_Image_8l34bs8l34bs8l34.jpg'],
      manifest: {
        name: 'فركش - Farkash',
        short_name: 'فركش',
        description: 'متحكم حفلات مصري ذكي وألعاب علاجية لكبح الاندفاعية',
        theme_color: '#1E88E5',
        background_color: '#F5F0E1',
        display: 'standalone',
        orientation: 'any',
        dir: 'rtl',
        lang: 'ar-EG',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,svg,png,webp,mp3,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [{
          urlPattern: ({ request }) => request.destination === 'image',
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'farkash-images-v1',
            expiration: { maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 },
          },
        }],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
