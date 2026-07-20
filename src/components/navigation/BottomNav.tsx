import { NavLink } from 'react-router-dom'
import { Home, MapPin, Wallet, Bell, User, type LucideIcon } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

interface Tab {
  to: string
  label: string
  icon: LucideIcon
}

// Customer navigation — capped at 5 tabs (document/phase/05 §Navigation).
const TABS: Tab[] = [
  { to: ROUTES.home, label: 'Home', icon: Home },
  { to: ROUTES.nearby, label: 'Nearby', icon: MapPin },
  { to: ROUTES.wallet, label: 'Wallet', icon: Wallet },
  { to: ROUTES.notifications, label: 'Alerts', icon: Bell },
  { to: ROUTES.profile, label: 'Profile', icon: User },
]

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur"
    >
      <ul className="app-container flex h-[72px] items-stretch justify-between px-1">
        {TABS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === ROUTES.home}
              className={({ isActive }) =>
                cn(
                  'flex h-full min-w-12 flex-col items-center justify-center gap-1 rounded-md text-small font-medium transition-colors duration-150',
                  isActive ? 'text-primary' : 'text-text-muted hover:text-text-secondary',
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
