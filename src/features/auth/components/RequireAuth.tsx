/**
 * Route guard: renders children only for an authenticated user. While the
 * session is still resolving it shows a spinner; unauthenticated visitors are
 * redirected to the login page with a `from` location so they return to where
 * they were headed after signing in (document/phase/12 §Protected Routes).
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Spinner } from '@/components/feedback/Spinner'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '../hooks/useAuth'

export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'initializing') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Spinner size={32} label="Checking your session" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    // Staff (owners + admins) share one sign-in link; customers use Google.
    const isStaffArea =
      location.pathname.startsWith('/admin') || location.pathname.startsWith('/business')
    const loginPath = isStaffArea ? ROUTES.ownerLogin : ROUTES.login
    return <Navigate to={loginPath} state={{ from: location }} replace />
  }

  return <Outlet />
}
