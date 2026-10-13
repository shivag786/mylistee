import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/utils/cn'

interface StarInputProps {
  /** 0 = nothing picked. */
  value: number
  onChange: (value: number) => void
  size?: 'sm' | 'lg'
  /** Tapping the picked star again clears it — for ratings that are optional. */
  clearable?: boolean
  /** Prefix for the buttons' accessible names, e.g. "Rate Masala Dosa". */
  label?: string
  className?: string
}

/** Tap-to-rate 1–5 stars. */
export function StarInput({ value, onChange, size = 'lg', clearable = false, label = 'Rate', className }: StarInputProps) {
  const [hover, setHover] = useState(0)
  return (
    <div className={cn('flex items-center', size === 'lg' ? 'gap-1.5' : 'gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(clearable && n === value ? 0 : n)}
          aria-label={`${label} ${n} star${n > 1 ? 's' : ''}`}
          aria-pressed={n === value}
          className={size === 'sm' ? 'p-1' : undefined}
        >
          <Star
            className={cn(
              'transition-colors',
              size === 'lg' ? 'size-9' : 'size-6',
              n <= (hover || value) ? 'fill-star text-star' : 'text-border-strong',
            )}
            aria-hidden
          />
        </button>
      ))}
    </div>
  )
}
