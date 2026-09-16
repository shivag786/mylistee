/**
 * Firebase initialization (Google Auth + Cloud Messaging).
 * Lazily initialized and guarded by `isFirebaseConfigured` so the app still
 * boots in local dev before Firebase credentials are provided.
 */
import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  browserSessionPersistence,
  getAuth,
  indexedDBLocalPersistence,
  inMemoryPersistence,
  initializeAuth,
  GoogleAuthProvider,
  type Auth,
} from 'firebase/auth'
import { env, isFirebaseConfigured } from './env'

let app: FirebaseApp | null = null
let authInstance: Auth | null = null

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) return null
  if (!app) {
    app = initializeApp({
      apiKey: env.firebase.apiKey,
      authDomain: env.firebase.authDomain,
      projectId: env.firebase.projectId,
      storageBucket: env.firebase.storageBucket,
      messagingSenderId: env.firebase.messagingSenderId,
      appId: env.firebase.appId,
    })
  }
  return app
}

export function getFirebaseAuth(): Auth | null {
  if (authInstance) return authInstance
  const firebaseApp = getFirebaseApp()
  if (!firebaseApp) return null

  // `getAuth()` picks IndexedDB and gives up if it is unavailable. That is the
  // difference between a device where Google sign-in works and one where the
  // button just spins: iOS private browsing, "block all cookies", Android
  // WebViews and in-app browsers (Instagram, Facebook, Gmail) all refuse
  // IndexedDB, and some hang on open() rather than failing fast.
  //
  // Listing the persistences explicitly makes Firebase walk down the chain —
  // IndexedDB, then localStorage, then sessionStorage, then memory — so the
  // worst case is a session that does not survive a page reload instead of a
  // sign-in that cannot happen at all. Our own session lives in the Sanctum
  // token (localStorage) anyway, so in-memory Firebase persistence is enough.
  try {
    authInstance = initializeAuth(firebaseApp, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        browserSessionPersistence,
        inMemoryPersistence,
      ],
      popupRedirectResolver: browserPopupRedirectResolver,
    })
  } catch {
    // Already initialized (hot reload, or another module got here first).
    authInstance = getAuth(firebaseApp)
  }
  return authInstance
}

export const googleProvider = new GoogleAuthProvider()

// Always show the account chooser. Without it Google silently reuses whichever
// account is already signed in on the device, which looks like a broken button
// to anyone who meant to pick a different one — and leaves people stuck when
// that account is not the one the backend knows.
googleProvider.setCustomParameters({ prompt: 'select_account' })
