import { useEffect, useRef } from 'react'
import { useOwnerOrders } from './useOrders'
import { getOrderSound } from '../orderSound'
import { toast } from '@/utils/toast'
import { armBeep, beep, setOrderSoundUrl } from '@/utils/beep'
import { useAppConfig } from '@/hooks/useAppConfig'

// Module-level so audio is only armed once per session, from the first gesture.
let audioArmed = false

/**
 * App-wide new-order watcher for owners (Phase 7.5). Shares the 5s active-order
 * poll (same query key as the Orders page), rings + toasts the instant a new
 * order arrives on ANY owner screen, and exposes the count of *new* (unactioned)
 * orders for the floating button. Mount exactly once (in the owner shell).
 */
export function useOwnerOrderAlerts() {
  const { data } = useOwnerOrders('active')
  const { data: config } = useAppConfig()
  const seen = useRef<Set<string> | null>(null)

  // Apply the admin's custom alert sound (null → built-in ding).
  useEffect(() => {
    setOrderSoundUrl(config?.orderSoundUrl ?? null)
  }, [config?.orderSoundUrl])

  // The floating nudge is for orders the owner hasn't touched yet — the instant
  // they confirm / pay / cancel one, it drops off the float (the Orders page
  // still lists every active order). So count only 'placed' orders here.
  const newCount = data?.filter((o) => o.status === 'placed').length ?? 0

  // Browsers block audio until a user gesture — arm on the first pointer down.
  useEffect(() => {
    if (audioArmed) return
    const arm = () => {
      armBeep()
      audioArmed = true
    }
    window.addEventListener('pointerdown', arm, { once: true })
    return () => window.removeEventListener('pointerdown', arm)
  }, [])

  // Ring when a genuinely new order id appears (not on the first load).
  useEffect(() => {
    if (!data) return
    const ids = new Set(data.map((o) => o.id))
    if (seen.current === null) {
      seen.current = ids
      return
    }
    const hasNew = data.some((o) => !seen.current!.has(o.id))
    seen.current = ids
    if (hasNew && getOrderSound()) {
      beep()
      toast.info('New order received')
    }
  }, [data])

  return { activeCount: newCount }
}
