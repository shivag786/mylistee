/**
 * FCM web-push boundary (document/phase/13 §Push). Everything here degrades
 * gracefully: if Firebase isn't configured, the browser lacks the Notification
 * / Service Worker APIs, or permission is denied, the functions simply return
 * null and the app falls back to the in-app notification center.
 */
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'
import { getFirebaseApp } from '@/config/firebase'
import { env, isFirebaseConfigured } from '@/config/env'

function pushAvailable(): boolean {
  return (
    isFirebaseConfigured &&
    Boolean(env.firebase.vapidKey) &&
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator
  )
}

async function getMessagingInstance() {
  if (!pushAvailable()) return null
  if (!(await isSupported().catch(() => false))) return null
  const app = getFirebaseApp()
  if (!app) return null
  return getMessaging(app)
}

/** Current browser permission, or 'unsupported' when push can't run at all. */
export function pushPermission(): NotificationPermission | 'unsupported' {
  if (!pushAvailable()) return 'unsupported'
  return Notification.permission
}

/**
 * Obtain an FCM registration token, requesting permission if needed. Returns
 * null when unavailable/denied. Registers the messaging service worker first.
 */
export async function requestPushToken(prompt = true): Promise<string | null> {
  const messaging = await getMessagingInstance()
  if (!messaging) return null

  if (Notification.permission === 'default' && prompt) {
    const result = await Notification.requestPermission().catch(() => 'denied')
    if (result !== 'granted') return null
  }
  if (Notification.permission !== 'granted') return null

  // Register the FCM worker under its own scope so it coexists with the PWA
  // service worker (which owns '/' for offline + caching). Two workers, two
  // scopes, no conflict.
  const registration = await navigator.serviceWorker
    .register('/firebase-messaging-sw.js', { scope: '/firebase-cloud-messaging-push-scope' })
    .catch(() => null)

  return getToken(messaging, {
    vapidKey: env.firebase.vapidKey,
    serviceWorkerRegistration: registration ?? undefined,
  }).catch(() => null)
}

/** Subscribe to foreground messages; returns an unsubscribe fn (no-op if unavailable). */
export function onForegroundMessage(
  handler: (payload: { title?: string; body?: string }) => void,
): () => void {
  let unsub = () => {}
  void getMessagingInstance().then((messaging) => {
    if (!messaging) return
    unsub = onMessage(messaging, (payload) => {
      handler({
        title: payload.notification?.title,
        body: payload.notification?.body,
      })
    })
  })
  return () => unsub()
}
