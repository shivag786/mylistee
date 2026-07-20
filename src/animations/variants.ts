import type { Variants } from 'framer-motion'
import { durations, easings } from './transitions'

/**
 * Shared Framer Motion variants. Reuse these everywhere instead of re-declaring
 * animation objects (document/phase/08 §AI Rules — "reuse animation variants").
 * All motion should be gated by reduced-motion at the call site.
 */

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: durations.normal, ease: easings.out } },
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: durations.medium, ease: easings.out } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: durations.normal, ease: easings.out } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: durations.fast } },
}

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: { duration: durations.normal, ease: easings.out } },
  exit: { opacity: 0, y: -16, transition: { duration: durations.fast } },
}

/** Parent that reveals its children one after another. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: durations.medium, ease: easings.out } },
}

/** Route-level transition (fade + slight slide). */
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: durations.normal, ease: easings.out } },
  exit: { opacity: 0, y: -8, transition: { duration: durations.fast } },
}

/** Small interaction gestures. */
export const tapScale = { scale: 0.97 }
export const hoverLift = { y: -2 }
export const heartPop: Variants = {
  idle: { scale: 1 },
  active: { scale: [1, 1.3, 1], transition: { duration: durations.normal } },
}
