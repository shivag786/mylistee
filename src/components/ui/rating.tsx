import { Star } from 'lucide-react'
import { cn } from '@/utils/cn'

interface RatingProps {
  value: number
  max?: number
  /** Optional review count shown after the stars. */
  count?: number
  size?: 'sm' | 'md'
  showValue?: boolean
  className?: string
}

/**
 * Read-only star rating (document/phase/16 §Business Card). Gold stars with a
 * partial fill for fractional values. Accessible via aria-label.
 */
export function Rating({
  value,
  max = 5,
  count,
  size = 'sm',
  showValue = true,
  className,
}: RatingProps) {
  const starSize = size === 'sm' ? 'size-4' : 'size-5'
  const clamped = Math.max(0, Math.min(value, max))

  return (
    <span
      className={cn('inline-flex items-center gap-1', className)}
      role="img"
      aria-label={`Rated ${clamped.toFixed(1)} out of ${max}`}
    >
      <span className="relative inline-flex" aria-hidden>
        {Array.from({ length: max }).map((_, i) => (
          <Star key={i} className={cn(starSize, 'text-border')} />
        ))}
        <span
          className="absolute inset-0 inline-flex overflow-hidden"
          style={{ width: `${(clamped / max) * 100}%` }}
        >
          {Array.from({ length: max }).map((_, i) => (
            <Star key={i} className={cn(starSize, 'shrink-0 fill-gold text-gold')} />
          ))}
        </span>
      </span>
      {showValue && (
        <span className="text-caption font-medium text-foreground">{clamped.toFixed(1)}</span>
      )}
      {typeof count === 'number' && (
        <span className="text-caption text-text-secondary">({count})</span>
      )}
    </span>
  )
}
