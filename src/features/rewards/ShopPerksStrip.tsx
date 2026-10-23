import { Link, useLocation } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Gift, Lock, Receipt, RotateCcw, Ticket } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { rememberPostLoginTarget } from '@/features/auth/postLoginTarget'
import { toast } from '@/utils/toast'
import { cn } from '@/utils/cn'
import type { ShopPerks } from './types'
import { LoyaltyJourney } from './LoyaltyJourney'

/**
 * "Why order here" on the shop page: the loyalty journey on its own, then the
 * bill discount, come-back offer and coupon codes as swipeable tiles. Guests see every
 * reward with a nudge to sign in; nothing renders when the shop has none.
 */
export function ShopPerksStrip({ perks, isAuthenticated }: { perks?: ShopPerks; isAuthenticated: boolean }) {
  const reduce = useReducedMotion()
  const location = useLocation()
  if (!perks) return null
  const { billDiscount, loyalty, comeback, coupons } = perks
  if (!billDiscount && !loyalty && !comeback && coupons.length === 0) return null

  function copy(code: string) {
    void navigator.clipboard?.writeText(code).catch(() => undefined)
    toast.success(`${code} copied`, 'Pick it in your cart to apply.')
  }

  const tile = 'relative flex w-[11.5rem] shrink-0 snap-start flex-col gap-1 overflow-hidden rounded-2xl p-3.5 shadow-soft'

  return (
    <section className="space-y-2.5" aria-label="Rewards at this shop">
      <div className="flex items-center justify-between px-1">
        <h2 className="flex items-center gap-1.5 text-body-lg font-bold text-foreground">
          <Gift className="size-5 text-primary" aria-hidden /> Order here & save
        </h2>
        {!isAuthenticated && (
          <Link
            to={ROUTES.login}
            onClick={() => rememberPostLoginTarget(location.pathname + location.search)}
            className="inline-flex items-center gap-1 text-caption font-bold text-primary"
          >
            <Lock className="size-3.5" aria-hidden /> Sign in to unlock
          </Link>
        )}
      </div>

      {loyalty && <LoyaltyJourney loyalty={loyalty} />}

      {(billDiscount || comeback || coupons.length > 0) && (
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {billDiscount && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(tile, 'bg-gradient-to-br from-primary to-primary-hover text-primary-foreground')}
          >
            <Receipt className="size-5 opacity-90" aria-hidden />
            <p className="text-subtitle font-extrabold leading-tight">{billDiscount.label.toUpperCase()}</p>
            <p className="text-small opacity-90">
              {billDiscount.minBill > 0 ? `on bills above ₹${billDiscount.minBill}` : 'on every bill'} · applied automatically
            </p>
          </motion.div>
        )}

        {comeback && (
          <div className={cn(tile, 'bg-gradient-to-br from-success-soft to-surface ring-1 ring-success/30')}>
            <RotateCcw className="size-5 text-success" aria-hidden />
            <p className="text-body font-extrabold leading-tight text-foreground">{comeback.label} next time</p>
            <p className="text-small text-text-secondary">
              Every order earns a coupon for your next visit (valid {comeback.days} days).
            </p>
          </div>
        )}

        {coupons.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => copy(c.code)}
            className={cn(tile, 'border-2 border-dashed border-primary/50 bg-surface text-left')}
          >
            <Ticket className="size-5 text-primary" aria-hidden />
            <p className="text-body font-extrabold leading-tight text-foreground">{c.label}</p>
            <p className="font-mono text-caption font-bold tracking-wider text-primary">{c.code}</p>
            <p className="text-small text-text-secondary">
              {c.personal ? 'Your reward' : 'Tap to copy'}
              {c.minBill ? ` · above ₹${c.minBill}` : ''}
            </p>
            {/* Ticket notches */}
            <span className="absolute -left-2 top-1/2 size-4 -translate-y-1/2 rounded-full bg-background" aria-hidden />
            <span className="absolute -right-2 top-1/2 size-4 -translate-y-1/2 rounded-full bg-background" aria-hidden />
          </button>
        ))}
      </div>
      )}
    </section>
  )
}
