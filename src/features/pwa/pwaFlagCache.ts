/**
 * Remembers the admin's `pwa` flag across page loads.
 *
 * The flag arrives from /config, which is a network round trip — far too late
 * to decide whether the browser should treat this page as installable. That is
 * settled while the HTML is parsed, before any of our code runs. So the answer
 * from last time is cached here, and the inline script in index.html reads it
 * during parse to decide whether to add the manifest link at all.
 *
 * Unknown means on. A first-time visitor should get the app, and one stale load
 * after an admin flips the switch is the price of not asking the network before
 * rendering anything.
 */
const KEY = 'listee:pwa:enabled'

/** The answer from last time, or null when we have never had one. */
export function readCachedPwaEnabled(): boolean | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw === null ? null : raw !== '0'
  } catch {
    return null
  }
}

/** Mirrors the inline reader in index.html — keep the two in step. */
export function cachePwaEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(KEY, enabled ? '1' : '0')
  } catch {
    // Storage blocked. The manifest then follows the default (on) every load.
  }
}
