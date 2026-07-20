import { NavLink } from 'react-router-dom'
import { OWNER_MOBILE_NAV } from '@/features/owner/ownerNav'
import { cn } from '@/utils/cn'

/**
 * Bottom navigation for the business-owner app on mobile. On desktop the sidebar
 * (OwnerLayout) takes over, so this is hidden at `lg`. Plan & billing lives on
 * the dashboard/profile on mobile; it's on the sidebar for desktop.
 */
export function OwnerNav() {
  return (
    <nav
      aria-label="Business navigation"
      className="sticky bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur lg:hidden"
    >
      <ul className="app-container flex h-[72px] items-stretch justify-between px-1">
        {OWNER_MOBILE_NAV.map(({ to, shortLabel, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
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
                  <span>{shortLabel}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
