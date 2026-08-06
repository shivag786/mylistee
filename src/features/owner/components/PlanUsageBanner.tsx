import { useNavigate } from 'react-router-dom'
import { Sparkles, Infinity as InfinityIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import { useSubscription } from '../hooks/useOwner'
import type { SubscriptionState } from '../types'

type Metric = keyof SubscriptionState['usage']

const NOUN: Record<Metric, string> = {
  activeOffers: 'spin rewards',
  activeCombos: 'combos',
  activePromotions: 'promotions',
  qrCodes: 'QR codes',
  galleryImages: 'gallery images',
}

/**
 * Compact plan-quota strip for a feature page: shows "used / max" against the
 * owner's current plan and an Upgrade shortcut. Limits are data (backend is the
 * source of truth) — this only displays them. A null limit ⇒ unlimited.
 */
export function PlanUsageBanner({ metric, className }: { metric: Metric; className?: string }) {
  const navigate = useNavigate()
  const { data } = useSubscription()
  if (!data) return null

  const { used, limit } = data.usage[metric]
  const planName = data.plan?.name ?? 'Free'
  const noun = NOUN[metric]
  const unlimited = limit === null
  const atLimit = !unlimited && used >= limit
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100))

  return (
    <Card padding="sm" className={cn('flex flex-wrap items-center gap-x-4 gap-y-2', className)}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-caption font-medium capitalize text-foreground">{noun}</span>
          <span
            className={cn(
              'inline-flex items-center gap-1 text-caption font-semibold tabular-nums',
              atLimit ? 'text-destructive' : 'text-text-secondary',
            )}
          >
            {unlimited ? (
              <>
                {used} <span className="text-text-muted">·</span>
                <InfinityIcon className="size-3.5" aria-hidden /> unlimited
              </>
            ) : (
              `${used} of ${limit} used`
            )}
          </span>
        </div>

        {!unlimited && (
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className={cn('h-full rounded-full transition-all', atLimit ? 'bg-destructive' : 'bg-primary')}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}

        <p className="mt-1 text-small text-text-muted">
          {unlimited
            ? `${planName} plan`
            : atLimit
              ? `${planName} plan limit reached — turn one off, or upgrade for more.`
              : `On the ${planName} plan`}
        </p>
      </div>

      {!unlimited && (
        <Button
          size="sm"
          variant={atLimit ? 'primary' : 'outline'}
          leftIcon={<Sparkles className="size-4" />}
          onClick={() => navigate(ROUTES.owner.subscription)}
        >
          Upgrade
        </Button>
      )}
    </Card>
  )
}
