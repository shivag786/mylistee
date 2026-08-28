/* Listee service worker — deliberately caches NOTHING.
 *
 * This replaces the Workbox worker that vite-plugin-pwa used to generate.
 * Precaching a stale app shell, and runtime-caching image responses that could
 * not be told apart from failures, produced repeated "hard refresh fixes it"
 * bugs. Rather than tune those strategies, the app no longer caches at all.
 *
 * It still exists (instead of simply being deleted) for two reasons:
 *
 *   1. A registered service worker does not disappear when you stop shipping
 *      one. Every device that already installed the Workbox worker would keep
 *      it, and keep serving what it cached. Publishing a different script at
 *      the SAME /sw.js URL makes those browsers fetch it, see changed bytes,
 *      and install this one instead — which then deletes every cache.
 *   2. It keeps the app installable as a PWA.
 *
 * Nothing here calls caches.open() or event.respondWith(). Requests go to the
 * network exactly as they would with no service worker at all.
 */

// Take over immediately rather than waiting for every old tab to close —
// otherwise the worker that caches would stay in charge for the whole session.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Purge everything the previous worker stored: the precached app shell
      // (stale index.html and bundles) and listee-images, which held opaque
      // responses that may have been failures.
      const names = await caches.keys()
      await Promise.all(names.map((name) => caches.delete(name)))

      await self.clients.claim()

      // Reload open tabs so nobody has to refresh by hand.
      //
      // This must happen HERE, not in app code. On the first visit after the
      // switch the old worker has already served its precached index.html, so
      // the page is running the PREVIOUS bundle — new app code is not there to
      // run. Measured: the old build's vite-plugin-pwa `autoUpdate` does NOT
      // reload itself when an outside worker takes over, so nothing else does.
      //
      // navigate() is deliberately NOT awaited. Awaiting it inside activate's
      // waitUntil deadlocks — the navigation cannot finish until activate
      // resolves, and activate is waiting on the navigation — and the tab
      // crashes. Firing and forgetting works; verified against a real browser.
      //
      // Guarded on names.length so a first-time visitor, who has no cache and
      // nothing stale, is not reloaded for no reason.
      if (names.length > 0) {
        const windows = await self.clients.matchAll({ type: 'window' })
        for (const client of windows) {
          try {
            client.navigate(client.url)
          } catch {
            // Refused or unsupported — that tab needs one ordinary refresh.
          }
        }
      }
    })(),
  )
})

// Present so the app still qualifies as installable, but intentionally a no-op:
// without event.respondWith() the browser performs its normal network fetch.
self.addEventListener('fetch', () => {})
