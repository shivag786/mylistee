import { useState } from 'react'
import { Check, Crown, Receipt, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog'
import { MeterBar } from '@/components/charts/MeterBar'
import { Reveal } from '@/components/motion/Reveal'
import { toast } from '@/utils/toast'
import {
  useSubscription,
  usePlans,
  useInvoices,
  useSubscribe,
  useCancelSubscription,
} from '@/features/owner/hooks/useOwner'
import type { Invoice, Plan, PlanUsageItem, SubscriptionState } from '@/features/owner/types'
import { featureLabel, formatPrice, intervalSuffix, formatLimit } from '@/features/owner/planDisplay'
import { cn } from '@/utils/cn'

export function SubscriptionPage() {
  const { data: state, isLoading, isError, refetch } = useSubscription()
  const { data: plans } = usePlans()
  const { data: invoices } = useInvoices()
  const subscribe = useSubscribe()
  const cancel = useCancelSubscription()

  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)

  if (isLoading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Spinner size={32} label="Loading subscription" />
      </div>
    )
  }
  if (isError || !state) {
    return <ErrorState onRetry={() => void refetch()} />
  }

  const current = state.plan
  const isDowngrade = pendingPlan?.isFree ?? false

  function confirmSwitch() {
    if (!pendingPlan) return
    subscribe.mutate(pendingPlan.key, {
      onSuccess: () => {
        toast.success(
          pendingPlan.isFree ? 'Switched to the Free plan.' : `You're now on ${pendingPlan.name}!`,
        )
        setPendingPlan(null)
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not change plan.'),
    })
  }

  function doCancel() {
    cancel.mutate(undefined, {
      onSuccess: () => {
        toast.success('Subscription cancelled. Access continues until the period ends.')
        setConfirmCancel(false)
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not cancel.'),
    })
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-title font-bold text-foreground">Plan &amp; billing</h1>
        <p className="text-caption text-text-secondary">Manage your subscription and invoices</p>
      </header>

      <CurrentPlanCard state={state} onCancel={() => setConfirmCancel(true)} />

      <section aria-label="Available plans" className="space-y-3">
        <h2 className="text-body-lg font-semibold text-foreground">Plans</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(plans ?? []).map((plan) => (
            <PlanCard
              key={plan.key}
              plan={plan}
              currentKey={current?.key}
              onSelect={() => setPendingPlan(plan)}
            />
          ))}
        </div>
      </section>

      <InvoicesCard invoices={invoices ?? []} />

      <ConfirmationDialog
        open={pendingPlan !== null}
        onOpenChange={(o) => !o && setPendingPlan(null)}
        title={isDowngrade ? 'Switch to Free?' : `Upgrade to ${pendingPlan?.name ?? ''}?`}
        description={
          isDowngrade ? (
            'Your current plan will end and premium limits will no longer apply.'
          ) : (
            <>
              You'll get {pendingPlan?.name} features right away.{' '}
              <span className="font-medium text-foreground">
                This is a demo — no real payment is taken.
              </span>{' '}
              In production you'd be charged {pendingPlan && formatPrice(pendingPlan.price, pendingPlan.currency)}
              {pendingPlan && intervalSuffix(pendingPlan.interval)}.
            </>
          )
        }
        confirmLabel={isDowngrade ? 'Switch to Free' : 'Confirm upgrade'}
        isLoading={subscribe.isPending}
        onConfirm={confirmSwitch}
      />

      <ConfirmationDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel subscription?"
        description="You'll keep your current plan until the end of the billing period, then move to the Free plan."
        confirmLabel="Cancel subscription"
        destructive
        isLoading={cancel.isPending}
        onConfirm={doCancel}
      />
    </div>
  )
}

function CurrentPlanCard({ state, onCancel }: { state: SubscriptionState; onCancel: () => void }) {
  const { plan, subscription, usage } = state
  const cancelPending = subscription && !subscription.autoRenew && subscription.endsAt

  return (
    <Reveal>
      <Card elevation="soft" className="space-y-4" padding="lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-caption text-text-secondary">Current plan</p>
            <div className="flex items-center gap-2">
              <h2 className="text-subtitle font-bold text-foreground">{plan?.name ?? 'Free'}</h2>
              {plan?.badge && <Badge tone="premium">{plan.badge}</Badge>}
            </div>
            {plan && (
              <p className="mt-0.5 text-body font-semibold text-foreground">
                {formatPrice(plan.price, plan.currency)}
                <span className="text-caption font-normal text-text-secondary">
                  {plan.price > 0 ? intervalSuffix(plan.interval) : ''}
                </span>
              </p>
            )}
          </div>
          <span className="grid size-11 place-items-center rounded-full bg-premium-soft text-premium">
            <Crown className="size-5" aria-hidden />
          </span>
        </div>

        {cancelPending && (
          <p className="rounded-md bg-warning-soft px-3 py-2 text-small text-warning-foreground">
            Cancels on {new Date(subscription!.endsAt!).toLocaleDateString()} — you'll move to Free
            after that.
          </p>
        )}

        <div className="space-y-3">
          <UsageRow label="Active offers" item={usage.activeOffers} unit="offers" />
          <UsageRow label="Gallery images" item={usage.galleryImages} unit="images" />
          <UsageRow label="QR codes" item={usage.qrCodes} unit="codes" />
        </div>

        {subscription && subscription.autoRenew && (
          <Button variant="outline" size="md" onClick={onCancel} className="w-full">
            Cancel subscription
          </Button>
        )}
      </Card>
    </Reveal>
  )
}

function UsageRow({ label, item, unit }: { label: string; item: PlanUsageItem; unit: string }) {
  if (item.limit === null) {
    return (
      <div className="flex items-center justify-between text-caption">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-text-secondary">
          {item.used} used · <span className="text-success">Unlimited</span>
        </span>
      </div>
    )
  }
  const pct = item.limit > 0 ? Math.round((item.used / item.limit) * 100) : 0
  return (
    <MeterBar
      label={label}
      value={pct}
      color={pct >= 100 ? 'var(--danger)' : 'var(--primary)'}
      caption={`${item.used} of ${item.limit} ${unit} used`}
    />
  )
}

function PlanCard({
  plan,
  currentKey,
  onSelect,
}: {
  plan: Plan
  currentKey?: string
  onSelect: () => void
}) {
  const isCurrent = plan.key === currentKey
  const Icon = plan.isFree ? Sparkles : Crown

  return (
    <Card
      elevation="soft"
      padding="md"
      className={cn(
        'flex flex-col gap-3',
        isCurrent && 'ring-2 ring-primary',
        plan.badge && !isCurrent && 'ring-1 ring-premium/40',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-primary-soft text-primary">
            <Icon className="size-4" aria-hidden />
          </span>
          <span className="text-body-lg font-semibold text-foreground">{plan.name}</span>
        </div>
        {plan.badge && <Badge tone="premium" size="sm">{plan.badge}</Badge>}
      </div>

      <div>
        <span className="text-title font-bold text-foreground">
          {formatPrice(plan.price, plan.currency)}
        </span>
        {plan.price > 0 && (
          <span className="text-caption text-text-secondary">{intervalSuffix(plan.interval)}</span>
        )}
      </div>

      {plan.description && <p className="text-caption text-text-secondary">{plan.description}</p>}

      <ul className="space-y-1.5">
        <PlanLimit text={formatLimit(plan.limits.maxActiveOffers, 'active offers')} />
        <PlanLimit text={formatLimit(plan.limits.maxOfferDays, 'day validity')} />
        {plan.features.map((f) => (
          <PlanLimit key={f} text={featureLabel(f)} />
        ))}
      </ul>

      <div className="mt-auto pt-1">
        {isCurrent ? (
          <Button variant="secondary" size="md" disabled className="w-full">
            Current plan
          </Button>
        ) : (
          <Button
            variant={plan.isFree ? 'outline' : 'primary'}
            size="md"
            onClick={onSelect}
            className="w-full"
          >
            {plan.isFree ? 'Switch to Free' : `Choose ${plan.name}`}
          </Button>
        )}
      </div>
    </Card>
  )
}

function PlanLimit({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-caption text-foreground">
      <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
      <span className="capitalize">{text}</span>
    </li>
  )
}

function InvoicesCard({ invoices }: { invoices: Invoice[] }) {
  return (
    <Reveal>
      <Card elevation="soft" className="space-y-3" padding="md">
        <div className="flex items-center gap-2">
          <Receipt className="size-4 text-text-secondary" aria-hidden />
          <h2 className="text-body-lg font-semibold text-foreground">Invoices</h2>
        </div>
        {invoices.length === 0 ? (
          <p className="py-4 text-center text-caption text-text-muted">
            No invoices yet. Upgrade to a paid plan to see billing history here.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-caption font-medium text-foreground">{inv.number}</p>
                  <p className="text-small text-text-muted">
                    {inv.planName} · {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-caption font-semibold tabular-nums text-foreground">
                    {formatPrice(inv.amount, inv.currency)}
                  </span>
                  <Badge tone={inv.status === 'paid' ? 'success' : 'neutral'} size="sm">
                    {inv.status}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Reveal>
  )
}
