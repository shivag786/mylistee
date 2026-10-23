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
  apiKey: 'AIzaSyCLPAdrTtDZZRDAwvuZWqDKCw8k9HLqTq8',
  authDomain: 'shammtech-415b8.firebaseapp.com',
  projectId: 'shammtech-415b8',
  storageBucket: 'shammtech-415b8.firebasestorage.app',
  messagingSenderId: '824904723551',
  appId: '1:824904723551:web:9f7afd702bad3c4ddaffea',
}

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig)
  const messaging = firebase.messaging()

  // The server sends data-only pushes (title/body/link in data), so this is the
  // one place a notification is shown — never twice. A message that does carry
  // a `notification` block is already shown by the SDK, so it is skipped here.
  messaging.onBackgroundMessage((payload) => {
    if (payload.notification) return
    const data = payload.data ?? {}
    // A new order for a shop: keep it on screen until the owner taps it, buzz
    // the phone, and alert again even if an older alert with the tag is showing.
    const urgent = data.urgent === '1'
    self.registration.showNotification(data.title || 'Listee', {
      body: data.body || '',
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      // Same link replaces the older one instead of stacking (e.g. order updates).
      tag: data.tag || undefined,
      renotify: Boolean(urgent && data.tag),
      requireInteraction: urgent,
      vibrate: urgent ? [300, 120, 300, 120, 600] : undefined,
      actions: urgent ? [{ action: 'open', title: 'View order' }] : undefined,
      data,
    })
  })

  // Tap: focus an open Listee tab and go to the link, or open a new one.
  self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const link = event.notification.data?.link || '/'
    const url = new URL(link, self.location.origin).href
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
        const tab = wins.find((w) => new URL(w.url).origin === self.location.origin)
        if (tab) {
          return tab.focus().then(() => ('navigate' in tab ? tab.navigate(url) : undefined))
        }
        return clients.openWindow(url)
      }),
    )
  })
}
