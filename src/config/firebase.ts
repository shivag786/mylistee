/**
 * Firebase initialization (Google Auth + Cloud Messaging).
 * Lazily initialized and guarded by `isFirebaseConfigured` so the app still
 * boots in local dev before Firebase credentials are provided.
 */
import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth'
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
  authInstance = getAuth(firebaseApp)
  return authInstance
}

export const googleProvider = new GoogleAuthProvider()
