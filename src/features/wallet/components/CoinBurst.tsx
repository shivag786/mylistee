import { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ListeeCoin } from './ListeeCoin'

interface CoinBurstProps {
  /** When true, the burst plays. */
  show: boolean
  /** Pixel size of the central coin. */
  size?: number
  /** Fired ~when the animation finishes. */
  onDone?: () => void
}

const COINS = 10
const SPARKS = 8

/**
 * The "money just landed" moment: the Listee Coin pops in, a ring shock-wave
 * goes out, small coins fly off and sparks twinkle. Decorative (aria-hidden);
 * with reduced motion it is just the coin.
 */
export function CoinBurst({ show, size = 120, onDone }: CoinBurstProps) {
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!show || !onDone) return
    const t = setTimeout(onDone, reduce ? 400 : 1300)
    return () => clearTimeout(t)
  }, [show, onDone, reduce])

  if (!show) return null

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10 grid place-items-center overflow-visible">
      {!reduce && (
        <>
          {/* shock-wave ring */}
          <motion.span
            className="absolute rounded-full border-4 border-gold"
            style={{ width: size, height: size }}
            initial={{ scale: 0.6, opacity: 0.9 }}
            animate={{ scale: 2.1, opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
          {/* flying mini coins */}
          {Array.from({ length: COINS }).map((_, i) => {
            const angle = (i / COINS) * Math.PI * 2 + 0.3
            const distance = size * 0.62 + (i % 3) * 18
            return (
              <motion.span
                key={`c${i}`}
                className="absolute"
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.3, rotate: 0 }}
                animate={{
                  x: Math.cos(angle) * distance,
                  y: Math.sin(angle) * distance,
                  opacity: [0, 1, 1, 0],
                  scale: [0.3, 1, 0.9, 0.6],
                  rotate: (i % 2 ? 1 : -1) * 220,
                }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.08 + (i % 4) * 0.04 }}
              >
                <ListeeCoin size={14 + (i % 3) * 4} />
              </motion.span>
            )
          })}
          {/* sparks */}
          {Array.from({ length: SPARKS }).map((_, i) => {
            const angle = (i / SPARKS) * Math.PI * 2
            return (
              <motion.span
                key={`s${i}`}
                className="absolute block size-1.5 rounded-full bg-gold shadow-[0_0_10px_3px_rgba(163,230,53,0.7)]"
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{ x: Math.cos(angle) * size * 0.9, y: Math.sin(angle) * size * 0.9, opacity: [0, 1, 0] }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
              />
            )
          })}
        </>
      )}

      <motion.div
        initial={reduce ? false : { scale: 0, rotate: -30 }}
        animate={{ scale: [0, 1.15, 1], rotate: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      >
        <ListeeCoin size={size * 0.62} shine />
      </motion.div>
    </div>
  )
}
