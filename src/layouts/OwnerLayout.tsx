import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Clock, Lock, LogOut, Menu, Store } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Logo } from '@/components/icons/Logo'
import { Avatar } from '@/components/ui/avatar'
import { IconButton } from '@/components/ui/icon-button'
import { Spinner } from '@/components/feedback/Spinner'
import { PageTransition } from '@/components/motion/PageTransition'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useOwnerBusiness } from '@/features/owner/hooks/useOwner'
import { OwnerNav } from '@/features/owner/components/OwnerNav'
import { FloatingOrderButton } from '@/features/owner/components/FloatingOrderButton'
import { groupOwnerNav, OWNER_NAV, visibleOwnerNav, type OwnerNavItem } from '@/features/owner/ownerNav'
import { useAppConfig } from '@/hooks/useAppConfig'
import { usePlanAccess } from '@/features/owner/hooks/usePlanAccess'
import { SuspenseOutlet } from '@/app/PageLoader'
import { LegalFooter } from '@/components/navigation/LegalFooter'
import { cn } from '@/utils/cn'

/**
 * App shell for the business owner (document/phase/07). A proper responsive
 * panel: a fixed sidebar with every feature on desktop, and a top bar + bottom
 * nav on mobile. Owners without a business are sent to registration first.
 */
export function OwnerLayout() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { data: business, isLoading, isError } = useOwnerBusiness()
  const { data: config } = useAppConfig()
  const nav = visibleOwnerNav(OWNER_NAV, config?.ownerModules)
  // "Listee for Business": a dark sidebar/top bar when the admin set a panel colour.
  const darkPanel = Boolean(config?.theme?.business)

  // Tapping a drawer link navigates but leaves the drawer mounted, so close it
  // whenever the route changes.
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  async function handleSignOut() {
    await signOut()
    navigate(ROUTES.home, { replace: true })
  }

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
    <div className="flex min-h-dvh flex-col bg-background lg:pl-64">
      {/* Desktop sidebar */}
      <aside className={cn('fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r lg:flex', PANEL)}>
        <OwnerSidebar
          darkPanel={darkPanel}
          nav={nav}
          businessName={businessName}
          businessLogo={business?.logoUrl}
          userName={user?.name}
          onSignOut={() => void handleSignOut()}
        />
      </aside>

      {/* Mobile top bar */}
      <header className={cn('sticky top-0 z-30 border-b shadow-soft lg:hidden', PANEL)}>
        <div className="app-container flex h-16 items-center justify-between">
          <div className="flex items-center gap-1">
            <IconButton aria-label="Open menu" className={PANEL_BUTTON} onClick={() => setMenuOpen(true)}>
              <Menu aria-hidden />
            </IconButton>
            <Link to={ROUTES.owner.dashboard} aria-label="Business dashboard" className="flex items-center gap-2">
              <Logo size={30} />
              <span className="grid min-w-0 leading-tight">
                <span className="max-w-32 truncate text-body font-semibold">{businessName}</span>
                {darkPanel && <span className={cn('text-[10px] font-semibold uppercase tracking-wider', PANEL_MUTED)}>Listee for Business</span>}
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <IconButton aria-label="Sign out" className={PANEL_BUTTON} onClick={() => void handleSignOut()}>
              <LogOut aria-hidden />
            </IconButton>
            <Avatar name={user?.name ?? 'Owner'} src={user?.photoUrl} size="md" />
          </div>
        </div>
      </header>

      {/* Mobile side menu — the bottom bar only holds five tabs, so everything
          else (Tables & service, Redeem, Reviews, Analytics, Plan & billing, …)
          lives here rather than being unreachable on a phone. */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="left"
          className={cn('w-[82%] max-w-xs gap-0 overflow-hidden rounded-r-3xl p-0 shadow-2xl lg:hidden', PANEL)}
        >
          <SheetTitle className="sr-only">Business menu</SheetTitle>
          <OwnerSidebar
            darkPanel={darkPanel}
            nav={nav}
            businessName={businessName}
            businessLogo={business?.logoUrl}
            userName={user?.name}
            onSignOut={() => void handleSignOut()}
          />
        </SheetContent>
      </Sheet>

      <PlanEndingBanner />

      <main id="main-content" className="app-container max-w-5xl flex-1 py-5 pb-24 lg:pb-8">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <SuspenseOutlet>
              <Outlet />
            </SuspenseOutlet>
          </PageTransition>
        </AnimatePresence>
      </main>

      <LegalFooter />

      <FloatingOrderButton />

      <OwnerNav />
    </div>
  )
}

/**
 * Panel surface: the admin's business colour with readable text (or the plain
 * light look). The fallbacks matter: without them a stylesheet that does not
 * define --business-bg leaves the panel (and the mobile drawer) see-through.
 */
const PANEL =
  'bg-[var(--business-bg,var(--surface))] text-[var(--business-fg,var(--foreground))] border-[color-mix(in_srgb,var(--business-fg,var(--foreground))_12%,transparent)]'
const PANEL_MUTED = 'text-[color-mix(in_srgb,var(--business-fg,var(--foreground))_62%,transparent)]'
const PANEL_HOVER = 'hover:bg-[color-mix(in_srgb,var(--business-fg,var(--foreground))_9%,transparent)]'
const PANEL_BUTTON = cn('text-[var(--business-fg,var(--foreground))]', PANEL_HOVER)

function OwnerSidebar({
  darkPanel,
  nav,
  businessName,
  businessLogo,
  userName,
  onSignOut,
}: {
  darkPanel: boolean
  nav: OwnerNavItem[]
  businessName: string
  businessLogo?: string | null
  userName?: string
  onSignOut: () => void
}) {
  const location = useLocation()
  const { isLocked } = usePlanAccess()

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-[inherit] px-4">
        {businessLogo ? (
          <img src={businessLogo} alt="" className="size-9 rounded-lg object-cover" loading="lazy" />
        ) : (
          <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
            <Store className="size-5" aria-hidden />
          </span>
        )}
        <span className="grid min-w-0 leading-tight">
          <span className="truncate text-body font-bold">{businessName}</span>
          <span className={cn('text-[10px] font-semibold uppercase tracking-wider', PANEL_MUTED)}>Listee for Business</span>
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3" aria-label="Business">
        {groupOwnerNav(nav).map(({ group, items }) => (
          <div key={group} className="mb-2">
            {group !== 'Home' && (
              <p className={cn('px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider', PANEL_MUTED)}>{group}</p>
            )}
            <div className="space-y-0.5">
        {items.map(({ to, label, icon: Icon, module }) => {
          const active = location.pathname === to || location.pathname.startsWith(`${to}/`)
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-caption font-medium transition-colors',
                active
                  ? darkPanel
                    ? 'bg-gold font-semibold text-gold-foreground'
                    : 'bg-primary-soft text-primary'
                  : cn(PANEL_MUTED, PANEL_HOVER, 'hover:text-[var(--business-fg,var(--foreground))]'),
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span className="flex-1">{label}</span>
              {isLocked(module) && <Lock className="size-3.5 shrink-0 opacity-70" aria-label="Not in your plan" />}
            </NavLink>
          )
        })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[inherit] p-3">
        <p className={cn('truncate px-3 pb-2 text-small', PANEL_MUTED)}>{userName}</p>
        <button
          type="button"
          onClick={onSignOut}
          className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-caption font-medium transition-colors hover:text-danger', PANEL_MUTED, PANEL_HOVER)}
        >
          <LogOut className="size-5" aria-hidden />
          Sign out
        </button>
      </div>
    </div>
  )
}

/**
 * Plan time running out, or already over, said once across the top of every
 * page: the shop stays live either way, but modules lock when it ends.
 */
function PlanEndingBanner() {
  const { access } = usePlanAccess()
  const location = useLocation()
  if (!access || location.pathname === ROUTES.owner.subscription) return null

  const soon = !access.expired && access.daysLeft !== null && access.daysLeft <= 3
  if (!access.expired && !soon) return null

  return (
    <div
      className={cn(
        'border-b px-4 py-2.5 text-caption',
        access.expired ? 'border-danger/30 bg-danger-soft' : 'border-warning/40 bg-warning-soft',
      )}
    >
      <div className="app-container flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-1.5 px-0">
        <Clock className={cn('size-4 shrink-0', access.expired ? 'text-danger' : 'text-warning')} aria-hidden />
        <span className="min-w-0 flex-1 text-foreground">
          {access.expired ? (
            <>
              <b>{access.onFreePlan ? 'Your free days are over.' : 'Your plan has ended.'}</b> Your shop, menu and QR stay
              live, but ordering and other features are paused.
            </>
          ) : (
            <>
              <b>
                {access.daysLeft === 0
                  ? 'Your plan ends today.'
                  : `${access.daysLeft} ${access.daysLeft === 1 ? 'day' : 'days'} left on your ${access.onFreePlan ? 'free time' : 'plan'}.`}
              </b>{' '}
              Choose a plan to keep everything running.
            </>
          )}
        </span>
        <Link
          to={ROUTES.owner.subscription}
          className="rounded-full bg-primary px-3 py-1 text-small font-semibold text-primary-foreground"
        >
          See plans
        </Link>
      </div>
    </div>
  )
}
