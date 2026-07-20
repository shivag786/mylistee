import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

/**
 * Every empty screen must guide the user forward (document/phase/06 §Empty
 * States): illustration/icon + friendly message + one primary action.
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}
    >
      {icon && (
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary">
          {icon}
        </div>
      )}
      <h3 className="text-subtitle font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-2 max-w-xs text-body text-text-secondary">{description}</p>}
      {actionLabel && onAction && (
        <Button size="md" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
