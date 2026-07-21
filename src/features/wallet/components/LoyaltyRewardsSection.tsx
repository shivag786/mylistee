import { useState } from 'react'
import { Coins, Gift, Lock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import { RewardModal } from '@/features/spinner/components/RewardModal'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { useBusinessLoyalty, useRedeemTier } from '../hooks/useCoins'
import type { LoyaltyTier } from '../services/coinsService'
import type { WonReward } from '@/features/businesses/publicTypes'

/**
 * "Spend your Listee Coins" — the reward tiers a customer can redeem at a
 * business, with their live coin balance. Redeeming mints a reward code shown
 * in a celebratory modal (reusing the spin RewardModal). Only rendered for
 * signed-in customers (the endpoint is auth-only).
 */
export function LoyaltyRewardsSection({ slug }: { slug: string }) {
  const { data, isLoading } = useBusinessLoyalty(slug)
  const redeem = useRedeemTier(slug)
  const [confirming, setConfirming] = useState<LoyaltyTier | null>(null)
  const [redeemed, setRedeemed] = useState<WonReward | null>(null)

  // Hide entirely when loyalty is off or there are no tiers to show.
  if (isLoading || !data || !data.enabled || data.rewards.length === 0) {
    return null
  }

  const balance = data.coinBalance

  async function confirmRedeem() {
    if (!confirming) return
    try {
      const result = await redeem.mutateAsync(confirming.id)
      setRedeemed(result.reward)
      toast.success('Redeemed! Show the code to the shop.')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not redeem this reward.')
    } finally {
      setConfirming(null)
    }
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-body-lg font-semibold text-foreground">
          <Coins className="size-5 text-premium" aria-hidden /> Spend your coins
        </h2>
        <Badge tone="premium" className="gap-1">
          <Coins className="size-3.5" aria-hidden />
          {balance}
        </Badge>
      </div>

      <Stagger className="space-y-2">
        {data.rewards.map((tier) => {
          const affordable = balance >= tier.coinsCost && tier.available
          return (
            <StaggerItem key={tier.id}>
              <Card className="flex items-center gap-3" padding="md">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-premium/15 text-premium">
                  <Gift className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-medium text-foreground">{tier.title}</p>
                  <p className="text-caption text-text-secondary">
                    {tier.rewardValue ?? tier.description ?? 'Reward'}
                    {tier.stock != null ? ` · ${tier.stock} left` : ''}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={affordable ? 'primary' : 'outline'}
                  disabled={!affordable}
                  leftIcon={affordable ? <Coins className="size-4" /> : <Lock className="size-4" />}
                  onClick={() => setConfirming(tier)}
                >
                  {tier.coinsCost}
                </Button>
              </Card>
            </StaggerItem>
          )
        })}
      </Stagger>

      <ConfirmationDialog
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={confirming ? `Redeem ${confirming.title}?` : 'Redeem reward?'}
        description={
          confirming
            ? `This spends ${confirming.coinsCost} coins and gives you a code to show at the shop.`
            : ''
        }
        confirmLabel="Redeem"
        isLoading={redeem.isPending}
        onConfirm={() => void confirmRedeem()}
      />

      <RewardModal reward={redeemed} onClose={() => setRedeemed(null)} />
    </section>
  )
}
