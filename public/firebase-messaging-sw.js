/* Firebase Cloud Messaging service worker (document/phase/13 §Push).
 *
 * Handles background push notifications. It is only registered by the app once
 * Firebase is configured (see features/notifications/push.ts), so an empty
 * config here is harmless until real credentials are provided.
 *
 * TODO (when enabling push): fill in `firebaseConfig` with the same public
 * values used in the app's VITE_FIREBASE_* env vars. Service workers cannot read
 * Vite env at runtime, so these must be set here explicitly.
 */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
}

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig)
  const messaging = firebase.messaging()

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title ?? 'Listee'
    self.registration.showNotification(title, {
      body: payload.notification?.body ?? '',
      icon: '/pwa-192x192.png',
      data: payload.data ?? {},
    })
  })

  self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const link = event.notification.data?.link ?? '/'
    event.waitUntil(clients.openWindow(link))
  })
}
