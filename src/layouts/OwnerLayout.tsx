import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { LogOut, Store } from 'lucide-react'
import { Logo } from '@/components/icons/Logo'
import { Avatar } from '@/components/ui/avatar'
import { IconButton } from '@/components/ui/icon-button'
import { Spinner } from '@/components/feedback/Spinner'
import { PageTransition } from '@/components/motion/PageTransition'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useOwnerBusiness } from '@/features/owner/hooks/useOwner'
import { OwnerNav } from '@/features/owner/components/OwnerNav'
import { OWNER_NAV } from '@/features/owner/ownerNav'
import { SuspenseOutlet } from '@/app/PageLoader'
import { cn } from '@/utils/cn'

/**
 * App shell for the business owner (document/phase/07). A proper responsive
 * panel: a fixed sidebar with every feature on desktop, and a top bar + bottom
 * nav on mobile. Owners without a business are sent to registration first.
 */
export function OwnerLayout() {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const { data: business, isLoading, isError } = useOwnerBusiness()

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Spinner size={32} label="Loading your business" />
      </div>
    )
  }

  // No business yet → onboarding. (Errors other than 404 fall through to the
  // page, which renders its own error state.)
  if (!isError && !business) {
    return <Navigate to={ROUTES.owner.register} replace />
  }

  const businessName = business?.name ?? 'My Business'

  return (
    <div className="min-h-dvh bg-background lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-surface lg:flex">
        <OwnerSidebar
          businessName={businessName}
          businessLogo={business?.logoUrl}
          userName={user?.name}
          onSignOut={() => void signOut()}
        />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur lg:hidden">
        <div className="app-container flex h-16 items-center justify-between">
          <Link to={ROUTES.owner.dashboard} aria-label="Business dashboard" className="flex items-center gap-2">
            <Logo size={30} />
            <span className="max-w-40 truncate text-body font-semibold text-foreground">
              {businessName}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <IconButton aria-label="Sign out" onClick={() => void signOut()}>
              <LogOut aria-hidden />
            </IconButton>
            <Avatar name={user?.name ?? 'Owner'} src={user?.photoUrl} size="md" />
          </div>
        </div>
      </header>

      <main id="main-content" className="app-container max-w-5xl flex-1 py-5 pb-24 lg:pb-8">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <SuspenseOutlet>
              <Outlet />
            </SuspenseOutlet>
          </PageTransition>
        </AnimatePresence>
      </main>

      <OwnerNav />
    </div>
  )
}

function OwnerSidebar({
  businessName,
  businessLogo,
  userName,
  onSignOut,
}: {
  businessName: string
  businessLogo?: string | null
  userName?: string
  onSignOut: () => void
}) {
  const location = useLocation()

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-4">
        {businessLogo ? (
          <img src={businessLogo} alt="" className="size-9 rounded-lg object-cover" loading="lazy" />
        ) : (
          <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
            <Store className="size-5" aria-hidden />
          </span>
        )}
        <span className="truncate text-body font-bold text-foreground">{businessName}</span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Business">
        {OWNER_NAV.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || location.pathname.startsWith(`${to}/`)
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-caption font-medium transition-colors',
                active
                  ? 'bg-primary-soft text-primary'
                  : 'text-text-secondary hover:bg-surface-muted hover:text-foreground',
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              {label}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-border p-3">
        <p className="truncate px-3 pb-2 text-small text-text-muted">{userName}</p>
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-caption font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-danger"
        >
          <LogOut className="size-5" aria-hidden />
          Sign out
        </button>
      </div>
    </div>
  )
}
