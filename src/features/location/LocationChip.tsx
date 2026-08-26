import { MapPin, Loader2, ChevronDown } from 'lucide-react'
import { useAppLocation } from './useAppLocation'
import { cn } from '@/utils/cn'

/**
 * Header location control. Shows where results are being drawn from and lets
 * the visitor refresh it.
 *
 * Nothing is requested on mount — the provider only refreshes silently when
 * permission was already granted. A browser will not re-prompt after a denial,
 * so an unprompted dialog on first load spends the single chance you get.
 */
export function LocationChip({ className }: { className?: string }) {
  const { status, label, request } = useAppLocation()

  const text =
    status === 'locating'
      ? 'Locating…'
      : status === 'ready'
        ? (label ?? 'Current location')
        : status === 'denied'
          ? 'Location off'
          : status === 'unavailable'
            ? 'Location unavailable'
            : 'Set location'

  return (
    <button
      type="button"
      onClick={request}
      // Denied is terminal until the visitor changes browser settings, so the
      // control stops inviting taps that cannot do anything.
      disabled={status === 'locating' || status === 'denied'}
      className={cn(
        'flex min-w-0 items-center gap-1 rounded-full px-2 py-1 text-left transition-colors hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-default disabled:hover:bg-transparent',
        className,
      )}
      aria-label={
        status === 'ready'
          ? `Showing shops near ${label ?? 'your current location'}. Tap to update.`
          : 'Set your location to see nearby shops'
      }
    >
      {status === 'locating' ? (
        <Loader2 className="size-4 shrink-0 animate-spin text-primary" aria-hidden />
      ) : (
        <MapPin
          className={cn('size-4 shrink-0', status === 'ready' ? 'text-primary' : 'text-text-muted')}
          aria-hidden
        />
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] leading-none text-text-muted">
          {status === 'ready' ? 'Shops near' : 'Location'}
        </span>
        <span className="block truncate text-small font-semibold leading-tight text-foreground">
          {text}
        </span>
      </span>
      {status !== 'locating' && status !== 'denied' && (
        <ChevronDown className="size-3.5 shrink-0 text-text-muted" aria-hidden />
      )}
    </button>
  )
}
