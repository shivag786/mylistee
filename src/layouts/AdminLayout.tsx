import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Menu, LogOut, ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/icons/Logo'
import { Avatar } from '@/components/ui/avatar'
import { IconButton } from '@/components/ui/icon-button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { PageTransition } from '@/components/motion/PageTransition'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ADMIN_NAV, groupAdminNav } from '@/features/admin/adminNav'
import { useAppConfig } from '@/hooks/useAppConfig'
import { SuspenseOutlet } from '@/app/PageLoader'
import { LegalFooter } from '@/components/navigation/LegalFooter'
import { cn } from '@/utils/cn'

/**
 * Super Admin app shell — the same panel as the shop owner's: a fixed,
 * sectioned sidebar on desktop (in the admin's business colour when set), and
 * a top bar with a slide-in drawer on mobile. The `role:admin` guard lives on
 * the route, so anyone here is already an admin.
 */
export function AdminLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const { data: config } = useAppConfig()
  const darkPanel = Boolean(config?.theme?.business)

  // A drawer link navigates but leaves the drawer mounted: close it on route change.
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  async function handleSignOut() {
    await signOut()
    navigate(ROUTES.home, { replace: true })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background lg:pl-64">
      {/* Desktop sidebar */}
      <aside className={cn('fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r lg:flex', PANEL)}>
        <SidebarContent darkPanel={darkPanel} onSignOut={() => void handleSignOut()} userName={user?.name} />
      </aside>

      {/* Mobile top bar */}
      <header className={cn('sticky top-0 z-30 border-b shadow-soft lg:hidden', PANEL)}>
        <div className="app-container flex h-16 items-center justify-between">
          <div className="flex items-center gap-1">
            <IconButton aria-label="Open menu" className={PANEL_BUTTON} onClick={() => setOpen(true)}>
              <Menu aria-hidden />
            </IconButton>
            <Link to={ROUTES.admin.dashboard} aria-label="Admin dashboard" className="flex items-center gap-2">
              <Logo size={30} />
              <span className="grid min-w-0 leading-tight">
                <span className="text-body font-semibold">Listee</span>
                <span className={cn('text-[10px] font-semibold uppercase tracking-wider', PANEL_MUTED)}>Super admin</span>
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <IconButton aria-label="Sign out" className={PANEL_BUTTON} onClick={() => void handleSignOut()}>
              <LogOut aria-hidden />
            </IconButton>
            <Avatar name={user?.name ?? 'Admin'} src={user?.photoUrl} size="md" />
          </div>
        </div>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className={cn('w-[82%] max-w-xs gap-0 overflow-hidden rounded-r-3xl p-0 shadow-2xl lg:hidden', PANEL)}
        >
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <SidebarContent darkPanel={darkPanel} onSignOut={() => void handleSignOut()} userName={user?.name} />
        </SheetContent>
      </Sheet>

      <main id="main-content" className="app-container max-w-6xl flex-1 py-5 pb-10">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <SuspenseOutlet>
              <Outlet />
            </SuspenseOutlet>
          </PageTransition>
        </AnimatePresence>
      </main>

      <LegalFooter />
    </div>
  )
}

/** Panel surface, shared look with the owner panel (see OwnerLayout). */
const PANEL =
  'bg-[var(--business-bg,var(--surface))] text-[var(--business-fg,var(--foreground))] border-[color-mix(in_srgb,var(--business-fg,var(--foreground))_12%,transparent)]'
const PANEL_MUTED = 'text-[color-mix(in_srgb,var(--business-fg,var(--foreground))_62%,transparent)]'
const PANEL_HOVER = 'hover:bg-[color-mix(in_srgb,var(--business-fg,var(--foreground))_9%,transparent)]'
const PANEL_BUTTON = cn('text-[var(--business-fg,var(--foreground))]', PANEL_HOVER)

function SidebarContent({
  darkPanel,
  onSignOut,
  userName,
}: {
  darkPanel: boolean
  onSignOut: () => void
  userName?: string
}) {
  const location = useLocation()

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-[inherit] px-4">
        <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
          <ShieldCheck className="size-5" aria-hidden />
        </span>
        <span className="grid min-w-0 leading-tight">
          <span className="truncate text-body font-bold">Listee</span>
          <span className={cn('text-[10px] font-semibold uppercase tracking-wider', PANEL_MUTED)}>Super admin</span>
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3" aria-label="Admin">
        {groupAdminNav(ADMIN_NAV).map(({ group, items }) => (
          <div key={group} className="mb-2">
            {group !== 'Home' && (
              <p className={cn('px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider', PANEL_MUTED)}>{group}</p>
            )}
            <div className="space-y-0.5">
              {items.map(({ to, label, icon: Icon }) => {
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
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-caption font-medium transition-colors hover:text-danger',
            PANEL_MUTED,
            PANEL_HOVER,
          )}
        >
          <LogOut className="size-5" aria-hidden />
          Sign out
        </button>
      </div>
    </div>
  )
}
