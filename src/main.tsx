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
 * Drop the pre-v2 image cache. It was filled while the service worker accepted
 * status 0, which for a cross-origin <img> means an opaque response that looks
 * identical whether it loaded or 404'd — so failed images were cached and
 * re-served for a week, and only a hard refresh got past them.
 *
 * Run unconditionally rather than once: an old service worker may still be
 * active on this device and writing to that cache until it updates. Deleting a
 * cache that isn't there is a cheap no-op.
 */
if ('caches' in window) {
  void caches.delete('listee-images').catch(() => {
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
