import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ClipboardList } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { useOwnerOrderAlerts } from '../hooks/useOwnerOrderAlerts'

/**
 * Floating shortcut to the order queue (Phase 7.5). Always mounted in the owner
 * shell so the new-order watcher keeps polling everywhere; the visible pill only
 * appears when there are active orders and the owner isn't already on Orders.
 * Tapping jumps straight to the queue.
 */
export function FloatingOrderButton() {
  const { activeCount } = useOwnerOrderAlerts()
  const location = useLocation()
  const reduce = useReducedMotion()

  const onOrdersPage = location.pathname.startsWith(ROUTES.owner.orders)
  const show = activeCount > 0 && !onOrdersPage

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.8, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, scale: 0.8, y: 12 }}
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className="fixed bottom-24 right-4 z-40 lg:bottom-8 lg:right-8"
        >
          <Link
            to={ROUTES.owner.orders}
            aria-label={`${activeCount} active ${activeCount === 1 ? 'order' : 'orders'} — view queue`}
            className="relative flex h-14 items-center gap-2 rounded-full bg-primary pl-4 pr-5 text-primary-foreground shadow-floating transition-transform hover:scale-105 active:scale-95"
          >
            <span className="relative grid size-9 place-items-center">
              <ClipboardList className="size-6" aria-hidden />
              {!reduce && (
                <motion.span
                  className="absolute inset-0 rounded-full bg-primary-foreground/30"
                  animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                  aria-hidden
                />
              )}
            </span>
            <span className="text-caption font-semibold">
              {activeCount} {activeCount === 1 ? 'order' : 'orders'}
            </span>
            <span
              className="absolute -right-1 -top-1 grid min-w-6 place-items-center rounded-full bg-destructive px-1.5 py-0.5 text-[11px] font-bold text-white shadow-soft"
              aria-hidden
            >
              {activeCount > 99 ? '99+' : activeCount}
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
