import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu, LogOut, ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/icons/Logo'
import { IconButton } from '@/components/ui/icon-button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ADMIN_NAV } from '@/features/admin/adminNav'
import { SuspenseOutlet } from '@/app/PageLoader'
import { cn } from '@/utils/cn'

/**
 * Super Admin app shell (document/phase/14 §Mobile Admin — responsive). A fixed
 * sidebar on desktop; a slide-in drawer on mobile. The `role:admin` guard lives
 * on the route, so anyone here is already an admin.
 */
export function AdminLayout() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-dvh bg-background lg:pl-60">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-surface lg:flex">
        <SidebarContent onNavigate={() => {}} onSignOut={() => void signOut()} userName={user?.name} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <IconButton aria-label="Open menu">
              <Menu aria-hidden />
            </IconButton>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Admin navigation</SheetTitle>
            <SidebarContent
              onNavigate={() => setOpen(false)}
              onSignOut={() => void signOut()}
              userName={user?.name}
            />
          </SheetContent>
        </Sheet>
        <Link to={ROUTES.admin.dashboard} className="flex items-center gap-2">
          <Logo size={26} />
          <span className="text-body font-semibold text-foreground">Admin</span>
        </Link>
        <span className="w-10" aria-hidden />
      </header>

      <main id="main-content" className="app-container max-w-6xl py-5">
        <SuspenseOutlet>
          <Outlet />
        </SuspenseOutlet>
      </main>
    </div>
  )
}

function SidebarContent({
  onNavigate,
  onSignOut,
  userName,
}: {
  onNavigate: () => void
  onSignOut: () => void
  userName?: string
}) {
  const location = useLocation()

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <Logo size={28} />
        <div className="flex items-center gap-1.5">
          <span className="text-body font-bold text-foreground">Listee</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 text-small font-medium text-secondary">
            <ShieldCheck className="size-3" aria-hidden /> Admin
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Admin">
        {ADMIN_NAV.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || location.pathname.startsWith(`${to}/`)
          return (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-caption font-medium transition-colors',
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
