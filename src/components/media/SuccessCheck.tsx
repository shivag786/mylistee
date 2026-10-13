import { Component, lazy, Suspense, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'
import successAnimation from './lottie/success-check.json'

// Lazy so the lottie player only loads when a success screen actually renders.
const Lottie = lazy(() => import('lottie-react'))

/** A Lottie failure (bad JSON, chunk load error) must never break the screen. */
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
 * Green disc that pops in, a ring that ripples out, then a tick that draws
 * itself (Lottie). Static tick for reduced motion or if the Lottie can't play.
 */
export function SuccessCheck({ size = 120 }: { size?: number }) {
  const reduce = useReducedMotion()

  const fallback = (
    <motion.div
      initial={reduce ? false : { scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 14 }}
      className="grid size-full place-items-center rounded-full bg-success text-white"
    >
      <Check className="size-1/2" strokeWidth={3} />
    </motion.div>
  )

  return (
    <div style={{ width: size, height: size }} aria-hidden>
      {reduce ? (
        fallback
      ) : (
        <LottieBoundary fallback={fallback}>
          <Suspense fallback={<div className="size-full" />}>
            <Lottie animationData={successAnimation} loop={false} autoplay />
          </Suspense>
        </LottieBoundary>
      )}
    </div>
  )
}
