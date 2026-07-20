import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/utils/cn'

interface MetricCardProps {
  label: string
  value: number
  icon: LucideIcon
  /** Note shown under the value, e.g. "Available soon". */
  hint?: string
  /** Muted styling for metrics whose data source ships in a later milestone. */
  muted?: boolean
}

/**
 * Headline metric tile (document/phase/07 §Dashboard Widgets). Reusable across
 * the owner dashboard and, later, the admin panel. Animates the value up.
 */
export function MetricCard({ label, value, icon: Icon, hint, muted }: MetricCardProps) {
  const display = useCountUp(value)

  return (
    <Card className="flex flex-col gap-2" elevation="soft" padding="md">
      <div className="flex items-center justify-between">
        <span className="text-caption text-text-secondary">{label}</span>
        <span
          className={cn(
            'grid size-8 place-items-center rounded-full',
            muted ? 'bg-surface-muted text-text-muted' : 'bg-primary-soft text-primary',
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <span className={cn('text-title font-bold', muted ? 'text-text-secondary' : 'text-foreground')}>
        {display}
      </span>
      {hint && <span className="text-small text-text-muted">{hint}</span>}
    </Card>
  )
}
