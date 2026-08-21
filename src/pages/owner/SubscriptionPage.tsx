import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Crown, Receipt, ShieldCheck, Sparkles } from 'lucide-react'
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
import { usePlanCheckout, type CheckoutStage } from '@/features/owner/hooks/usePlanCheckout'
import { useAppConfig } from '@/hooks/useAppConfig'
import type { Invoice, Plan, PlanUsageItem, SubscriptionState } from '@/features/owner/types'
import { featureLabel, formatPrice, intervalSuffix, formatLimit } from '@/features/owner/planDisplay'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

export function SubscriptionPage() {
  const { data: state, isLoading, isError, refetch } = useSubscription()
  const { data: plans } = usePlans()
  const { data: invoices } = useInvoices()
  const subscribe = useSubscribe()
  const cancel = useCancelSubscription()
  const checkout = usePlanCheckout()
  const { data: appConfig } = useAppConfig()

  // No gateway configured (local dev / demo seed) — the API still accepts a plain
  // plan switch there, so keep that path working instead of failing at checkout.
  const paymentsLive = appConfig?.payments?.razorpay ?? true

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

  /**
   * Two different actions behind one dialog: dropping to Free is a plain plan
   * switch, while a paid plan has to go through Razorpay. The dialog closes
   * before Checkout opens so the payment window is not stacked on top of it.
   */
  function confirmSwitch() {
    const plan = pendingPlan
    if (!plan) return

    if (plan.isFree || !paymentsLive) {
      subscribe.mutate(plan.key, {
        onSuccess: () => {
          toast.success(plan.isFree ? 'Switched to the Free plan.' : `You're now on ${plan.name}!`)
          setPendingPlan(null)
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not change plan.'),
      })
      return
    }

    setPendingPlan(null)
    checkout.start(plan, {
      onSuccess: () => toast.success(`Payment successful — you're now on ${plan.name}!`),
      onError: (err) => toast.error(err.message || 'The payment could not be completed.'),
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
              busy={checkout.activePlanKey === plan.key ? checkout.stage : 'idle'}
              disabled={checkout.isPending}
              onSelect={() => setPendingPlan(plan)}
            />
          ))}
        </div>
      </section>

      <InvoicesCard invoices={invoices ?? []} />

      {paymentsLive && <BillingTerms />}

      <ConfirmationDialog
        open={pendingPlan !== null}
        onOpenChange={(o) => !o && setPendingPlan(null)}
        title={isDowngrade ? 'Switch to Free?' : `Upgrade to ${pendingPlan?.name ?? ''}?`}
        description={
          isDowngrade ? (
            'Your current plan will end and premium limits will no longer apply.'
          ) : !paymentsLive ? (
            `You'll get ${pendingPlan?.name ?? ''} features right away. Online payments are not enabled on this environment, so nothing is charged.`
          ) : (
            <>
              You'll be charged{' '}
              <span className="font-semibold text-foreground">
                {pendingPlan && formatPrice(pendingPlan.price, pendingPlan.currency)}
                {pendingPlan && intervalSuffix(pendingPlan.interval)}
              </span>{' '}
              through Razorpay, and {pendingPlan?.name} features unlock as soon as the payment goes
              through. Renewal is not automatic — we'll remind you before the period ends. See our{' '}
              <Link to={ROUTES.refund} className="font-medium text-primary underline">
                Refund Policy
              </Link>{' '}
              before you pay.
            </>
          )
        }
        confirmLabel={
          isDowngrade ? 'Switch to Free' : paymentsLive ? 'Continue to payment' : 'Confirm upgrade'
        }
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
          <UsageRow label="Active combos" item={usage.activeCombos} unit="combos" />
          <UsageRow label="Active promotions" item={usage.activePromotions} unit="promotions" />
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

/** What the upgrade button says while a payment is in flight. */
const STAGE_LABELS: Record<Exclude<CheckoutStage, 'idle'>, string> = {
  creating: 'Starting payment…',
  awaiting: 'Waiting for payment…',
  verifying: 'Confirming payment…',
}

function PlanCard({
  plan,
  currentKey,
  busy,
  disabled,
  onSelect,
}: {
  plan: Plan
  currentKey?: string
  /** This card's stage in the checkout flow; 'idle' unless it is the one paying. */
  busy: CheckoutStage
  /** True while any plan is paying — one checkout at a time. */
  disabled: boolean
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
            isLoading={busy !== 'idle'}
            disabled={disabled}
            className="w-full"
          >
            {busy === 'idle'
              ? plan.isFree
                ? 'Switch to Free'
                : `Choose ${plan.name}`
              : STAGE_LABELS[busy]}
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

/**
 * The payment disclosures an owner should see next to the buy button, rather
 * than only buried in the policy pages. Razorpay's own onboarding checks expect
 * these terms to be reachable from wherever money is taken.
 */
function BillingTerms() {
  return (
    <Card elevation="soft" padding="md" className="space-y-2">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4 text-success" aria-hidden />
        <h2 className="text-body-lg font-semibold text-foreground">Payments &amp; refunds</h2>
      </div>
      <p className="text-caption text-text-secondary">
        Payments are processed securely by Razorpay. Listee never sees or stores your card, UPI or
        bank details. Prices are in Indian Rupees and include applicable taxes.
      </p>
      <p className="text-caption text-text-secondary">
        Plans do not auto-renew — you pay once per billing period and choose whether to renew.
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-caption">
        <Link to={ROUTES.terms} className="font-medium text-primary underline">
          Terms &amp; Conditions
        </Link>
        <Link to={ROUTES.refund} className="font-medium text-primary underline">
          Refund Policy
        </Link>
        <Link to={ROUTES.privacy} className="font-medium text-primary underline">
          Privacy Policy
        </Link>
      </div>
    </Card>
  )
}
