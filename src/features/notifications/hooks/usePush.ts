import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { toast } from '@/utils/toast'
import { storage } from '@/utils/storage'
import { notificationService } from '../services/notificationService'
import { onForegroundMessage, pushPermission, requestPushToken } from '../push'
import { notificationKeys } from './useNotifications'

/**
 * "Off" in Settings. The browser permission cannot be taken back by the app, so
 * off means: this device's token is removed from the server and not silently
 * re-registered until switched on again.
 */
const OPT_OUT_KEY = 'listee.pushOff'
const isOptedOut = () => storage.get(OPT_OUT_KEY) === '1'

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
    // Read the browser's live answer, not this instance's state: "Allow" may have
    // been tapped elsewhere (e.g. the home card, before signing in), and the
    // token can only be saved once signed in.
    if (!registerEffects || !isAuthenticated || pushPermission() !== 'granted' || isOptedOut()) return
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
      // A new-order alert while the shop has the app open: show it in the queue now,
      // not at the next poll.
      void qc.invalidateQueries({ queryKey: ['owner', 'orders'] })
      // The shop accepted / finished the customer's order: update it now.
      void qc.invalidateQueries({ queryKey: ['customer', 'orders'] })
    })
    return unsub
  }, [registerEffects, isAuthenticated, qc])

  const [optedOut, setOptedOut] = useState(isOptedOut)

  const enable = useCallback(async () => {
    const token = await requestPushToken(true)
    setPermission(pushPermission())
    if (token) {
      storage.set(OPT_OUT_KEY, '0')
      setOptedOut(false)
      await notificationService.registerDevice(token).catch(() => undefined)
      toast.success('Push notifications enabled')
    }
    return Boolean(token)
  }, [])

  /** Stop pushes to this device (in-app notifications still arrive). */
  const disable = useCallback(async () => {
    storage.set(OPT_OUT_KEY, '1')
    setOptedOut(true)
    const token = await requestPushToken(false)
    if (token) await notificationService.unregisterDevice(token).catch(() => undefined)
  }, [])

  /** On = permission granted and not switched off here. */
  const active = permission === 'granted' && !optedOut

  return { permission, enable, disable, active }
}
