import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { useCart, cartCount, cartSubtotal } from './cartStore'
import { CartSheet } from './CartSheet'

/**
 * Persistent cart bar (Phase 7.5). Shows on every customer page whenever the
 * cart has items, so the customer can review/checkout from anywhere. Mounted
 * once in CustomerLayout.
 */
export function GlobalCartBar() {
  const current = useCart()
  const [open, setOpen] = useState(false)
  const count = cartCount(current)
  const subtotal = cartSubtotal(current)

  return (
    <>
      {count > 0 && (
        <div className="fixed inset-x-0 bottom-[84px] z-30 mx-auto w-full max-w-md px-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex w-full items-center justify-between gap-3 rounded-full bg-primary px-5 py-3 text-primary-foreground shadow-floating"
          >
            <span className="inline-flex min-w-0 items-center gap-2 text-body font-semibold">
              <ShoppingCart className="size-5 shrink-0" aria-hidden />
              <span className="truncate">
                {count} {count === 1 ? 'item' : 'items'}
                {current?.businessName ? ` · ${current.businessName}` : ''}
              </span>
            </span>
            <span className="shrink-0 text-body font-semibold">₹{subtotal}</span>
          </button>
        </div>
      )}
      <CartSheet open={open} onOpenChange={setOpen} />
    </>
  )
}
