import { motion, useReducedMotion } from 'framer-motion'
import { Check, Gift, Repeat, Trophy } from 'lucide-react'
import { cn } from '@/utils/cn'
import { ordinal } from './format'
import type { ShopPerks } from './types'

type Loyalty = NonNullable<ShopPerks['loyalty']>

/**
 * The shop's loyalty card as a journey: a track from the first order to the
 * last step, each step a gift on its order number, filled up to where the
 * customer is. Shown on its own, apart from the other perks.
 */
export function LoyaltyJourney({ loyalty, compact = false }: { loyalty: Loyalty; compact?: boolean }) {
  const reduce = useReducedMotion()
  const { steps, every, done, next, finished, repeat } = loyalty
  const progress = done == null ? 0 : Math.min(1, done / every)
  const guest = done == null

  return (
    <section
      aria-label="Loyalty rewards"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#6d28d9] p-4 text-white shadow-premium"
    >
      {/* Glow */}
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-fuchsia-400/30 blur-2xl" />
      <span aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 size-40 rounded-full bg-amber-300/20 blur-2xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/70">
            <Trophy className="size-3.5" aria-hidden /> Loyalty rewards
          </p>
          <p className="mt-1 text-body-lg font-extrabold leading-snug">
            {finished
              ? 'You’ve collected every reward here 🎉'
              : guest
                ? `${steps.length} rewards waiting for regulars`
                : next && next.ordersLeft === 1
                  ? `Your next order unlocks ${next.label}!`
                  : next
                    ? `${next.ordersLeft} more orders to ${next.label}`
                    : 'Keep ordering to earn rewards'}
          </p>
        </div>
        {repeat && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
            <Repeat className="size-3" aria-hidden /> Repeats
          </span>
        )}
      </div>

      {/* The track */}
      <div className={cn('relative', compact ? 'mt-6 mb-1' : 'mt-8 mb-2')}>
        <div className="mx-3 h-2 rounded-full bg-white/15">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-300 to-lime-300 shadow-[0_0_12px_rgba(253,224,71,0.7)]"
            initial={reduce ? false : { width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: 'spring', stiffness: 60, damping: 18, delay: 0.15 }}
          />
        </div>

        {steps.map((step, i) => {
          const left = (step.at / every) * 100
          const isNext = next?.at === step.at
          return (
            <motion.div
              key={step.at}
              className="absolute top-1 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `calc(12px + (100% - 24px) * ${left / 100})` }}
              initial={reduce ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.25 + i * 0.08, type: 'spring', stiffness: 380, damping: 18 }}
            >
              <motion.span
                className={cn(
                  'grid size-9 place-items-center rounded-full border-2 shadow-lg',
                  step.reached
                    ? 'border-yellow-200 bg-gradient-to-br from-amber-300 to-yellow-400 text-amber-900'
                    : isNext
                      ? 'border-white bg-white text-violet-700'
                      : 'border-white/40 bg-[#3b2f8f] text-white/80',
                )}
                animate={isNext && !reduce ? { scale: [1, 1.12, 1] } : undefined}
                transition={isNext ? { duration: 1.4, repeat: Infinity } : undefined}
              >
                {step.reached ? <Check className="size-4" strokeWidth={3} aria-hidden /> : <Gift className="size-4" aria-hidden />}
              </motion.span>
            </motion.div>
          )
        })}
      </div>

      {/* Each step's reward, like separate cards */}
      <div className={cn('relative -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]', compact ? 'mt-5' : 'mt-7')}>
        {steps.map((step, i) => {
          const isNext = next?.at === step.at
          return (
            <motion.div
              key={step.at}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.06 }}
              className={cn(
                'min-w-[7.5rem] shrink-0 snap-start rounded-2xl px-3 py-2.5 backdrop-blur-sm',
                step.reached ? 'bg-amber-300/25 ring-1 ring-amber-200/60' : isNext ? 'bg-white text-violet-900' : 'bg-white/10',
              )}
            >
              <p className={cn('text-[10px] font-bold uppercase tracking-wider', isNext ? 'text-violet-500' : 'text-white/70')}>
                {ordinal(step.at)} order
              </p>
              <p className="text-caption font-extrabold leading-tight">{step.label}</p>
              <p className={cn('mt-0.5 text-[10px]', isNext ? 'text-violet-500' : 'text-white/60')}>
                {step.reached ? 'Unlocked ✓' : isNext ? 'Up next' : 'Locked'}
              </p>
            </motion.div>
          )
        })}
      </div>

      {!guest && (
        <p className="relative mt-3 text-[11px] text-white/60">
          {loyalty.totalOrders === 1 ? '1 order here' : `${loyalty.totalOrders ?? 0} orders here`}
          {repeat && loyalty.round && loyalty.round > 1 ? ` · round ${loyalty.round}` : ''}
          {' · rewards arrive as scratch cards in your Wallet'}
        </p>
      )}
    </section>
  )
}
