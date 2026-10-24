import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Award, CheckCircle2, ChevronDown, PartyPopper, RotateCcw, Ticket, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import type { CartQuote } from './types'
import { ordinal } from './format'

/**
 * "Add ₹120 more to get ₹50 off" with a progress bar — or, once crossed, a
 * small celebration that the discount is on. Nothing when the shop has none.
 */
export function BillDiscountProgress({ quote }: { quote: CartQuote }) {
  const reduce = useReducedMotion()
  // A coupon is on instead (one offer per order) — the coupon row says so.
  if (quote.coupon && !quote.couponError) return null
  if (quote.billDiscount > 0) {
    return (
      <motion.div
        initial={reduce ? false : { scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-2 rounded-xl bg-success-soft px-3 py-2.5 text-caption font-semibold text-success"
      >
        <PartyPopper className="size-4 shrink-0" aria-hidden />
        ₹{quote.billDiscount} bill discount applied
      </motion.div>
    )
  }
  const nudge = quote.billNudge
  if (!nudge) return null
  const progress = Math.min(100, Math.max(4, (quote.subtotal / nudge.minBill) * 100))

  return (
    <div className="space-y-1.5 rounded-xl bg-primary-soft px-3 py-2.5">
      <p className="text-caption text-foreground">
        Add <span className="font-bold">₹{nudge.needed}</span> more to get <span className="font-bold text-primary">{nudge.label}</span>
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-gold"
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  )
}

/**
 * The coupon row: applied coupon with its saving, or "Apply coupon" that opens
 * the shop's codes and the customer's own rewards, plus a box to type one.
 * Applying is the customer's choice; the server checks it in the quote.
 */
export function CouponPicker({
  quote,
  applied,
  onApply,
  signedIn,
}: {
  quote: CartQuote
  applied: string | null
  onApply: (code: string | null) => void
  signedIn: boolean
}) {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')

  if (applied && quote.coupon && !quote.couponError) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-success/40 bg-success-soft px-3 py-2.5">
        <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-caption font-bold text-foreground">
            ‘{quote.coupon.code}’ applied
          </p>
          <p className="text-small font-semibold text-success">You save ₹{quote.couponDiscount}</p>
          {(quote.billDiscountAvailable ?? 0) > 0 && (
            <p className="text-small text-text-muted">Used instead of the ₹{quote.billDiscountAvailable} bill discount</p>
          )}
        </div>
        <button type="button" onClick={() => onApply(null)} className="text-small font-bold text-danger">
          Remove
        </button>
      </div>
    )
  }

  const count = quote.coupons.length
  // One offer per order: a coupon that saves less than the bill discount is no use.
  const billOff = quote.billDiscountAvailable ?? quote.billDiscount

  return (
    <div className="rounded-xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <Ticket className="size-5 shrink-0 text-primary" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-caption font-bold text-foreground">Apply coupon</span>
          <span className="block text-small text-text-muted">
            {count > 0 ? `${count} ${count === 1 ? 'coupon' : 'coupons'} available` : 'Have a code? Enter it here'}
          </span>
        </span>
        <ChevronDown className={cn('size-4 text-text-muted transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      {applied && quote.couponError && (
        <p className="flex items-center gap-1 px-3 pb-2 text-small text-destructive">
          <X className="size-3.5" aria-hidden /> {quote.couponError}
        </p>
      )}

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 border-t border-border p-3">
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (typed.trim()) onApply(typed.trim().toUpperCase())
                }}
              >
                <Input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="Enter code"
                  aria-label="Coupon code"
                  className="h-10 font-mono font-bold tracking-wider"
                />
                <Button type="submit" size="sm" variant="outline" disabled={!typed.trim()}>
                  Apply
                </Button>
              </form>

              {quote.coupons.map((c) => (
                <div
                  key={c.code}
                  className={cn('flex items-center gap-3 rounded-xl border border-dashed px-3 py-2', c.minBillMet ? 'border-primary/50' : 'border-border opacity-70')}
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5">
                      <span className="font-mono text-caption font-bold text-primary">{c.code}</span>
                      {c.personal && (
                        <span className="rounded-full bg-gold-soft px-1.5 text-[10px] font-bold text-premium-foreground">YOURS</span>
                      )}
                    </p>
                    <p className="truncate text-small text-text-secondary">
                      {c.label}
                      {c.minBill ? ` · above ₹${c.minBill}` : ''}
                    </p>
                    {c.minBillMet && c.saves > 0 && c.saves > billOff && (
                      <p className="text-small font-semibold text-success">Save ₹{c.saves}</p>
                    )}
                    {c.minBillMet && billOff > 0 && c.saves <= billOff && (
                      <p className="text-small text-text-muted">Your ₹{billOff} bill discount saves more</p>
                    )}
                    {!c.minBillMet && c.minBill && (
                      <p className="text-small text-text-muted">Add ₹{Math.round((c.minBill - quote.subtotal) * 100) / 100} more</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    disabled={!c.minBillMet || (billOff > 0 && c.saves <= billOff)}
                    onClick={() => {
                      onApply(c.code)
                      setOpen(false)
                    }}
                  >
                    Apply
                  </Button>
                </div>
              ))}

              <p className="text-small text-text-muted">One coupon or offer per order.</p>

              {!signedIn && (
                <p className="text-small text-text-muted">Sign in to see the rewards you’ve earned here.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** "This order gets you 10% off next time · 2 more stamps to a free reward". */
export function NextRewardHint({ quote }: { quote: CartQuote }) {
  const next = quote.next
  // A finished one-time card has nothing left to promise.
  const loyalty = next?.loyalty && !next.loyalty.finished ? next.loyalty : null
  if (!next || (!next.comeback && !loyalty)) return null
  const step = loyalty?.next ?? null
  const left = loyalty?.done != null && step ? step.ordersLeft : null

  return (
    <div className="space-y-1 rounded-xl bg-gold-soft/70 px-3 py-2.5 text-small text-foreground">
      {next.comeback && (
        <p className="flex items-start gap-1.5">
          <RotateCcw className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
          <span>
            This order earns you <span className="font-bold">{next.comeback.label}</span> on your next visit
          </span>
        </p>
      )}
      {loyalty && (
        <p className="flex items-start gap-1.5">
          <Award className="mt-0.5 size-3.5 shrink-0 text-premium" aria-hidden />
          <span>
            {left === 1 ? (
              <>This order unlocks a scratch card: <span className="font-bold">{step!.label}</span>!</>
            ) : left != null ? (
              <>+1 stamp · {left - 1} more after this for <span className="font-bold">{step!.label}</span></>
            ) : (
              <>
                Rewards on your{' '}
                {loyalty.steps.map((s) => ordinal(s.at)).join(', ')} order · first:{' '}
                <span className="font-bold">{loyalty.steps[0]?.label}</span>
              </>
            )}
          </span>
        </p>
      )}
    </div>
  )
}
