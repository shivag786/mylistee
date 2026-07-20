import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { toast } from '@/utils/toast'
import { notificationService } from '../services/notificationService'
import { onForegroundMessage, pushPermission, requestPushToken } from '../push'
import { notificationKeys } from './useNotifications'

/**
 * Manages web-push registration for the signed-in user. Silently registers when
 * permission is already granted; exposes `enable()` to prompt. Degrades to a
 * no-op when Firebase/push is unavailable ('unsupported').
 */
export function usePushRegistration() {
  const { isAuthenticated } = useAuth()
  const qc = useQueryClient()
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    pushPermission(),
  )

  // Silent registration when the user already granted permission.
  useEffect(() => {
    if (!isAuthenticated || permission !== 'granted') return
    let active = true
    void requestPushToken(false).then((token) => {
      if (active && token) void notificationService.registerDevice(token).catch(() => undefined)
    })
    return () => {
      active = false
    }
  }, [isAuthenticated, permission])

  // Foreground messages → toast + refresh the badge.
  useEffect(() => {
    if (!isAuthenticated) return
    const unsub = onForegroundMessage((payload) => {
      if (payload.title) toast.info(payload.title, payload.body ?? undefined)
      void qc.invalidateQueries({ queryKey: notificationKeys.unread })
      void qc.invalidateQueries({ queryKey: notificationKeys.list })
    })
    return unsub
  }, [isAuthenticated, qc])

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
