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
 * Registering the service worker happens in PwaController, not here.
 *
 * It has to wait for the admin's `pwa` feature flag to load, and this runs
 * before React and before any API call. Registering unconditionally here would
 * install the worker on devices where the flag is off, a moment before the
 * controller tore it back out.
 *
 * What stays here is the reload backstop below, which is about escaping the OLD
 * Workbox worker and is independent of the flag.
 *
 * Belt and braces: any Cache Storage found in this tab is deleted further down,
 * which cleans up even if no worker ever activates.
 */
if ('serviceWorker' in navigator) {
  // Backstop for the reload that sw.js performs on activate, for browsers that
  // refuse WindowClient.navigate(). Only meaningful when this bundle is already
  // running; on the first visit after the switch the page is still the old one
  // and the worker has to do it.
  //
  // `controllerchange` fires once, when a newly installed worker claims the
  // page. The sessionStorage flag makes a loop impossible even if a browser
  // fires it more than once.
  // Captured before any worker claims: null means this page loaded WITHOUT a
  // controller, i.e. this is a first-ever registration. Nothing stale was
  // served, so there is nothing to escape — reloading there would just make
  // every new visitor's first visit load twice.
  const hadController = Boolean(navigator.serviceWorker.controller)
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return
    try {
      if (sessionStorage.getItem('listee:swReloaded')) return
      sessionStorage.setItem('listee:swReloaded', '1')
    } catch {
      return // Storage blocked — skip rather than risk repeating.
    }
    reloading = true
    window.location.reload()
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
