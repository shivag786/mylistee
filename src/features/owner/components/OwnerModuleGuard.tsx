import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useAppConfig } from '@/hooks/useAppConfig'
import { isOwnerModuleEnabled, type OwnerModuleId } from '@/features/owner/ownerNav'

/**
 * Blocks an owner route when the admin has disabled its module (Owner menu page).
 * While config is still loading we render the page — only an explicit "off"
 * redirects to the dashboard, so there's no flash of a redirect on first load.
 */
export function OwnerModuleGuard({ module, children }: { module: OwnerModuleId; children: ReactNode }) {
  const { data } = useAppConfig()

  if (data && !isOwnerModuleEnabled(data.ownerModules, module)) {
    return <Navigate to={ROUTES.owner.dashboard} replace />
  }
  return <>{children}</>
}
