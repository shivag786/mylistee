/**
 * The single boundary to Firebase Auth. Nothing else in the app imports
 * `firebase/auth` directly (document/phase/04 §Service Layer, phase/12
 * §Firebase Login Flow).
 *
 * Sign-in uses a popup on desktop and falls back to a full-page redirect when
 * the popup is blocked or when running as an installed PWA (popups are
 * unreliable in standalone display mode). After a redirect the app resolves the
 * result on next boot via `consumeRedirectResult`.
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

function assertConfigured(): Auth {
  const auth = getFirebaseAuth();
  console.log(auth);
  if (!auth || !isFirebaseConfigured) {
    throw new ApiError('Sign-in is not configured yet. Please add Firebase credentials.', 503)
  }
  return auth
}

/** Prefer redirect when running as an installed PWA (standalone display mode). */
function prefersRedirect(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(display-mode: standalone)').matches === true
  )
}

/**
 * Begin Google sign-in and return the Firebase ID token.
 * Resolves with the token (popup) — or never resolves because the page is
 * redirecting, in which case it throws {@link REDIRECT_IN_PROGRESS}.
 */
export async function signInWithGoogle(): Promise<string> {
  const auth = assertConfigured()

  if (prefersRedirect()) {
    await signInWithRedirect(auth, googleProvider)
    throw new Error(REDIRECT_IN_PROGRESS)
  }

  let credential: UserCredential
  try {
    credential = await signInWithPopup(auth, googleProvider)
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/popup-blocked') {
      await signInWithRedirect(auth, googleProvider)
      throw new Error(REDIRECT_IN_PROGRESS, { cause: error })
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
  const auth = getFirebaseAuth()
  if (!auth || !isFirebaseConfigured) return null

  const result = await getRedirectResult(auth).catch(() => null)
  if (!result) return null

  return result.user.getIdToken()
}

/** Sign the user out of Firebase (best-effort). */
export async function signOutFromFirebase(): Promise<void> {
  const auth = getFirebaseAuth()
  if (!auth) return
  await firebaseSignOut(auth).catch(() => undefined)
}
