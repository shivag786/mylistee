/**
 * Turns the PWA on and off from the admin's `pwa` feature flag.
 *
 * Registration used to happen unconditionally in main.tsx, before any config
 * had loaded. It lives here instead so an admin can actually switch the whole
 * thing off: flag on registers the worker, flag off unregisters every worker on
 * the device, deletes what they cached, and drops the manifest so the browser
 * stops offering to install the app.
 *
 * The answer is also cached for next time. Whether a page is installable is
 * settled while the browser parses the head, long before this component or its
 * config call exist — so index.html reads that cached answer during parse.
 * Dropping the link here only stops an install from THIS page load; the cache
 * is what stops the next one.
 *
 * What it cannot do is uninstall an app somebody already installed. That icon
 * keeps opening the site; with no worker and no manifest it is an ordinary
 * website behind it.
 *
 * It renders nothing.
 */
import { useEffect } from 'react'
import { usePwaEnabled } from './usePwaEnabled'
import { cachePwaEnabled } from './pwaFlagCache'

/** Drop the manifest link so the browser no longer treats this as installable. */
function removeManifest(): void {
  document.querySelector('link[rel="manifest"]')?.remove()
}

/** Put it back (same href index.html ships) after the flag is turned on again,
 *  so the app becomes installable without needing a redeploy. */
function restoreManifest(): void {
  if (document.querySelector('link[rel="manifest"]')) return
  const link = document.createElement('link')
  link.rel = 'manifest'
  link.href = '/manifest.webmanifest'
  document.head.appendChild(link)
}

async function unregisterEverything(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations().catch(() => [])
    await Promise.all(registrations.map((r) => r.unregister().catch(() => false)))
  }
  if ('caches' in window) {
    const names = await caches.keys().catch(() => [])
    await Promise.all(names.map((name) => caches.delete(name).catch(() => false)))
  }
}

export function PwaController() {
  const enabled = usePwaEnabled()

  useEffect(() => {
    // Not known yet (still loading, or the config call failed). Touch nothing —
    // registering or unregistering on a guess is worse than doing neither.
    if (enabled === undefined) return

    // Let the next page load act on this before the network can answer.
    cachePwaEnabled(enabled)

    if (enabled) {
      restoreManifest()
      if ('serviceWorker' in navigator) {
        void navigator.serviceWorker.register('/sw.js').catch(() => {
          // Insecure origin or the browser refused it — the app works without it.
        })
      }
      return
    }

    // Off. Strip the app back to an ordinary website.
    removeManifest()
    void unregisterEverything()
  }, [enabled])

  return null
}
