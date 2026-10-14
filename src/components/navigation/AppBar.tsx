import { Link, NavLink } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Logo } from '@/components/icons/Logo'
import { Avatar } from '@/components/ui/avatar'
import { IconButton } from '@/components/ui/icon-button'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useUnreadCount } from '@/features/notifications/hooks/useNotifications'
import { CoinsPill } from '@/features/wallet/components/CoinsPill'
import { LocationChip } from '@/features/location/LocationChip'
import { cn } from '@/utils/cn'
import { CUSTOMER_DESKTOP_TABS } from './customerTabs'

/**
 * Top app bar: logo + location left, actions right (document-00A §18). On
 * laptops the bottom tabs are gone, so the main links sit in the middle here.
 */
export function AppBar() {
  const { user } = useAuth()
  const { data: unread = 0 } = useUnreadCount()

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-header/90 backdrop-blur-xl">
      <div className="app-container flex h-16 items-center justify-between gap-3">
        {/* The wordmark gives way to the location chip: the chip has to be able
            to show a long area name, and the mark alone still identifies the app. */}
        <div className="flex min-w-0 flex-1 items-center gap-1 lg:flex-none">
          <Link to={ROUTES.home} aria-label="Listee home" className="shrink-0">
            <Logo size={32} />
          </Link>
          <LocationChip className="min-w-0 max-w-[11rem] md:max-w-[15rem]" />
        </div>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {CUSTOMER_DESKTOP_TABS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-caption font-semibold transition-colors',
                  isActive
                    ? 'bg-nav-active/10 text-nav-active'
                    : 'text-text-secondary hover:bg-surface-muted hover:text-foreground',
                )
              }
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <IconButton aria-label="Search" asChild className="hidden md:inline-flex">
            <Link to={ROUTES.search}>
              <Search aria-hidden />
            </Link>
          </IconButton>
          <CoinsPill />
          <IconButton
            aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
            asChild
            className="relative"
          >
            <Link to={ROUTES.notifications}>
              <Bell aria-hidden />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground ring-2 ring-header">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
          </IconButton>
          <Link to={ROUTES.profile} aria-label="Your profile" className="rounded-full ring-offset-2 transition hover:ring-2 hover:ring-primary/40">
            <Avatar name={user?.name ?? 'Guest'} src={user?.photoUrl} size="md" />
          </Link>
        </div>
      </div>
    </header>
  )
}
