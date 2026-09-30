/**
 * How an order's bill splits between online and the counter.
 *
 * Shared by the customer's order history and the owner's order card so the two
 * can never describe the same order differently. Renders nothing for a cash
 * order, which has nothing to split -- including every order placed before
 * online payment existed.
 */
import type { Order } from '@/features/owner/orderTypes'

export function PaymentBreakdown({ order }: { order: Order }) {
  const online = order.onlineAmount ?? 0
  if (online <= 0) return null

  const fee = order.convenienceFee ?? 0
  const due = order.amountDue ?? order.total
  const paid = order.paidOnline ?? false

  return (
    <div className="space-y-1 rounded-xl bg-surface-muted px-3 py-2 text-caption">
      <div className="flex justify-between text-text-secondary">
        <span>{paid ? 'Paid online' : 'To pay online'}</span>
        <span className="tabular-nums font-medium text-foreground">₹{online}</span>
      </div>
      {fee > 0 && (
        <div className="flex justify-between text-text-muted">
          {/* Separate from the order: it paid for the gateway, not the food. */}
          <span>Convenience fee</span>
          <span className="tabular-nums">₹{fee}</span>
        </div>
      )}
      <div className="flex justify-between font-semibold text-foreground">
        <span>{due > 0 ? 'Pay at the counter' : 'Nothing left to pay'}</span>
        {due > 0 && <span className="tabular-nums">₹{due}</span>}
      </div>
    </div>
  )
}
