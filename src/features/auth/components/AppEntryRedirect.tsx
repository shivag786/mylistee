/**
 * Opening the app sends staff to their own panel instead of the customer home.
 *
 * The PWA's start_url is `/`, and so is the bare domain, so a business owner
 * who closes the tab and reopens it comes back to the customer home page — the
 * app apparently having forgotten them, even though the session is intact.
 * Their dashboard is where they meant to land, and it is where signing in would
 * have put them, via the same `landingPathForRole` the login flows use.
 *
 * Only on app *entry*, not on every visit to `/`. React Router labels the
 * location it was created with `default` and gives every later one a generated
 * key, which distinguishes "this tab just opened here" from "the user navigated
 * here" — so an owner can still open Listee as a customer mid-session (to look
 * at how their own listing appears, say) without being thrown back to the
 * dashboard.
 *
 * A visitor with no session goes to the login page for the same reason: opening
 * the app should ask who you are, not drop you into a home page that cannot
 * show you your wallet, orders or rewards.
 *
 * Customers who are signed in are left alone — `/` is already their landing
 * page. And because this is entry only, "Skip for now" still works: that is an
 * in-app navigation to `/`, so the guest gets the home page and can browse.
 */
import { Navigate, useLocation } from 'react-router-dom'
import { Spinner } from '@/components/feedback/Spinner'
import { ROUTES } from '@/constants/routes'
import type { UserRole } from '@/types/common'
import { useAuth } from '../hooks/useAuth'
import { landingPathForRole } from '../roleRoutes'

/** Roles whose home is somewhere other than `/`. */
const STAFF_ROLES: UserRole[] = ['business_owner', 'admin']

export function AppEntryRedirect({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth()
  const location = useLocation()

  const isAppEntry = location.key === 'default'

  // Nothing to decide unless this is the entry — a mid-session visit to `/`
  // renders the home page without waiting on anything.
  if (!isAppEntry) return <>{children}</>

  // A stored token is still being verified, so we do not yet know whether this
  // is an owner. Rendering the customer home now would show it for a beat and
  // then yank it away.
  if (status === 'initializing') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Spinner size={32} label="Checking your session" />
      </div>
    )
  }

  if (user && STAFF_ROLES.includes(user.role)) {
    return <Navigate to={landingPathForRole(user.role)} replace />
  }

  // No session — ask who they are rather than opening on a guest home page.
  // `replace` matters: it keeps the home page out of history, so Back from the
  // login screen leaves the app instead of bouncing between the two.
  if (!user) return <Navigate to={ROUTES.login} replace />

  return <>{children}</>
}
