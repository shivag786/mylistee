import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

/**
 * Animates a number from its previous value up to `target`. Used for wallet
 * balances and dashboard metrics (document/phase/08 §Dashboard "count up").
 * Respects reduced-motion by snapping instantly.
 */
export function useCountUp(target: number, durationMs = 800): number {
  const reduce = useReducedMotion()
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)
  const frameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const from = fromRef.current
    if (reduce || from === target) {
      setValue(target)
      fromRef.current = target
      return
    }

    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(from + (target - from) * eased))
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }
    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [target, durationMs, reduce])

  return value
}
