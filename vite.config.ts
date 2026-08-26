import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Listee — Rewards Around You',
        short_name: 'Listee',
        description: 'Scan, spin and win rewards at local businesses near you.',
        theme_color: '#E23744',
        background_color: '#F8F9FA',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['shopping', 'lifestyle', 'food'],
        icons: [
          { src: '/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          { name: 'Wallet', short_name: 'Wallet', url: '/wallet' },
          { name: 'Nearby', short_name: 'Nearby', url: '/nearby' },
        ],
      },
      workbox: {
        // SPA: unmatched navigations fall back to the cached app shell so the app
        // opens offline (live data still needs the network — the UI shows an
        // offline banner). API + auth responses are never cached.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        runtimeCaching: [
          {
            // Business logos / covers / gallery served from Laravel storage.
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/storage/') ||
              /\.(?:png|jpe?g|webp|gif|svg)$/.test(url.pathname),
            handler: 'StaleWhileRevalidate',
            options: {
              // -v2 is deliberate. Entries cached under the old name were
              // written while status 0 was allowed, so they may be cached
              // FAILURES. Reusing the name would keep serving them: with
              // StaleWhileRevalidate the stale entry is returned first, and the
              // revalidation cannot replace it because the fresh opaque
              // response is rejected by cacheableResponse below. A new name
              // sidesteps the poisoned cache; main.tsx deletes the old one.
              cacheName: 'listee-images-v2',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 7 },
              // 200 only -- NOT 0. Images are cross-origin (app on listee.org,
              // files on the API host), so a plain <img> makes a no-cors request
              // whose response is opaque and reports status 0 whether it
              // succeeded or 404'd. Allowing 0 let failed loads into the cache,
              // and CacheFirst then served that failure for the full week --
              // the "hard refresh to get images back" bug. Opaque responses are
              // simply not cached now; the browser's HTTP cache still applies.
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
