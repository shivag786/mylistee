import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronRight, ShoppingBag, Trash2 } from 'lucide-react'
import { toast } from '@/utils/toast'
import { useCart, cart, cartCount, cartSubtotal, onOpenCartSheet } from './cartStore'
import { CartSheet } from './CartSheet'

/**
 * Persistent cart bar (Phase 7.5). Floats above the bottom tabs on every
 * customer page whenever the cart has items, so the customer can review or
 * check out from anywhere — or empty it with the bin, with an Undo toast in
 * place of a confirm dialog. Mounted once in CustomerLayout.
 */
export function GlobalCartBar() {
  const current = useCart()
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const count = cartCount(current)
  const subtotal = cartSubtotal(current)
  const thumbs = (current?.items ?? []).filter((i) => i.imageUrl).slice(0, 3)

  useEffect(() => onOpenCartSheet(() => setOpen(true)), [])

  function clearCart() {
    if (!current) return
    const saved = current
    cart.clear()
    toast.undo('Cart cleared', () => cart.restore(saved))
  }

  return (
    <>
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            key="cart-bar"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 32 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 mx-auto flex w-full max-w-lg items-center gap-2 px-3 sm:px-4 lg:bottom-6"
          >
            <button
              type="button"
              onClick={clearCart}
              aria-label="Clear cart"
              className="grid size-12 shrink-0 place-items-center rounded-full border border-border bg-surface text-danger shadow-floating transition-colors hover:bg-danger-soft active:scale-95"
            >
              <Trash2 className="size-5" aria-hidden />
            </button>

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-primary-hover py-2 pl-2 pr-3 text-primary-foreground shadow-premium transition-transform active:scale-[0.98]"
            >
              {/* The first few dishes, stacked — or a bag when none has a photo. */}
              <span className="flex shrink-0 -space-x-3">
                {thumbs.length > 0 ? (
                  thumbs.map((item) => (
                    <img
                      key={`${item.type}-${item.id}`}
                      src={item.imageUrl!}
                      alt=""
                      className="size-9 rounded-xl object-cover ring-2 ring-primary"
                    />
                  ))
                ) : (
                  <span className="grid size-9 place-items-center rounded-xl bg-white/20">
                    <ShoppingBag className="size-5" aria-hidden />
                  </span>
                )}
              </span>

              <span className="min-w-0 flex-1 text-left leading-tight">
                <motion.span
                  key={count}
                  initial={reduce ? false : { scale: 1.15 }}
                  animate={{ scale: 1 }}
                  className="block origin-left text-caption font-bold"
                >
                  {count} {count === 1 ? 'item' : 'items'} added · ₹{subtotal}
                </motion.span>
                {current?.businessName && (
                  <span className="block truncate text-small opacity-85">from {current.businessName}</span>
                )}
              </span>

              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-white/20 py-1.5 pl-3 pr-2 text-small font-bold">
                View cart
                <ChevronRight className="size-4" aria-hidden />
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <CartSheet open={open} onOpenChange={setOpen} />
    </>
  )
}
