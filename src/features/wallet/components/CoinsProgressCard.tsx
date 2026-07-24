import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Coins, ChevronRight } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Card } from '@/components/ui/card'
import { useCoinSummary, useBusinessLoyalty } from '../hooks/useCoins'

/**
 * Home nudge: turns the coin balance into a goal — "You're N coins from {reward}
 * at {shop}". Picks the shop where the customer has the most coins, then its
 * cheapest reward tier. Renders nothing until there's a real, reachable reward.
 */
export function CoinsProgressCard() {
  const { data: summary } = useCoinSummary()

  const topShop = useMemo(() => {
    const shops = (summary?.businesses ?? []).filter((b) => b.balance > 0)
    return shops.sort((a, b) => b.balance - a.balance)[0] ?? null
  }, [summary])

  const { data: loyalty } = useBusinessLoyalty(topShop?.slug ?? '', Boolean(topShop))

  if (!topShop || !loyalty?.enabled) return null

  const balance = loyalty.businessBalance || topShop.balance
  const tiers = loyalty.rewards
    .filter((r) => r.active)
    .sort((a, b) => a.coinsCost - b.coinsCost)
  if (tiers.length === 0) return null

  // The next tier the customer hasn't reached; if they can afford the top tier,
  // celebrate that instead.
  const nextTier = tiers.find((t) => t.coinsCost > balance)
  const target = nextTier ?? tiers[tiers.length - 1]
  const reached = !nextTier
  const remaining = Math.max(0, target.coinsCost - balance)
  const pct = Math.min(100, Math.round((balance / target.coinsCost) * 100))

  return (
    <Card
      padding="md"
      className="relative overflow-hidden bg-gradient-to-br from-premium/10 to-primary/10"
      interactive
    >
      <Link to={ROUTES.businessProfile(topShop.slug)} className="absolute inset-0" aria-label="View shop rewards" />
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-premium/20 text-premium">
          <Coins className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-caption font-semibold text-foreground">
            {reached ? (
              <>You can redeem <span className="text-premium">{target.title}</span> at {topShop.businessName}!</>
            ) : (
              <>
                <span className="text-premium">{remaining} coins</span> to {target.title} at{' '}
                {topShop.businessName}
              </>
            )}
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
            <div className="h-full rounded-full bg-premium transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-small text-text-muted">
            {balance} / {target.coinsCost} coins
          </p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-text-muted" aria-hidden />
      </div>
    </Card>
  )
}
