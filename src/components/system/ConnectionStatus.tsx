import { Wifi, WifiOff, Loader2 } from 'lucide-react'
import { useHealthCheck } from '@/features/system/hooks/useHealthCheck'
import { cn } from '@/utils/cn'

/**
 * Dev-only chip showing whether the frontend can reach the Laravel API.
 * Renders nothing in production builds. Proves the Milestone 1 handshake.
 */
export function ConnectionStatus() {
  const { data, isLoading, isError } = useHealthCheck()

  if (!import.meta.env.DEV) return null

  const state = isLoading ? 'checking' : isError ? 'offline' : 'online'

  const styles = {
    checking: 'bg-surface-muted text-text-secondary',
    online: 'bg-success-soft text-success',
    offline: 'bg-danger-soft text-danger',
  } as const

  const label = {
    checking: 'Connecting…',
    online: `API online · ${data?.database === 'ok' ? 'DB ok' : 'DB down'}`,
    offline: 'API offline',
  } as const

  return (
    <div
      className={cn(
        'fixed bottom-20 right-3 z-50 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-small font-medium shadow-soft',
        styles[state],
      )}
      role="status"
    >
      {state === 'checking' ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : state === 'online' ? (
        <Wifi className="size-3.5" aria-hidden />
      ) : (
        <WifiOff className="size-3.5" aria-hidden />
      )}
      {label[state]}
    </div>
  )
}
