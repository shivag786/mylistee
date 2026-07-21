import { useEffect, useState } from 'react'
import { Coins, Plus, Pencil, Trash2, Gift, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { TextField } from '@/components/forms/TextField'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import {
  useLoyalty,
  useUpdateLoyaltyProgram,
  useCreateLoyaltyReward,
  useUpdateLoyaltyReward,
  useDeleteLoyaltyReward,
} from '@/features/owner/hooks/useLoyalty'
import type {
  LoyaltyProgram,
  LoyaltyReward,
  LoyaltyRewardInput,
} from '@/features/owner/services/loyaltyService'

const EARN_FIELDS: { key: keyof LoyaltyProgram; label: string; hint: string }[] = [
  { key: 'coinsPerSpin', label: 'Coins per spin', hint: 'Every time a customer spins your wheel' },
  { key: 'coinsPerFirstScan', label: 'First-visit bonus', hint: 'One-time, the first time they scan you' },
  { key: 'coinsPerCheckin', label: 'Daily check-in', hint: 'Once a day when they come back' },
  { key: 'coinsPerReview', label: 'Review reward', hint: 'One-time, for leaving a review' },
  { key: 'coinsPerRedeem', label: 'Redemption bonus', hint: 'When they redeem a reward at your counter' },
]

export function LoyaltyPage() {
  const { data, isLoading, isError, refetch } = useLoyalty()
  const saveProgram = useUpdateLoyaltyProgram()
  const createReward = useCreateLoyaltyReward()
  const updateReward = useUpdateLoyaltyReward()
  const deleteReward = useDeleteLoyaltyReward()

  const [form, setForm] = useState<LoyaltyProgram | null>(null)
  const [editing, setEditing] = useState<LoyaltyReward | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<LoyaltyReward | null>(null)

  useEffect(() => {
    if (data?.program) setForm(data.program)
  }, [data?.program])

  if (isLoading || !form) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <Spinner size={32} label="Loading loyalty settings" />
      </div>
    )
  }
  if (isError || !data) {
    return <ErrorState onRetry={() => void refetch()} />
  }

  function setField(key: keyof LoyaltyProgram, value: number) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  async function handleSave() {
    if (!form) return
    try {
      await saveProgram.mutateAsync({
        enabled: form.enabled,
        coinsPerSpin: form.coinsPerSpin,
        coinsPerFirstScan: form.coinsPerFirstScan,
        coinsPerCheckin: form.coinsPerCheckin,
        coinsPerReview: form.coinsPerReview,
        coinsPerRedeem: form.coinsPerRedeem,
        monthlyBudgetCap: form.monthlyBudgetCap || null,
      })
      toast.success('Loyalty settings saved')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save settings.')
    }
  }

  async function submitReward(input: LoyaltyRewardInput) {
    try {
      if (editing) {
        await updateReward.mutateAsync({ id: editing.id, input })
        toast.success('Reward tier updated')
      } else {
        await createReward.mutateAsync(input)
        toast.success('Reward tier added')
      }
      setCreating(false)
      setEditing(null)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save the reward tier.')
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      await deleteReward.mutateAsync(deleting.id)
      toast.success('Reward tier deleted')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not delete the tier.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-title font-bold text-foreground">
          <Coins className="size-6 text-premium" aria-hidden />
          Listee Coins
        </h1>
        <p className="text-caption text-text-secondary">
          Reward loyal customers with coins they can spend at your shop.
        </p>
      </div>

      {/* Master toggle */}
      <Card className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="loyalty-enabled" className="text-body font-semibold text-foreground">
            Loyalty program
          </Label>
          <p className="text-caption text-text-secondary">
            {form.enabled ? 'Customers are earning coins at your shop.' : 'Coins are paused for your shop.'}
          </p>
        </div>
        <Switch
          id="loyalty-enabled"
          checked={form.enabled}
          onCheckedChange={(v) => setForm((prev) => (prev ? { ...prev, enabled: v } : prev))}
        />
      </Card>

      {/* Earn rates */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-premium" aria-hidden />
          <h2 className="text-body-lg font-semibold text-foreground">Earn rates</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {EARN_FIELDS.map((f) => (
            <TextField
              key={f.key}
              label={f.label}
              hint={f.hint}
              type="number"
              min={0}
              inputMode="numeric"
              value={String(form[f.key] ?? 0)}
              onChange={(e) => setField(f.key, Math.max(0, Number(e.target.value) || 0))}
              disabled={!form.enabled}
            />
          ))}
          <TextField
            label="Monthly budget cap"
            hint="0 = unlimited"
            type="number"
            min={0}
            inputMode="numeric"
            value={String(form.monthlyBudgetCap ?? 0)}
            onChange={(e) => setField('monthlyBudgetCap', Math.max(0, Number(e.target.value) || 0))}
            disabled={!form.enabled}
          />
        </div>
        <p className="text-caption text-text-muted">
          You’ve minted <span className="font-semibold text-foreground">{form.coinsMintedThisMonth}</span> coins
          this month.
        </p>
        <div className="flex justify-end">
          <Button onClick={() => void handleSave()} isLoading={saveProgram.isPending}>
            Save settings
          </Button>
        </div>
      </Card>

      {/* Reward tiers */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-body-lg font-semibold text-foreground">Reward tiers</h2>
          <p className="text-caption text-text-secondary">What customers can redeem their coins for.</p>
        </div>
        <Button size="md" leftIcon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
          Add tier
        </Button>
      </div>

      {data.rewards.length === 0 ? (
        <EmptyState
          icon={<Gift className="size-7" />}
          title="No reward tiers yet"
          description="Add a tier like “150 coins → free coffee” so customers have something to work towards."
          actionLabel="Add reward tier"
          onAction={() => setCreating(true)}
        />
      ) : (
        <Stagger className="space-y-3">
          {data.rewards.map((tier) => (
            <StaggerItem key={tier.id}>
              <Card padding="none" className="overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-premium/15 text-premium">
                    <Gift className="size-6" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-body font-semibold text-foreground">{tier.title}</p>
                      {!tier.active && <Badge tone="neutral">Paused</Badge>}
                      {tier.stock === 0 && <Badge tone="warning">Sold out</Badge>}
                    </div>
                    <p className="text-caption text-text-secondary">
                      {tier.rewardValue ?? tier.description ?? '—'}
                      {tier.stock != null ? ` · ${tier.stock} left` : ''}
                    </p>
                  </div>
                  <Badge tone="premium" className="shrink-0 gap-1">
                    <Coins className="size-3.5" aria-hidden />
                    {tier.coinsCost}
                  </Badge>
                </div>
                <div className="flex items-center justify-end gap-1 border-t border-border/60 px-2 py-1.5">
                  <IconButton aria-label="Edit tier" variant="ghost" onClick={() => setEditing(tier)}>
                    <Pencil className="size-4" aria-hidden />
                  </IconButton>
                  <IconButton aria-label="Delete tier" variant="ghost" onClick={() => setDeleting(tier)}>
                    <Trash2 className="size-4 text-danger" aria-hidden />
                  </IconButton>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Sheet
        open={creating || editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false)
            setEditing(null)
          }
        }}
      >
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editing ? 'Edit reward tier' : 'New reward tier'}</SheetTitle>
            <SheetDescription>Customers spend coins to claim this reward.</SheetDescription>
          </SheetHeader>
          <div className="p-4">
            <RewardTierForm
              tier={editing}
              submitting={createReward.isPending || updateReward.isPending}
              onSubmit={submitReward}
            />
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmationDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this reward tier?"
        description="Customers will no longer be able to redeem coins for it."
        confirmLabel="Delete"
        destructive
        isLoading={deleteReward.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}

function RewardTierForm({
  tier,
  submitting,
  onSubmit,
}: {
  tier: LoyaltyReward | null
  submitting: boolean
  onSubmit: (input: LoyaltyRewardInput) => void
}) {
  const [title, setTitle] = useState(tier?.title ?? '')
  const [rewardValue, setRewardValue] = useState(tier?.rewardValue ?? '')
  const [coinsCost, setCoinsCost] = useState(tier?.coinsCost ?? 100)
  const [stock, setStock] = useState<string>(tier?.stock != null ? String(tier.stock) : '')
  const [active, setActive] = useState(tier?.active ?? true)
  const [error, setError] = useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (title.trim().length < 2) return setError('Give the reward a name.')
    if (coinsCost < 1) return setError('Coin cost must be at least 1.')
    onSubmit({
      title: title.trim(),
      rewardValue: rewardValue.trim() || null,
      coinsCost,
      stock: stock === '' ? null : Math.max(0, Number(stock) || 0),
      active,
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <TextField
        label="Reward name"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Free Coffee"
      />
      <TextField
        label="Reward value"
        hint="Shown to the customer and on the redemption code"
        value={rewardValue}
        onChange={(e) => setRewardValue(e.target.value)}
        placeholder="e.g. 1 Free Coffee"
      />
      <TextField
        label="Coin cost"
        type="number"
        min={1}
        inputMode="numeric"
        value={String(coinsCost)}
        onChange={(e) => setCoinsCost(Math.max(1, Number(e.target.value) || 1))}
      />
      <TextField
        label="Stock (optional)"
        hint="Leave blank for unlimited"
        type="number"
        min={0}
        inputMode="numeric"
        value={stock}
        onChange={(e) => setStock(e.target.value)}
        placeholder="Unlimited"
      />
      <div className="flex items-center justify-between">
        <Label htmlFor="tier-active">Active</Label>
        <Switch id="tier-active" checked={active} onCheckedChange={setActive} />
      </div>

      {error && (
        <p role="alert" className="text-caption text-danger">
          {error}
        </p>
      )}

      <Button type="submit" fullWidth isLoading={submitting}>
        {tier ? 'Save changes' : 'Add reward tier'}
      </Button>
    </form>
  )
}
