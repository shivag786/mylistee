import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'

interface StepperProps {
  steps: string[]
  /** Zero-based index of the active step. */
  current: number
}

/**
 * Horizontal progress indicator for multi-step flows (business registration
 * wizard, document/phase/07 §Registration Flow). Reduced-motion safe (CSS only).
 */
export function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="flex items-center" aria-label="Progress">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={label} className={cn('flex items-center', i < steps.length - 1 && 'flex-1')}>
            <div className="flex flex-col items-center gap-1">
              <span
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'grid size-8 place-items-center rounded-full text-caption font-semibold transition-colors duration-250',
                  done && 'bg-primary text-primary-foreground',
                  active && 'bg-primary/15 text-primary ring-2 ring-primary',
                  !done && !active && 'bg-surface-muted text-text-muted',
                )}
              >
                {done ? <Check className="size-4" aria-hidden /> : i + 1}
              </span>
              <span
                className={cn(
                  'hidden text-small sm:block',
                  active ? 'font-medium text-foreground' : 'text-text-muted',
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  'mx-2 h-0.5 flex-1 rounded-full transition-colors duration-250',
                  done ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
