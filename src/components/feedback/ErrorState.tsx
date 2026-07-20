import { Compass, ServerCrash, WifiOff, ShieldAlert, RotateCw, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

type ErrorVariant = 'notFound' | 'serverError' | 'offline' | 'permission'

interface ErrorStateProps {
  variant?: ErrorVariant
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

const presets: Record<ErrorVariant, { icon: LucideIcon; title: string; description: string }> = {
  notFound: {
    icon: Compass,
    title: "We couldn't find that",
    description: "The page you're looking for doesn't exist or has moved.",
  },
  serverError: {
    icon: ServerCrash,
    title: 'Something went wrong',
    description: "That's on us. Please try again in a moment.",
  },
  offline: {
    icon: WifiOff,
    title: "You're offline",
    description: 'Check your connection and try again.',
  },
  permission: {
    icon: ShieldAlert,
    title: 'Access denied',
    description: "You don't have permission to view this.",
  },
}

/**
 * Friendly error screen — never exposes technical detail (document/phase/05
 * §Error States). Use for 404 / 500 / offline / permission cases.
 */
export function ErrorState({
  variant = 'serverError',
  title,
  description,
  onRetry,
  retryLabel = 'Try again',
  className,
}: ErrorStateProps) {
  const preset = presets[variant]
  const Icon = preset.icon

  return (
    <div
      className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}
    >
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-destructive-soft text-destructive">
        <Icon className="size-7" aria-hidden />
      </div>
      <h3 className="text-subtitle font-semibold text-foreground">{title ?? preset.title}</h3>
      <p className="mt-2 max-w-xs text-body text-text-secondary">
        {description ?? preset.description}
      </p>
      {onRetry && (
        <Button size="md" className="mt-6" leftIcon={<RotateCw className="size-4" />} onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
