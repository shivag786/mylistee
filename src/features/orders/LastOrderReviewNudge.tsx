import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { Star, X, Store } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ReviewPromptDialog } from '@/features/businesses/components/ReviewPromptDialog'
import { useCustomerOrders } from './useCustomerOrders'
import { isReviewNudgeDismissed, dismissReviewNudge } from './reviewNudge'
import type { Order } from '@/features/owner/orderTypes'

function orderTime(o: Order): number {
  const t = new Date(o.createdAt ?? o.placedAt ?? 0).getTime()
  return Number.isNaN(t) ? 0 : t
}

/**
 * A gentle, dismissible prompt to review the customer's most recent completed
 * order — shown once, only for the latest reviewable order (Task 2). Crossing it
 * off is permanent; the customer can still review later from the orders page.
 */
export function LastOrderReviewNudge() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return null
  return <Nudge />
}

function Nudge() {
  const qc = useQueryClient()
  const { data } = useCustomerOrders()
  const [hiddenIds, setHiddenIds] = useState<string[]>([])
  const [reviewOpen, setReviewOpen] = useState(false)
  const [rating, setRating] = useState(0)

  // The single newest paid/completed order for a shop not yet reviewed or dismissed.
  const candidate = useMemo(() => {
    const orders = [...(data ?? [])].sort((a, b) => orderTime(b) - orderTime(a))
    return orders.find(
      (o) =>
        (o.status === 'paid' || o.status === 'completed') &&
        !o.reviewed &&
        Boolean(o.businessSlug) &&
        !hiddenIds.includes(o.id) &&
        !isReviewNudgeDismissed(o.id),
    )
  }, [data, hiddenIds])

  if (!candidate) return null

  function dismiss() {
    if (!candidate) return
    dismissReviewNudge(candidate.id)
    setHiddenIds((ids) => [...ids, candidate.id])
  }

  function openReview(stars: number) {
    setRating(stars)
    setReviewOpen(true)
  }

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className="fixed inset-x-4 bottom-20 z-40 mx-auto max-w-sm rounded-2xl border border-border bg-surface p-3 shadow-floating sm:left-auto sm:right-6 sm:mx-0 lg:bottom-6"
          role="region"
          aria-label="Rate your recent order"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-muted text-text-muted">
              <Store className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-caption font-semibold text-foreground">
                How was {candidate.businessName ?? 'your order'}?
              </p>
              <div className="mt-1 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => openReview(n)}
                    aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                    className="text-border-strong transition-colors hover:text-gold"
                  >
                    <Star className={cn('size-6')} aria-hidden />
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss"
              className="-mr-1 -mt-1 shrink-0 rounded-full p-1 text-text-muted hover:bg-surface-muted hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {candidate.businessSlug && (
        <ReviewPromptDialog
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          slug={candidate.businessSlug}
          orderId={candidate.id}
          businessName={candidate.businessName ?? 'this shop'}
          initialRating={rating}
          onSubmitted={() => void qc.invalidateQueries({ queryKey: ['customer', 'orders'] })}
        />
      )}
    </>
  )
}
