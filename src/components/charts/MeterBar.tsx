import { motion, useReducedMotion } from 'framer-motion'

interface MeterBarProps {
  label: string
  /** Percentage 0–100. */
  value: number
  caption?: string
  /** Any CSS colour. Defaults to the brand primary. */
  color?: string
}

/**
 * Labelled horizontal meter for a single ratio (dataviz skill §choosing-a-form:
 * a bounded 0–100 proportion). The value is direct-labelled, so meaning never
 * rests on colour alone.
 */
export function MeterBar({ label, value, caption, color = 'var(--primary)' }: MeterBarProps) {
  const reduce = useReducedMotion()
  const pct = Math.min(100, Math.max(0, value))

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-caption font-medium text-foreground">{label}</span>
        <span className="text-caption font-semibold tabular-nums text-foreground">{pct}%</span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-surface-muted"
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      {caption && <p className="text-small text-text-muted">{caption}</p>}
    </div>
  )
}
