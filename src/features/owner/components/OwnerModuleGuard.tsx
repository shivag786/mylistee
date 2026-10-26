import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useAppConfig } from '@/hooks/useAppConfig'
import { isOwnerModuleEnabled, type OwnerModuleId } from '@/features/owner/ownerNav'
import { usePlanAccess } from '@/features/owner/hooks/usePlanAccess'
import { READ_LOCKED_MODULES } from '@/features/owner/planDisplay'
import { PlanLockCard } from './PlanLockCard'

/**
 * Blocks an owner route when the admin has disabled its module (Owner menu page).
 * While config is still loading we render the page — only an explicit "off"
 * redirects to the dashboard, so there's no flash of a redirect on first load.
 *
 * A module the shop's plan leaves out shows an upgrade card on top of the page
 * (which stays readable — the server refuses changes), or only the card for
 * insight pages such as analytics.
 */
export function OwnerModuleGuard({ module, children }: { module: OwnerModuleId; children: ReactNode }) {
  const { data } = useAppConfig()
  const { moduleAccess, isLocked } = usePlanAccess()

  if (data && !isOwnerModuleEnabled(data.ownerModules, module)) {
    return <Navigate to={ROUTES.owner.dashboard} replace />
  }

  const access = moduleAccess(module)
  if (access && isLocked(module)) {
    if (READ_LOCKED_MODULES.has(module)) return <PlanLockCard module={module} access={access} />
    return (
      <div className="space-y-4">
        <PlanLockCard module={module} access={access} readOnly />
        {children}
      </div>
    )
  }
  return <>{children}</>
}
