import { motion, useReducedMotion } from 'framer-motion'
import { Coins, Sparkles } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'
import type { CoinSummary } from '../services/coinsService'

/**
 * The wallet's centrepiece: a gamified Listee Coins balance with an animated
 * count-up and a per-shop breakdown. Reduced-motion aware (count-up snaps).
 */
export function CoinsHero({ summary }: { summary: CoinSummary }) {
  const reduce = useReducedMotion()
  const value = useCountUp(summary.total, 900)
  const top = summary.businesses.slice(0, 3)

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-cover bg-gradient-to-br from-premium via-premium to-primary p-5 text-white shadow-floating"
    >
      {/* Soft glow accents */}
      <div className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-white/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-6 size-32 rounded-full bg-white/10 blur-2xl" />

      <div className="relative">
        <div className="flex items-center gap-1.5 text-white/90">
          <Sparkles className="size-4" aria-hidden />
          <span className="text-caption font-medium uppercase tracking-wide">Listee Coins</span>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <motion.span
            aria-hidden
            animate={reduce ? undefined : { rotate: [0, -8, 8, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
            className="grid size-14 place-items-center rounded-2xl bg-white/25 backdrop-blur"
          >
            <Coins className="size-8" />
          </motion.span>
          <div>
            <p className="text-[2.5rem] font-extrabold leading-none tabular-nums">
              {value.toLocaleString()}
            </p>
            <p className="text-caption text-white/80">coins to spend</p>
          </div>
        </div>

        {top.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {top.map((b) => (
              <span
                key={b.businessId}
                className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-caption backdrop-blur"
              >
                <span className="max-w-[8rem] truncate font-medium">{b.businessName}</span>
                <span className="font-bold tabular-nums">{b.balance}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
