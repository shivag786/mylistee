/**
 * The single boundary to Firebase Auth. Nothing else in the app imports
 * `firebase/auth` directly (document/phase/04 §Service Layer, phase/12
 * §Firebase Login Flow).
 *
 * Sign-in uses a popup and falls back to a full-page redirect only when the
 * popup genuinely cannot run. After a redirect the app resolves the result on
 * next boot via `consumeRedirectResult`.
 *
 * Why popup first, everywhere:
 * Our `authDomain` (<project>.firebaseapp.com) is a different origin from the
 * app. Coming back from a redirect, Firebase reads the sign-in result through a
 * hidden iframe on that domain — third-party storage, which Safari/iOS (16.1+),
 * Chrome's third-party-cookie blocking and every "block cross-site tracking"
 * setting partition away. `getRedirectResult()` then resolves to null and the
 * user lands back on the login screen having done nothing. The popup path does
 * not need that iframe: it posts the credential straight back to the opener, so
 * it keeps working on exactly the devices where redirect quietly fails.
 * (A redirect-proof setup means serving /__/auth/* from the app's own domain
 * and pointing VITE_FIREBASE_AUTH_DOMAIN at it — see .env.example.)
 */
import { FirebaseError } from 'firebase/app'
import {
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type Auth,
  type UserCredential,
} from 'firebase/auth'
import { getFirebaseAuth, googleProvider } from '@/config/firebase'
import { isFirebaseConfigured } from '@/config/env'
import { ApiError } from '@/types/api'

/** Sentinel thrown when a redirect has been triggered; the page is navigating away. */
export const REDIRECT_IN_PROGRESS = 'redirect-in-progress'

/** Marks that we sent the browser to Google, so boot can tell a returning user
 *  from a first visit and report a redirect that came back empty-handed. */
const REDIRECT_PENDING_KEY = 'listee:auth:redirectPending'

/**
 * Popup failures that mean "this browser will not give us a popup" rather than
 * "the user changed their mind". Each one is worth retrying as a redirect:
 *  - popup-blocked ............... blocker, or the click lost its user gesture
 *  - operation-not-supported ..... in-app WebView (Instagram, FB, Gmail, LINE)
 *  - web-storage-unsupported ..... cookies/storage off, so the popup channel dies
 *  - internal-error .............. what a WebView that swallows postMessage reports
 *  - timeout ..................... popup opened but never reported back
 *
 * `auth/network-request-failed` is deliberately absent: a redirect needs the
 * same network the popup just failed on, so it would only trade one failure for
 * a slower one. That one gets a "check your connection" message instead.
 */
const POPUP_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
  'auth/web-storage-unsupported',
  'auth/internal-error',
  'auth/timeout',
])

function assertConfigured(): Auth {
  const auth = getFirebaseAuth()
  if (!auth || !isFirebaseConfigured) {
    throw new ApiError('Sign-in is not configured yet. Please add Firebase credentials.', 503)
  }
  return auth
}

/** How long to wait for a redirect result before giving up. Firebase resolves
 *  it by talking to a hidden iframe on the auth domain; when that iframe is
 *  blocked the promise can sit unresolved, and the app boots behind a spinner
 *  forever. A reported failure beats a hang. */
const REDIRECT_RESULT_TIMEOUT_MS = 12_000

function markRedirectPending(): void {
  try {
    sessionStorage.setItem(REDIRECT_PENDING_KEY, '1')
  } catch {
    // Storage blocked. Firebase needs the same storage to carry a redirect
    // across the page load, so this browser cannot complete that flow anyway.
  }
}

/** True when this page load is the return leg of a redirect sign-in. Read-only
 *  — safe to call before `consumeRedirectResult`, which clears the flag. */
export function hasPendingRedirect(): boolean {
  try {
    return sessionStorage.getItem(REDIRECT_PENDING_KEY) === '1'
  } catch {
    return false
  }
}

function clearRedirectPending(): void {
  try {
    sessionStorage.removeItem(REDIRECT_PENDING_KEY)
  } catch {
    // Nothing to clear.
  }
}

/** Hand the browser over to Google. Never returns — it throws the sentinel. */
async function startRedirect(auth: Auth, cause?: unknown): Promise<never> {
  markRedirectPending()
  try {
    await signInWithRedirect(auth, googleProvider)
  } catch (error) {
    // The browser never left, so the next boot must not think it came back
    // from Google and accuse it of dropping the sign-in.
    clearRedirectPending()
    throw error
  }
  throw new Error(REDIRECT_IN_PROGRESS, { cause })
}

/**
 * Begin Google sign-in and return the Firebase ID token.
 * Resolves with the token (popup) — or never resolves because the page is
 * redirecting, in which case it throws {@link REDIRECT_IN_PROGRESS}.
 */
export async function signInWithGoogle(): Promise<string> {
  const auth = assertConfigured()

  let credential: UserCredential
  try {
    credential = await signInWithPopup(auth, googleProvider)
  } catch (error) {
    if (error instanceof FirebaseError && POPUP_FALLBACK_CODES.has(error.code)) {
      return startRedirect(auth, error)
    }
    throw error
  }

  return credential.user.getIdToken()
}

/**
 * Resolve a pending redirect sign-in on app boot.
 * Returns the ID token when the user just came back from the Google redirect,
 * or null when there is nothing pending.
 */
export async function consumeRedirectResult(): Promise<string | null> {
  // Nobody started a redirect from this tab, so there is nothing to collect.
  // Returning before touching Firebase matters: every visitor hits this on
  // boot, and getRedirectResult() would otherwise initialize auth and go
  // looking for state that was never written — the login screen sitting behind
  // a spinner while it does.
  if (!hasPendingRedirect()) return null
  clearRedirectPending()

  const auth = getFirebaseAuth()
  if (!auth || !isFirebaseConfigured) return null

  const result = await Promise.race([
    getRedirectResult(auth),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), REDIRECT_RESULT_TIMEOUT_MS)),
  ])
  if (!result) return null

  return result.user.getIdToken()
}

/** Sign the user out of Firebase (best-effort). */
export async function signOutFromFirebase(): Promise<void> {
  const auth = getFirebaseAuth()
  if (!auth) return
  await firebaseSignOut(auth).catch(() => undefined)
}
