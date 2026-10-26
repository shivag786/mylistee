import { useSubscription } from './useOwner'
import type { ModuleAccess } from '../types'

/**
 * The shop's plan access, read from the subscription state. Until it loads —
 * or on an older server that does not send it — everything counts as open, so
 * nothing flashes locked.
 */
export function usePlanAccess() {
  const { data } = useSubscription()
  const access = data?.access

  const moduleAccess = (id?: string): ModuleAccess | null => (id && access?.modules[id]) || null
  const isLocked = (id?: string): boolean => {
    const m = moduleAccess(id)
    // The admin's own global switch is handled by the owner menu, not shown as a plan lock.
    return Boolean(m && !m.allowed && m.reason !== 'off')
  }

  return { access, plan: data?.plan ?? null, moduleAccess, isLocked }
}
