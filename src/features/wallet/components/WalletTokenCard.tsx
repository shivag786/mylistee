import { Ticket, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useWalletToken, formatCountdown } from '../hooks/useWalletToken'

/**
 * Wallet-token card for the wallet page (Phase 7.3). Big, readable token the
 * customer shows at the counter, with a live countdown and a refresh action.
 */
export function WalletTokenCard() {
  const { token, remaining, isLoading, refresh } = useWalletToken(true)

  return (
    <Card className="bg-gradient-to-br from-primary-soft to-gold-soft" padding="lg">
      <div className="flex items-center gap-2 text-caption font-medium text-text-secondary">
        <Ticket className="size-4 text-primary" aria-hidden />
        Your counter token
      </div>

      <div className="mt-2 flex items-end justify-between gap-3">
        <span className="font-mono text-4xl font-bold tracking-widest text-foreground">
          {isLoading ? '·····' : (token?.token ?? '·····')}
        </span>
        <span className="rounded-full bg-surface/80 px-3 py-1 font-mono text-body font-semibold text-primary">
          {formatCountdown(remaining)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-small text-text-secondary">
          Show this at the counter to redeem wallet coins. It refreshes automatically.
        </p>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<RefreshCw className="size-4" />}
          onClick={() => refresh.mutate()}
          isLoading={refresh.isPending}
        >
          New
        </Button>
      </div>
    </Card>
  )
}
