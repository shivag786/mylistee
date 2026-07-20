import { motion, useReducedMotion } from 'framer-motion'

export interface BarListItem {
  label: string
  value: number
  /** Optional secondary text shown under the label (e.g. "60% redeemed"). */
  sublabel?: string
}

interface BarListProps {
  items: BarListItem[]
  color?: string
  formatValue?: (n: number) => string
}

/**
 * Ranked horizontal bar list — magnitude comparison across a handful of named
 * rows (dataviz skill §choosing-a-form). Bars share one hue (identity is the
 * row label, not colour); each bar is direct-labelled with its value.
 */
export function BarList({ items, color = 'var(--chart-1)', formatValue = String }: BarListProps) {
  const reduce = useReducedMotion()
  const max = Math.max(1, ...items.map((i) => i.value))

  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={`${item.label}-${i}`} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-caption font-medium text-foreground">{item.label}</span>
            <span className="shrink-0 text-caption font-semibold tabular-nums text-foreground">
              {formatValue(item.value)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              initial={reduce ? false : { width: 0 }}
              animate={{ width: `${(item.value / max) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.04 }}
            />
          </div>
          {item.sublabel && <p className="text-small text-text-muted">{item.sublabel}</p>}
        </li>
      ))}
    </ul>
  )
}
