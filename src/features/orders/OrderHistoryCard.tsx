import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Store, Coins, Clock, Star } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ReviewPromptDialog } from '@/features/businesses/components/ReviewPromptDialog'
import { ORDER_STATUS_TONE, type Order, type OrderStatusKey } from '@/features/owner/orderTypes'
import { SERVICE_META, SERVICE_TONE } from './serviceTypes'

const STATUS_LABEL: Record<OrderStatusKey, string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  paid: 'Paid',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

function formatWhen(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** One past order for the customer's order history — details + coins/rewards. */
export function OrderHistoryCard({ order }: { order: Order }) {
  const qc = useQueryClient()
  const [reviewOpen, setReviewOpen] = useState(false)
  const when = formatWhen(order.createdAt ?? order.placedAt)
  const paid = order.status === 'paid' || order.status === 'completed'
  // Offer a review once the order is paid/completed and the shop isn't reviewed yet.
  const canReview = paid && !order.reviewed && Boolean(order.businessSlug)

  return (
    <Card padding="md" className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-body font-semibold text-foreground">
            <Store className="size-4 shrink-0 text-text-muted" aria-hidden />
            <span className="truncate">{order.businessName ?? 'Order'}</span>
          </p>
          {when && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-small text-text-muted">
              <Clock className="size-3" aria-hidden /> {when}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge tone={ORDER_STATUS_TONE[order.status]}>{STATUS_LABEL[order.status]}</Badge>
          {(() => {
            const Icon = SERVICE_META[order.serviceType]?.icon
            return (
              <Badge tone={SERVICE_TONE[order.serviceType] ?? 'neutral'} className="gap-1">
                {Icon && <Icon className="size-3" aria-hidden />} {order.serviceLabel}
              </Badge>
            )
          })()}
        </div>
      </div>

      {/* Token — needed at the counter until the order is fulfilled. */}
      {(order.status === 'placed' || order.status === 'confirmed' || order.status === 'paid') && (
        <div className="flex items-center justify-between rounded-xl bg-surface-muted px-3 py-2">
          <span className="text-caption text-text-muted">Show this token</span>
          <span className="font-mono text-xl font-bold tracking-widest text-foreground">{order.token}</span>
        </div>
      )}

      {/* Items */}
      <ul className="space-y-1 border-t border-border pt-2 text-caption">
        {order.items.map((item, i) => (
          <li key={i} className="flex items-baseline justify-between gap-2 text-text-secondary">
            <span className="min-w-0 truncate">
              <span className="font-medium text-foreground">{item.quantity}×</span> {item.name}
            </span>
            <span className="shrink-0 tabular-nums">₹{item.lineTotal}</span>
          </li>
        ))}
      </ul>

      {/* Totals */}
      <div className="space-y-1 border-t border-border pt-2 text-caption">
        {order.coinsUsed > 0 && (
          <div className="flex justify-between text-text-muted">
            <span>Coins used ({order.coinsUsed})</span>
            <span>−₹{order.coinDiscount}</span>
          </div>
        )}
        <div className="flex justify-between text-body font-semibold text-foreground">
          <span>Total paid</span>
          <span>₹{order.total}</span>
        </div>
      </div>

      {/* Rewards */}
      {order.coinsEarned > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="premium" className="gap-1">
            <Coins className="size-3" aria-hidden />
            {paid ? `Earned ${order.coinsEarned} coins` : `Earn ${order.coinsEarned} coins when paid`}
          </Badge>
        </div>
      )}

      {canReview && (
        <Button
          size="sm"
          variant="outline"
          fullWidth
          leftIcon={<Star className="size-4" />}
          onClick={() => setReviewOpen(true)}
        >
          Rate this shop
        </Button>
      )}
      {order.businessSlug && (
        <ReviewPromptDialog
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          slug={order.businessSlug}
          orderId={order.id}
          businessName={order.businessName ?? 'this shop'}
          onSubmitted={() => void qc.invalidateQueries({ queryKey: ['customer', 'orders'] })}
        />
      )}
    </Card>
  )
}
