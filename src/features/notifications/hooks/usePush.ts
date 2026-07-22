import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { toast } from '@/utils/toast'
import { notificationService } from '../services/notificationService'
import { onForegroundMessage, pushPermission, requestPushToken } from '../push'
import { notificationKeys } from './useNotifications'

interface PushRegistrationOptions {
  /**
   * Run the side effects (silent token registration + foreground message
   * subscription). Mount ONE instance with this `true` (the app-wide
   * `PushRegistrar`); other consumers that only need `enable()`/`permission`
   * (e.g. a settings toggle) should pass `false` to avoid double subscriptions.
   */
  registerEffects?: boolean
}

/**
 * Manages web-push registration for the signed-in user. Silently registers when
 * permission is already granted; exposes `enable()` to prompt. Degrades to a
 * no-op when Firebase/push is unavailable ('unsupported').
 */
export function usePushRegistration({ registerEffects = true }: PushRegistrationOptions = {}) {
  const { isAuthenticated } = useAuth()
  const qc = useQueryClient()
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    pushPermission(),
  )

  // Silent registration when the user already granted permission. Runs on every
  // page (via the app-wide registrar), so the device token is saved as soon as a
  // signed-in user with granted permission opens the app anywhere.
  useEffect(() => {
    if (!registerEffects || !isAuthenticated || permission !== 'granted') return
    let active = true
    void requestPushToken(false).then((token) => {
      if (active && token) void notificationService.registerDevice(token).catch(() => undefined)
    })
    return () => {
      active = false
    }
  }, [registerEffects, isAuthenticated, permission])

  // Foreground messages → toast + refresh the badge.
  useEffect(() => {
    if (!registerEffects || !isAuthenticated) return
    const unsub = onForegroundMessage((payload) => {
      if (payload.title) toast.info(payload.title, payload.body ?? undefined)
      void qc.invalidateQueries({ queryKey: notificationKeys.unread })
      void qc.invalidateQueries({ queryKey: notificationKeys.list })
    })
    return unsub
  }, [registerEffects, isAuthenticated, qc])

  const enable = useCallback(async () => {
    const token = await requestPushToken(true)
    setPermission(pushPermission())
    if (token) {
      await notificationService.registerDevice(token).catch(() => undefined)
      toast.success('Push notifications enabled')
    }
  }, [])

  return { permission, enable }
}
