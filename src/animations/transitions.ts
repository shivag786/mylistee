/**
 * Motion timing primitives (seconds — Framer Motion uses seconds).
 * Mirrors the CSS duration/easing tokens (document/phase/08 §Animation Timing).
 */

export const durations = {
  fast: 0.15,
  normal: 0.25,
  medium: 0.35,
  slow: 0.5,
  celebration: 0.8,
} as const

export const easings = {
  standard: [0.4, 0, 0.2, 1],
  out: [0, 0, 0.2, 1],
  in: [0.4, 0, 1, 1],
  spring: [0.34, 1.56, 0.64, 1],
} as const

/** Reusable spring for tactile, natural motion. */
export const spring = { type: 'spring', stiffness: 400, damping: 30 } as const
