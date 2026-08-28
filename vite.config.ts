import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// No PWA/Workbox plugin. Precaching and runtime caching were the source of the
// repeated stale-content bugs, so nothing is cached at the service-worker layer
// any more. public/sw.js takes over the same /sw.js URL, which means devices
// with the old Workbox worker installed update to it and purge what it cached.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
