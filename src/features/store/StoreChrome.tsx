import { Link, NavLink } from 'react-router-dom'
import { UtensilsCrossed, ReceiptIndianRupee, User, Store, type LucideIcon } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Avatar } from '@/components/ui/avatar'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { cn } from '@/utils/cn'
import type { StoreScope } from './storeScope'

/**
 * Header for store mode: the shop's own logo and name where the Listee logo,
 * location, coins and notifications usually sit — nothing that leads elsewhere.
 */
export function StoreAppBar({ scope }: { scope: StoreScope }) {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-header/95 backdrop-blur">
      <div className="app-container flex h-16 items-center justify-between gap-3">
        <Link to={ROUTES.businessProfile(scope.slug)} className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-muted ring-1 ring-border">
            {scope.logoUrl ? (
              <img src={scope.logoUrl} alt="" className="size-full object-cover" />
            ) : (
              <Store className="size-5 text-primary" aria-hidden />
            )}
          </span>
          <span className="truncate text-body-lg font-bold text-foreground">{scope.name}</span>
        </Link>
        <Link to={ROUTES.profile} aria-label="Your account" className="shrink-0">
          <Avatar name={user?.name ?? 'Guest'} src={user?.photoUrl} size="md" />
        </Link>
      </div>
    </header>
  )
}

/** Bottom tabs for store mode: this shop's menu, the customer's orders here, their account. */
export function StoreBottomNav({ scope }: { scope: StoreScope }) {
  const tabs: { to: string; label: string; icon: LucideIcon }[] = [
    { to: ROUTES.businessProfile(scope.slug), label: 'Menu', icon: UtensilsCrossed },
    { to: ROUTES.orders, label: 'My orders', icon: ReceiptIndianRupee },
    { to: ROUTES.profile, label: 'Account', icon: User },
  ]

  return (
    <nav aria-label="Shop" className="sticky bottom-0 z-40 border-t border-border bg-nav/95 backdrop-blur">
      <ul className="app-container flex h-[72px] items-stretch justify-around px-1">
        {tabs.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex h-full flex-col items-center justify-center gap-1 text-small font-medium transition-colors',
                  isActive ? 'text-nav-active' : 'text-text-muted hover:text-text-secondary',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="size-6" strokeWidth={isActive ? 2.4 : 2} aria-hidden />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
