import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

interface SpinnerProps {
  size?: number
  className?: string
  label?: string
}

/** Generic loading indicator (document/phase/05 §Loading States). */
export function Spinner({ size = 24, className, label = 'Loading' }: SpinnerProps) {
  return (
    <span role="status" aria-live="polite" className={cn('inline-flex', className)}>
      <Loader2
        className="animate-spin text-primary"
        style={{ width: size, height: size }}
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}
