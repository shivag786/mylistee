import { useState } from 'react'
import { CheckCircle2, Gift, Search, Ticket, User } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/feedback/Spinner'
import { formatDate, formatExpiry } from '@/utils/format'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { useVerifyReward, useRedeemReward, useRedemptionHistory } from '@/features/owner/hooks/useRedemption'
import type { RedemptionReward } from '@/features/owner/services/redemptionService'

export function RedeemPage() {
  const [code, setCode] = useState('')
  const [verified, setVerified] = useState<RedemptionReward | null>(null)
  const [error, setError] = useState<string | null>(null)

  const verify = useVerifyReward()
  const redeem = useRedeemReward()
  const { data: history } = useRedemptionHistory()

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setVerified(null)
    try {
      setVerified(await verify.mutateAsync(code.trim()))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not verify that code.')
    }
  }

  async function handleRedeem() {
    if (!verified) return
    try {
      await redeem.mutateAsync(verified.code)
      toast.success(`Redeemed: ${verified.rewardValue || verified.title}`)
      setVerified(null)
      setCode('')
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not redeem that reward.'
      setError(message)
      setVerified(null)
      toast.error(message)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-title font-bold text-foreground">Redeem a reward</h1>
        <p className="text-caption text-text-secondary">Enter the code from the customer's wallet.</p>
      </div>

      <Card className="space-y-4">
        <form onSubmit={handleVerify} className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reward-code">Reward code</Label>
            <Input
              id="reward-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. FDY49YGL"
              autoComplete="off"
              autoCapitalize="characters"
              className="font-mono tracking-[0.2em]"
              maxLength={16}
            />
          </div>
          <Button
            type="submit"
            fullWidth
            isLoading={verify.isPending}
            disabled={code.trim().length < 4}
            leftIcon={<Search className="size-4" />}
          >
            Verify code
          </Button>
        </form>

        {error && <p className="text-center text-caption text-destructive">{error}</p>}

        {verified && (
          <div className="space-y-3 rounded-2xl border border-success/40 bg-success-soft/50 p-4">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="size-5" aria-hidden />
              <span className="text-body font-semibold">Valid reward</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-premium-soft text-premium-foreground">
                <Gift className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-body font-semibold text-foreground">
                  {verified.rewardValue || verified.title}
                </p>
                <p className="inline-flex items-center gap-1 text-caption text-text-secondary">
                  <User className="size-3.5" aria-hidden /> {verified.customerName ?? 'Customer'}
                  {verified.expiresAt ? ` · expires ${formatExpiry(verified.expiresAt)}` : ''}
                </p>
              </div>
            </div>
            <Button
              fullWidth
              variant="success"
              isLoading={redeem.isPending}
              leftIcon={<CheckCircle2 className="size-5" />}
              onClick={() => void handleRedeem()}
            >
              Confirm redemption
            </Button>
          </div>
        )}
      </Card>

      <section className="space-y-2">
        <h2 className="text-body-lg font-semibold text-foreground">Recent redemptions</h2>
        {history === undefined ? (
          <div className="flex justify-center py-6">
            <Spinner size={24} />
          </div>
        ) : history.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 py-8 text-center">
            <Ticket className="size-7 text-text-muted" aria-hidden />
            <p className="text-caption text-text-secondary">No redemptions yet.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {history.map((r) => (
              <Card key={r.id} className="flex items-center justify-between" padding="md">
                <div className="min-w-0">
                  <p className="truncate text-body font-medium text-foreground">
                    {r.rewardValue || r.title}
                  </p>
                  <p className="truncate text-caption text-text-secondary">{r.customerName ?? 'Customer'}</p>
                </div>
                <span className="shrink-0 text-small text-text-muted">
                  {r.redeemedAt ? formatDate(r.redeemedAt) : ''}
                </span>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
