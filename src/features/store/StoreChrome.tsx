import { Link, NavLink } from 'react-router-dom'
import { UtensilsCrossed, ReceiptIndianRupee, User, Store } from 'lucide-react'
import { TabBar, type TabBarItem } from '@/components/navigation/TabBar'
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
        <div className="flex shrink-0 items-center gap-3">
          <StoreDesktopLinks scope={scope} />
          <Link to={ROUTES.profile} aria-label="Your account" className="shrink-0">
            <Avatar name={user?.name ?? 'Guest'} src={user?.photoUrl} size="md" />
          </Link>
        </div>
      </div>
    </header>
  )
}

/** Bottom tabs for store mode: this shop's menu, the customer's orders here, their account. */
export function StoreBottomNav({ scope }: { scope: StoreScope }) {
  const tabs: TabBarItem[] = [
    { to: ROUTES.businessProfile(scope.slug), label: 'Menu', icon: UtensilsCrossed },
    { to: ROUTES.orders, label: 'My orders', icon: ReceiptIndianRupee },
    { to: ROUTES.profile, label: 'Account', icon: User },
  ]

  return <TabBar items={tabs} label="Shop" id="store-tab" />
}

/** Desktop links in the store header — the bottom tabs are phone-only. */
function StoreDesktopLinks({ scope }: { scope: StoreScope }) {
  const links = [
    { to: ROUTES.businessProfile(scope.slug), label: 'Menu' },
    { to: ROUTES.orders, label: 'My orders' },
  ]
  return (
    <nav aria-label="Shop" className="hidden items-center gap-1 lg:flex">
      {links.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'rounded-full px-4 py-2 text-caption font-semibold transition-colors',
              isActive ? 'bg-primary-soft text-primary' : 'text-text-secondary hover:bg-surface-muted hover:text-foreground',
            )
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
