import { usePushRegistration } from '../hooks/usePush'

/**
 * Mounts web-push registration once, app-wide. Silently saves the FCM device
 * token whenever a signed-in user who has granted permission opens the app on
 * ANY page (previously this only ran on the notifications page), and handles
 * foreground messages. Renders nothing. No-op until Firebase is configured.
 */
export function PushRegistrar() {
  usePushRegistration({ registerEffects: true })
  return null
}
