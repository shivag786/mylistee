import { Store, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatExpiry, formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { WonReward } from '@/features/businesses/publicTypes'

/** A single reward tile in the wallet (document/phase/07 §Wallet). Active
 * rewards surface the redemption code; spent/expired ones read as muted. */
export function RewardCard({ reward }: { reward: WonReward }) {
  const isActive = reward.status === 'active'
  const isRedeemed = reward.status === 'redeemed'

  return (
    <Card padding="none" className={cn('overflow-hidden', !isActive && 'opacity-80')}>
      <div className="flex gap-3 p-4">
        <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-muted text-text-secondary">
          {reward.business.logoUrl ? (
            <img src={reward.business.logoUrl} alt="" loading="lazy" className="size-full object-cover" />
          ) : (
            <Store className="size-5" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-body font-semibold text-foreground">
              {reward.rewardValue || reward.title}
            </p>
            <StatusBadge status={reward.status} />
          </div>
          <p className="truncate text-caption text-text-secondary">{reward.business.name}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-small text-text-muted">
            {isActive && reward.expiresAt && (
              <>
                <Clock className="size-3.5" aria-hidden /> Expires {formatExpiry(reward.expiresAt)}
              </>
            )}
            {isRedeemed && reward.redeemedAt && (
              <>
                <CheckCircle2 className="size-3.5" aria-hidden /> Redeemed {formatDate(reward.redeemedAt)}
              </>
            )}
            {reward.status === 'expired' && (
              <>
                <XCircle className="size-3.5" aria-hidden /> Expired
              </>
            )}
          </p>
        </div>
      </div>

      {isActive && (
        <div className="flex items-center justify-between border-t border-dashed border-border px-4 py-2.5">
          <span className="text-small text-text-muted">Redemption code</span>
          <span className="font-mono text-body font-bold tracking-[0.2em] text-foreground">{reward.code}</span>
        </div>
      )}
    </Card>
  )
}

function StatusBadge({ status }: { status: WonReward['status'] }) {
  if (status === 'active') return <Badge tone="success">Active</Badge>
  if (status === 'redeemed') return <Badge tone="neutral">Used</Badge>
  return <Badge tone="neutral">Expired</Badge>
}
