import { NavLink } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface TabBarItem {
  to: string
  label: string
  icon: LucideIcon
  /** Match the route exactly (the home tab would otherwise match everything). */
  end?: boolean
}

/**
 * The phone's bottom tab bar, shared by the customer, store and owner shells.
 * The active tab gets a tinted pill behind its icon and an accent bar on top,
 * both sliding between tabs. Clears the iPhone home indicator via the safe
 * area, and hides at `lg`, where each shell has its own desktop navigation.
 */
export function TabBar({ items, label, id }: { items: TabBarItem[]; label: string; id: string }) {
  const reduce = useReducedMotion()
  const spring = reduce ? { duration: 0 } : { type: 'spring' as const, stiffness: 500, damping: 38 }

  return (
    <nav
      aria-label={label}
      className="sticky bottom-0 z-40 border-t border-border/60 bg-nav/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-16px_rgba(16,24,40,0.25)] backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto flex h-16 max-w-xl items-stretch px-1.5">
        {items.map(({ to, label: text, icon: Icon, end }) => (
          <li key={to} className="min-w-0 flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'relative flex h-full flex-col items-center justify-center gap-0.5 transition-colors duration-150',
                  isActive ? 'text-nav-active' : 'text-text-muted active:text-text-secondary',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId={`${id}-bar`}
                      transition={spring}
                      className="absolute inset-x-0 top-0 mx-auto h-[3px] w-8 rounded-b-full bg-nav-active"
                      aria-hidden
                    />
                  )}
                  <span className="relative grid h-8 w-14 place-items-center">
                    {isActive && (
                      <motion.span
                        layoutId={`${id}-pill`}
                        transition={spring}
                        className="absolute inset-0 rounded-full bg-nav-active/12"
                        aria-hidden
                      />
                    )}
                    <Icon
                      className="relative size-[22px]"
                      strokeWidth={isActive ? 2.4 : 1.9}
                      aria-hidden
                    />
                  </span>
                  <span
                    className={cn(
                      'max-w-full truncate px-0.5 text-[11px] leading-none tracking-wide',
                      isActive ? 'font-bold' : 'font-medium',
                    )}
                  >
                    {text}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
