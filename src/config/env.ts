/**
 * Typed, centralized access to environment variables.
 * Components and services must import from here — never read import.meta.env
 * directly (keeps env usage discoverable and validated in one place).
 */

interface AppEnv {
  apiBaseUrl: string
  appName: string
  appEnv: 'local' | 'staging' | 'production'
  firebase: {
    apiKey: string
    authDomain: string
    projectId: string
    storageBucket: string
    messagingSenderId: string
    appId: string
    vapidKey: string
  }
}

const raw = import.meta.env

export const env: AppEnv = {
  apiBaseUrl: raw.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1',
  appName: raw.VITE_APP_NAME ?? 'Listee',
  appEnv: (raw.VITE_APP_ENV as AppEnv['appEnv']) ?? 'local',
  firebase: {
    apiKey: raw.VITE_FIREBASE_API_KEY ?? '',
    authDomain: raw.VITE_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: raw.VITE_FIREBASE_PROJECT_ID ?? '',
    storageBucket: raw.VITE_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: raw.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: raw.VITE_FIREBASE_APP_ID ?? '',
    vapidKey: raw.VITE_FIREBASE_VAPID_KEY ?? '',
  },
}

console.log('Firebase env:', env.firebase);

/** True when Firebase has enough config to initialize (avoids crashes in dev). */
export const isFirebaseConfigured = Boolean(
  env.firebase.apiKey && env.firebase.projectId && env.firebase.appId,
)

export const isProduction = env.appEnv === 'production'
