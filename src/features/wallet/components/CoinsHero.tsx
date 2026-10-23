import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'
import { Confetti } from '@/components/motion/Confetti'
import { ROUTES } from '@/constants/routes'
import { storage } from '@/utils/storage'
import type { CoinSummary } from '../services/coinsService'
import { coinsToRupees, formatRupees, useCoinValue } from '../coinMoney'
import { ListeeCoin } from './ListeeCoin'

const LAST_SEEN_KEY = 'listee.walletLastSeen'

/**
 * The wallet card: the balance as money ("₹120") in lime on midnight — the one
 * place the brand is loudest — with the coin count as the detail and where it
 * can be spent. If the balance grew since the last visit, it celebrates and
 * says by how much.
 */
export function CoinsHero({ summary }: { summary: CoinSummary }) {
  const reduce = useReducedMotion()
  const coinValue = useCoinValue()
  const rupees = coinsToRupees(summary.total, coinValue)
  const shown = useCountUp(rupees, 900)
  const top = summary.businesses.slice(0, 3)

  // "+₹20 since your last visit" — read once, then remember today's balance.
  const [gain] = useState(() => {
    const last = Number(storage.get(LAST_SEEN_KEY) ?? 'NaN')
    return Number.isFinite(last) && summary.total > last ? summary.total - last : 0
  })
  useEffect(() => {
    storage.set(LAST_SEEN_KEY, String(summary.total))
  }, [summary.total])

  return (
    <>
      {gain > 0 && <Confetti count={80} />}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-cover bg-gradient-to-br from-[var(--wallet-from)] to-[var(--wallet-to)] p-5 text-white shadow-floating"
      >
        {/* lime glow behind the coin */}
        <div className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-gold/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 size-40 rounded-full bg-white/10 blur-2xl" />

        <div className="relative space-y-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wider text-white/75">
              <Sparkles className="size-4 text-gold" aria-hidden /> Listee wallet
            </span>
            {gain > 0 && (
              <motion.span
                initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.3 }}
                className="rounded-full bg-gold px-2.5 py-1 text-small font-bold text-gold-foreground"
              >
                +{formatRupees(coinsToRupees(gain, coinValue))} new
              </motion.span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <motion.span
              animate={reduce ? undefined : { rotateY: [0, 360] }}
              transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
            >
              <ListeeCoin size={60} shine />
            </motion.span>
            <div className="min-w-0">
              <p className="font-heading text-[2.75rem] font-extrabold leading-none tracking-tight text-gold tabular-nums">
                {formatRupees(Math.round(shown))}
              </p>
              <p className="mt-1 text-caption text-white/75">
                {summary.total.toLocaleString('en-IN')} Listee coins · 1 coin = {formatRupees(coinValue)}
              </p>
            </div>
          </div>

          {top.length > 0 ? (
            <div className="space-y-2">
              <p className="text-small text-white/70">Spend it at</p>
              <div className="flex flex-wrap gap-2">
                {top.map((b) => (
                  <Link
                    key={b.businessId}
                    to={ROUTES.businessProfile(b.slug)}
                    className="flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-caption ring-1 ring-white/15 transition-colors hover:bg-white/20"
                  >
                    <span className="max-w-[8rem] truncate font-medium">{b.businessName}</span>
                    <span className="font-bold text-gold tabular-nums">{formatRupees(coinsToRupees(b.balance, coinValue))}</span>
                    <ArrowUpRight className="size-3.5 opacity-70" aria-hidden />
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-caption text-white/75">Scan a shop's QR, spin and order to fill your wallet.</p>
          )}
        </div>
      </motion.div>
    </>
  )
}
