import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

/** SPEC-011 §loading animation — the four progress lines shown while importing. */
const STEPS = ['Checking URL…', 'Finding Business…', 'Collecting Details…', 'Preparing Preview…'] as const

interface ImportLoadingStepsProps {
  /** When true, the request has resolved — mark every step complete. */
  done?: boolean
}

/**
 * A calm, premium four-step loader (document/phase/08 §Motion). Steps advance on
 * a timer for perceived progress; when the request resolves they all complete.
 */
export function ImportLoadingSteps({ done = false }: ImportLoadingStepsProps) {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (done) return
    const id = setInterval(() => setActive((i) => Math.min(i + 1, STEPS.length - 1)), 700)
    return () => clearInterval(id)
  }, [done])

  return (
    <ul className="mx-auto max-w-sm space-y-4" aria-live="polite">
      {STEPS.map((label, i) => {
        const complete = done || i < active
        const current = !done && i === active
        return (
          <motion.li
            key={label}
            initial={reduce ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: complete || current ? 1 : 0.4, x: 0 }}
            transition={{ duration: 0.3, delay: reduce ? 0 : i * 0.05 }}
            className="flex items-center gap-3"
          >
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors',
                complete
                  ? 'border-success bg-success text-success-foreground'
                  : current
                    ? 'border-primary text-primary'
                    : 'border-border text-text-muted',
              )}
            >
              {complete ? (
                <Check className="size-4" aria-hidden />
              ) : current ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <span className="size-1.5 rounded-full bg-current" aria-hidden />
              )}
            </span>
            <span
              className={cn(
                'text-body font-medium',
                complete || current ? 'text-foreground' : 'text-text-muted',
              )}
            >
              {label}
            </span>
          </motion.li>
        )
      })}
    </ul>
  )
}
