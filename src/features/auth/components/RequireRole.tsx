/**
 * Route guard: restricts a branch to one or more roles (document/phase/02
 * §User Roles). Assumes it sits inside <RequireAuth>, so the user is already
 * authenticated; a mismatched role is sent home rather than to login.
 */
import { Navigate, Outlet } from 'react-router-dom'
import { Spinner } from '@/components/feedback/Spinner'
import { ROUTES } from '@/constants/routes'
import type { UserRole } from '@/types/common'
import { useAuth } from '../hooks/useAuth'

interface RequireRoleProps {
  allow: UserRole | UserRole[]
}

export function RequireRole({ allow }: RequireRoleProps) {
  const { user, status } = useAuth()
  const allowed = Array.isArray(allow) ? allow : [allow]

  if (status === 'initializing') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Spinner size={32} label="Checking access" />
      </div>
    )
  }

  if (!user || !allowed.includes(user.role)) {
    return <Navigate to={ROUTES.home} replace />
  }

  return <Outlet />
}
