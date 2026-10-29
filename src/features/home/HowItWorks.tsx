import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { MapPin, QrCode, Coins, X, Store, Gift } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { useAppConfig } from '@/hooks/useAppConfig'
import { cn } from '@/utils/cn'

const DISMISS_KEY = 'home-intro-dismissed'

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * First-visit explainer: what Listee is in three steps, and that it's dine-in
 * or pickup, not delivery — so nobody arrives expecting a delivery app. Closes
 * for good once dismissed (per browser). Guests get the welcome-coins offer.
 */
export function HowItWorks({ isAuthenticated }: { isAuthenticated: boolean }) {
  const reduce = useReducedMotion()
  const { data: config } = useAppConfig()
  const tagline = config?.theme?.tagline?.trim()
  const [hidden, setHidden] = useState(wasDismissed)

  const coinValue = config?.coins?.value ?? 1
  const welcome = config?.coins?.welcome ?? 0
  const coinsOn = config?.coins?.enabled !== false

  function dismiss() {
    setHidden(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Private mode: it just shows again next visit.
    }
  }

  const steps = [
    { icon: MapPin, title: 'Find a shop near you', text: 'See menus, combos and today’s offers.' },
    { icon: QrCode, title: 'Order at the shop', text: 'Scan the table QR or order here — eat in or pick up.' },
    coinsOn
      ? { icon: Coins, title: 'Earn coins every visit', text: `1 coin = ₹${coinValue} off your next order.` }
      : { icon: Gift, title: 'Get shop rewards', text: 'Discounts and coupons apply on their own at checkout.' },
  ]

  return (
    <AnimatePresence initial={false}>
      {!hidden && (
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          className="relative overflow-hidden rounded-3xl border border-border bg-surface p-4 shadow-soft"
          aria-labelledby="how-listee-works"
        >
          <button
            type="button"
            onClick={dismiss}
            className="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-text-muted hover:bg-surface-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </button>

          <h2 id="how-listee-works" className="pr-8 text-subtitle font-bold text-foreground">
            How Listee works
          </h2>
          <p className="mt-0.5 text-caption text-text-secondary">
            {tagline ? `${tagline} ` : ''}Your local shops, their offers and your rewards — in one place.
          </p>

          <ol className="mt-4 space-y-3">
            {steps.map((step, i) => (
              <motion.li
                key={step.title}
                initial={reduce ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.12 }}
                className="flex items-start gap-3"
              >
                <span className="relative grid size-10 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <step.icon className="size-5" aria-hidden />
                  <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block text-caption font-semibold text-foreground">{step.title}</span>
                  <span className="block text-small text-text-secondary">{step.text}</span>
                </span>
              </motion.li>
            ))}
          </ol>

          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 text-small font-medium text-text-secondary">
            <Store className="size-3.5" aria-hidden /> No home delivery — dine in or pick up
          </p>

          {!isAuthenticated && coinsOn && welcome > 0 && (
            <Link
              to={ROUTES.login}
              className={cn(
                'mt-3 flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-gold-soft to-primary-soft px-4 py-3',
                'transition-transform active:scale-[0.99]',
              )}
            >
              <span className="inline-flex items-center gap-2 text-caption font-semibold text-foreground">
                <Gift className="size-5 text-premium" aria-hidden />
                Sign up and get {welcome} coins (₹{welcome * coinValue})
              </span>
              <span className="text-caption font-bold text-primary">Join</span>
            </Link>
          )}
        </motion.section>
      )}
    </AnimatePresence>
  )
}
