/**
 * Route guard: the mirror of {@link RequireAuth}. It wraps the sign-in pages so
 * somebody who already has a session never has to look at a login form.
 *
 * It sends them to exactly where a fresh sign-in would have: the page they were
 * originally headed for, otherwise `landingPathForRole` — the same helper the
 * Google and PIN login flows call. For a business owner that is `/business`,
 * which then picks the dashboard or the registration wizard depending on
 * whether they have a business yet.
 *
 * This is also what lands a Google *redirect* sign-in. On devices that fall back
 * to the redirect flow the browser leaves the app entirely and comes back on a
 * fresh page load, so the `navigate()` inside the login page's click handler
 * never runs — the session was established but the user was left staring at the
 * sign-in button, which is indistinguishable from a broken one.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Spinner } from '@/components/feedback/Spinner'
import type { UserRole } from '@/types/common'
import { useAuth } from '../hooks/useAuth'
import { landingPathForRole } from '../roleRoutes'
import { readPostLoginTarget } from '../postLoginTarget'

interface LocationState {
  from?: { pathname: string }
}

interface RedirectIfAuthenticatedProps {
  /**
   * Only bounce these roles; everyone else sees the page as normal. Used by
   * `/get-started`, which a signed-in customer may legitimately open to list
   * their own business — only staff, who already have somewhere to be, are
   * sent on.
   */
  roles?: UserRole[]
}

export function RedirectIfAuthenticated({ roles }: RedirectIfAuthenticatedProps = {}) {
  const { user, status } = useAuth()
  const location = useLocation()

  // Never flash the login form while the stored token is still being verified —
  // that flash, followed by a jump, is what makes a returning owner think they
  // were signed out.
  if (status === 'initializing') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Spinner size={32} label="Checking your session" />
      </div>
    )
  }

  if (status === 'authenticated' && user && (!roles || roles.includes(user.role))) {
    const from = (location.state as LocationState | null)?.from?.pathname
    return <Navigate to={from ?? readPostLoginTarget() ?? landingPathForRole(user.role)} replace />
  }

  return <Outlet />
}
