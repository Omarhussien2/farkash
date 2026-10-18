import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { VitePWA } from 'vite-plugin-pwa';
import { readFile } from 'node:fs/promises';

export default defineConfig({
  plugins: [
    {
      name: 'parent-library-pages',
      configureServer(server) {
        // Vite's public middleware serves files, but does not resolve directory indexes.
        server.middlewares.use(async (request, response, next) => {
          const path = new URL(request.url ?? '/', 'http://localhost').pathname;
          if (!/^\/articles\/(?:[a-z0-9-]+\/)?$/.test(path)) return next();
          try {
            const html = await readFile(new URL(`./public${path}index.html`, import.meta.url), 'utf8');
            response.setHeader('Content-Type', 'text/html; charset=utf-8');
            response.end(html);
          } catch (error) {
            if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
              response.statusCode = 404;
              response.end('Article not found');
            } else {
              next(error);
            }
          }
        });
      },
    },
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'images/Gemini_Generated_Image_6cwwmb6cwwmb6cww.jpg', 'images/Gemini_Generated_Image_8l34bs8l34bs8l34.jpg'],
      manifest: {
        name: 'فركش - Farkash',
        short_name: 'فركش',
        description: 'ألعاب عربية للعب المشترك وممارسة التركيز والانتظار والهدوء، مع تقرير للعب ومكتبة لأولياء الأمور',
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
        navigateFallbackDenylist: [/^\/articles(?:\/|$)/],
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
