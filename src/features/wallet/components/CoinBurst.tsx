import { Component, lazy, Suspense, useEffect, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import coinAnimation from '../lottie/coin.json'

// Lazy so the ~250KB lottie player only loads when a burst actually renders,
// never in the main bundle.
const Lottie = lazy(() => import('lottie-react'))

interface CoinBurstProps {
  /** When true, the burst plays. */
  show: boolean
  /** Pixel size of the central coin. */
  size?: number
  /** Fired ~when the animation finishes. */
  onDone?: () => void
}

const PARTICLES = 10

/**
 * Guards the (decorative) Lottie so a failure — a malformed animation, a
 * lottie-web runtime throw, or a lazy-chunk load error — can never crash the
 * spin reward popup. Falls back to a static coin.
 */
class LottieBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/**
 * Celebratory coin burst — a Lottie coin pop surrounded by Framer-Motion coins
 * radiating outward. Purely decorative (aria-hidden) and reduced-motion aware:
 * when motion is reduced (or the Lottie fails) it shows a single static coin.
 */
export function CoinBurst({ show, size = 120, onDone }: CoinBurstProps) {
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!show || !onDone) return
    const t = setTimeout(onDone, reduce ? 400 : 1200)
    return () => clearTimeout(t)
  }, [show, onDone, reduce])

  if (!show) return null

  // Animated gold-coin fallback (also used for reduced motion / if the Lottie
  // can't play) — a scale-pop so the celebration always looks intentional.
  const staticCoin = (
    <motion.div
      initial={reduce ? false : { scale: 0, rotate: -25 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 12 }}
      className="grid size-full place-items-center rounded-full border-4 border-premium-foreground/30 bg-gradient-to-br from-premium to-primary shadow-lg"
    >
      <span className="text-2xl font-black text-white/90">₹</span>
    </motion.div>
  )

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 grid place-items-center overflow-visible"
    >
      {!reduce &&
        Array.from({ length: PARTICLES }).map((_, i) => {
          const angle = (i / PARTICLES) * Math.PI * 2
          const distance = 70 + (i % 3) * 22
          return (
            <motion.span
              key={i}
              className="absolute block size-3 rounded-full bg-premium shadow-[0_0_8px_rgba(251,191,36,0.7)]"
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
              animate={{
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                opacity: [0, 1, 0],
                scale: [0.4, 1, 0.6],
              }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.05 + (i % 4) * 0.04 }}
            />
          )
        })}

      <div style={{ width: size, height: size }}>
        {reduce ? (
          staticCoin
        ) : (
          <LottieBoundary fallback={staticCoin}>
            <Suspense fallback={<div className="size-full rounded-full bg-premium/70" />}>
              <Lottie animationData={coinAnimation} loop={false} autoplay />
            </Suspense>
          </LottieBoundary>
        )}
      </div>
    </div>
  )
}
