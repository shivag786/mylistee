import { useEffect, useRef } from 'react'
import { useOwnerOrders } from './useOrders'
import { getOrderSound } from '../orderSound'
import { toast } from '@/utils/toast'
import { armBeep, beep } from '@/utils/beep'

// Module-level so audio is only armed once per session, from the first gesture.
let audioArmed = false

/**
 * App-wide new-order watcher for owners (Phase 7.5). Shares the 5s active-order
 * poll (same query key as the Orders page), rings + toasts the instant a new
 * order arrives on ANY owner screen, and exposes the live active-order count for
 * the floating button. Mount exactly once (in the owner shell).
 */
export function useOwnerOrderAlerts() {
  const { data } = useOwnerOrders('active')
  const seen = useRef<Set<string> | null>(null)

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

  return { activeCount: data?.length ?? 0 }
}
