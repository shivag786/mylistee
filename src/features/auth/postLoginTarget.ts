/**
 * Where to send the user once they are signed in, remembered across a full-page
 * Google redirect.
 *
 * `location.state.from` is how a protected route tells the login page where the
 * user was headed. That state lives in the history entry, and the Google
 * redirect flow replaces the whole page — so by the time the user comes back it
 * is gone and they land on the generic home screen instead of the page they
 * asked for. sessionStorage survives the round trip; it is per-tab and cleared
 * when the tab closes, which is exactly the lifetime we want.
 */
const KEY = 'listee:auth:postLoginTarget'

/**
 * Record (or clear) the intended destination. Called immediately before every
 * sign-in attempt, so a value can never outlive the attempt that wrote it.
 */
export function rememberPostLoginTarget(path?: string | null): void {
  try {
    if (path) sessionStorage.setItem(KEY, path)
    else sessionStorage.removeItem(KEY)
  } catch {
    // Storage blocked — the user just lands on their role's home screen.
  }
}

/** The remembered destination, if any. Reading is side-effect free, so it is
 *  safe to call during render (and under StrictMode's double invoke). */
export function readPostLoginTarget(): string | null {
  try {
    return sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

/** Forget any pending destination — on sign-out, so the next person to sign in
 *  on this device does not inherit it. */
export function clearPostLoginTarget(): void {
  rememberPostLoginTarget(null)
}
