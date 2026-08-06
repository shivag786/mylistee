import { Coins, Check, X, CheckCheck, Utensils, MapPin, Banknote, Smartphone } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ORDER_STATUS_TONE, type Order, type OrderStatusKey, type PaymentMethodKey } from '../orderTypes'
import { SERVICE_META, SERVICE_TONE } from '@/features/orders/serviceTypes'

interface OrderCardProps {
  order: Order
  onAction: (id: string, status: Exclude<OrderStatusKey, 'placed'>, paymentMethod?: PaymentMethodKey) => void
  busy?: boolean
}

/** Owner order card (Phase 7.5) — token, items, totals, and the next action(s). */
export function OrderCard({ order, onAction, busy }: OrderCardProps) {
  return (
    <Card className="flex h-full flex-col gap-3" padding="md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-caption text-text-muted">Token</p>
          <p className="font-mono text-2xl font-bold tracking-widest text-foreground">{order.token}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge tone={ORDER_STATUS_TONE[order.status]}>{order.status}</Badge>
          {(() => {
            const Icon = SERVICE_META[order.serviceType]?.icon ?? Utensils
            return (
              <Badge tone={SERVICE_TONE[order.serviceType] ?? 'neutral'} className="gap-1">
                <Icon className="size-3" aria-hidden /> {order.serviceLabel}
              </Badge>
            )
          })()}
          {order.paymentLabel && (
            <Badge tone={order.paymentMethod === 'online' ? 'info' : 'success'} className="gap-1">
              {order.paymentMethod === 'online' ? <Smartphone className="size-3" aria-hidden /> : <Banknote className="size-3" aria-hidden />}
              {order.paymentLabel}
            </Badge>
          )}
          <p className="text-caption text-text-secondary">{order.customerName ?? 'Customer'}</p>
        </div>
      </div>

      {order.serviceAddress && (
        <p className="flex items-start gap-1.5 rounded-lg bg-surface-muted p-2 text-caption text-text-secondary">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-text-muted" aria-hidden />
          <span>{order.serviceAddress}</span>
        </p>
      )}

      <ul className="space-y-1 border-y border-border py-2">
        {order.items.map((item, i) => (
          <li key={i} className="flex items-center justify-between gap-2 text-caption">
            <span className="flex min-w-0 items-center gap-1.5 text-foreground">
              <Utensils className="size-3 shrink-0 text-text-muted" aria-hidden />
              <span className="truncate">
                {item.quantity}× {item.name}
              </span>
            </span>
            <span className="shrink-0 text-text-secondary">₹{item.lineTotal}</span>
          </li>
        ))}
      </ul>

      <div className="space-y-0.5 text-caption">
        <Row label="Subtotal" value={`₹${order.subtotal}`} />
        {order.coinsUsed > 0 && <Row label={`Coins used (${order.coinsUsed})`} value={`−₹${order.coinDiscount}`} muted />}
        {order.deliveryFee > 0 && <Row label="Delivery fee" value={`₹${order.deliveryFee}`} />}
        <div className="flex items-center justify-between font-semibold text-foreground">
          <span>Total</span>
          <span>₹{order.total}</span>
        </div>
        {order.coinsEarned > 0 && (
          <p className="inline-flex items-center gap-1 text-premium-foreground">
            <Coins className="size-3" aria-hidden /> +{order.coinsEarned} coins on payment
          </p>
        )}
      </div>

      {order.note && <p className="rounded-lg bg-surface-muted p-2 text-caption text-text-secondary">“{order.note}”</p>}

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        {order.status === 'placed' && (
          <>
            <Button size="sm" leftIcon={<Check className="size-4" />} onClick={() => onAction(order.id, 'confirmed')} disabled={busy}>
              Confirm
            </Button>
            <Button size="sm" variant="outline" leftIcon={<X className="size-4" />} onClick={() => onAction(order.id, 'cancelled')} disabled={busy}>
              Cancel
            </Button>
          </>
        )}
        {order.status === 'confirmed' && (
          <>
            <Button size="sm" variant="success" leftIcon={<Banknote className="size-4" />} onClick={() => onAction(order.id, 'paid', 'cod')} disabled={busy}>
              COD collected
            </Button>
            <Button size="sm" leftIcon={<Smartphone className="size-4" />} onClick={() => onAction(order.id, 'paid', 'online')} disabled={busy}>
              Online paid
            </Button>
            <Button size="sm" variant="outline" leftIcon={<X className="size-4" />} onClick={() => onAction(order.id, 'cancelled')} disabled={busy}>
              Cancel
            </Button>
          </>
        )}
        {order.status === 'paid' && (
          <Button size="sm" leftIcon={<CheckCheck className="size-4" />} onClick={() => onAction(order.id, 'completed')} disabled={busy}>
            Complete
          </Button>
        )}
      </div>
    </Card>
  )
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${muted ? 'text-text-muted' : 'text-text-secondary'}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
