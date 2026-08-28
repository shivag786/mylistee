import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Self-hosted Poppins (design system font) — works offline for the PWA.
import '@fontsource/poppins/300.css'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'

import './index.css'
import App from './App.tsx'

/**
 * A deploy replaces the hashed bundles and deletes the old ones, but a tab (or
 * the service worker's cached shell) can still be pointing at the previous
 * build. The lazy route chunk then 404s and nothing renders — the blank
 * homepage that only a hard refresh cleared. Vite fires `vite:preloadError`
 * for exactly this; reload once to pick up the current index.html.
 */
window.addEventListener('vite:preloadError', (event) => {
  if (sessionStorage.getItem('listee:reloadedOnce')) return
  try {
    sessionStorage.setItem('listee:reloadedOnce', '1')
  } catch {
    return // Storage blocked — let the error boundary render its retry instead.
  }
  event.preventDefault()
  window.location.reload()
})

/**
 * Register the non-caching service worker (public/sw.js).
 *
 * vite-plugin-pwa used to inject registerSW.js to do this; that plugin is gone,
 * so registration is explicit. The worker caches nothing — it exists to keep
 * the app installable and, crucially, to take over the /sw.js URL from the old
 * Workbox worker so devices that installed it purge what it cached.
 *
 * Belt and braces: any Cache Storage found in this tab is deleted here too,
 * which cleans up even if the worker never activates (unsupported, blocked, or
 * an unregistered leftover).
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // Insecure origin or the browser refused it — the app works without it.
    })
  })
}

if ('caches' in window) {
  void caches
    .keys()
    .then((names) => Promise.all(names.map((name) => caches.delete(name))))
    .catch(() => {
      // Storage partitioned or unavailable — nothing to clean up.
    })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// The app came up, so the one-shot reload guard has done its job. Clearing it
// lets a later stale chunk (navigating to a route hours after a deploy) recover
// the same way instead of going straight to the error screen.
window.setTimeout(() => {
  try {
    sessionStorage.removeItem('listee:reloadedOnce')
  } catch {
    // Storage blocked — nothing to clear.
  }
}, 5000)
