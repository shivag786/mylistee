import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Award, BadgePercent, Gift, Info, Plus, Receipt, Repeat, RotateCcw, Ticket, Trash2, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useOwnerRewards, useRepeatCustomers, useRewardActions } from '@/features/rewards/useRewards'
import { ordinal, ruleLabel } from '@/features/rewards/format'
import type {
  CouponFormValues,
  DiscountType,
  LoyaltyRule,
  OwnerCoupon,
  OwnerRewards,
  RewardRuleBase,
} from '@/features/rewards/types'
import { toast } from '@/utils/toast'
import { cn } from '@/utils/cn'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'

/** Form state: numbers as strings while typing; `on` per rule. */
interface RuleDraft {
  on: boolean
  type: DiscountType
  value: string
  maxOff: string
  minBill: string
  days: string
  every: string
}

type AnyRule = RewardRuleBase & { min_bill?: number | null; days?: number; every?: number }

function draftFrom(rule: AnyRule | null, defaults: Partial<RuleDraft>): RuleDraft {
  return {
    on: rule !== null,
    type: rule?.type ?? defaults.type ?? 'flat',
    value: rule?.value != null ? String(rule.value) : (defaults.value ?? ''),
    maxOff: rule?.max_off != null ? String(rule.max_off) : '',
    minBill: rule?.min_bill != null ? String(rule.min_bill) : (defaults.minBill ?? ''),
    days: rule?.days != null ? String(rule.days) : (defaults.days ?? '15'),
    every: rule?.every != null ? String(rule.every) : (defaults.every ?? '5'),
  }
}

const num = (s: string) => (s.trim() === '' ? null : Number(s))
const digits = (s: string) => s.replace(/[^\d.]/g, '')

/**
 * Rewards & coupons — every way the shop rewards customers, set up once on
 * one screen: a bill discount, a come-back offer, a loyalty reward, and
 * coupon codes. Customers see all of it on the shop page and in their cart.
 */
export function RewardsPage() {
  usePageTitle('Rewards & coupons')
  const { data, isLoading, isError, refetch } = useOwnerRewards()

  if (isLoading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Spinner size={32} label="Loading rewards" />
      </div>
    )
  }
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />

  return <RewardsEditor data={data} />
}

function RewardsEditor({ data }: { data: OwnerRewards }) {
  const { saveRules } = useRewardActions()
  const [bill, setBill] = useState(() => draftFrom(data.billDiscount, { minBill: '499', value: '50' }))
  const [comeback, setComeback] = useState(() => draftFrom(data.comeback, { type: 'percent', value: '10' }))
  const [loyalty, setLoyalty] = useState(() => loyaltyDraftFrom(data.loyalty))

  useEffect(() => {
    setBill(draftFrom(data.billDiscount, { minBill: '499', value: '50' }))
    setComeback(draftFrom(data.comeback, { type: 'percent', value: '10' }))
    setLoyalty(loyaltyDraftFrom(data.loyalty))
  }, [data.billDiscount, data.comeback, data.loyalty])

  const base = (d: Pick<RuleDraft, 'type' | 'value' | 'maxOff'>) => ({
    type: d.type,
    value: Number(d.value) || 0,
    max_off: d.type === 'percent' ? num(d.maxOff) : null,
  })

  function save() {
    for (const [name, d] of [['Bill discount', bill], ['Come-back offer', comeback]] as const) {
      if (d.on && !(Number(d.value) > 0)) return toast.error(`${name}: enter the discount amount.`)
      if (d.on && d.type === 'percent' && Number(d.value) > 90) return toast.error(`${name}: keep it at 90% or less.`)
    }
    const loyaltyProblem = loyalty.on ? checkSteps(loyalty.steps) : null
    if (loyaltyProblem) return toast.error(`Loyalty steps: ${loyaltyProblem}`)

    saveRules.mutate(
      {
        billDiscount: bill.on ? { ...base(bill), min_bill: Number(bill.minBill) || 0 } : null,
        comeback: comeback.on ? { ...base(comeback), min_bill: num(comeback.minBill), days: Number(comeback.days) || 15 } : null,
        loyalty: loyalty.on
          ? {
              repeat: loyalty.repeat,
              steps: loyalty.steps
                .map((s) => ({ at: Number(s.at), ...base(s) }))
                .sort((a, b) => a.at - b.at),
            }
          : null,
      },
      {
        onSuccess: () => toast.success('Rewards saved — customers see them now'),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic),
      },
    )
  }

  const preview = [
    bill.on && Number(bill.value) > 0 && `${ruleLabel(base(bill))} on bills above ₹${Number(bill.minBill) || 0}`,
    ...(loyalty.on
      ? sortedSteps(loyalty.steps)
          .filter((s) => Number(s.at) > 0 && Number(s.value) > 0)
          .map((s) => `${ordinal(Number(s.at))} order: ${ruleLabel(base(s))}`)
      : []),
    comeback.on && Number(comeback.value) > 0 && `${ruleLabel(base(comeback))} on the next visit`,
  ].filter(Boolean) as string[]

  return (
    <div className="space-y-5 pb-24">
      <header>
        <h1 className="text-title font-bold text-foreground">Rewards & coupons</h1>
        <p className="text-caption text-text-secondary">
          Set it once. Customers see these on your shop page and in their cart — they apply on their own.
        </p>
      </header>

      {/* What customers see, live as the owner types. */}
      <Card padding="md" className="bg-gradient-to-br from-primary-soft to-gold-soft">
        <p className="flex items-center gap-1.5 text-small font-bold uppercase tracking-wide text-primary">
          <Gift className="size-4" aria-hidden /> Customers see
        </p>
        {preview.length > 0 || data.coupons.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {preview.map((p) => (
              <span key={p} className="rounded-full bg-surface px-3 py-1.5 text-caption font-semibold text-foreground shadow-soft">
                {p}
              </span>
            ))}
            {data.coupons.filter((c) => c.live).slice(0, 2).map((c) => (
              <span key={c.id} className="rounded-full border border-dashed border-primary bg-surface px-3 py-1.5 text-caption font-bold text-primary">
                {c.code} · {c.label}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-caption text-text-secondary">Nothing yet — switch on a reward below.</p>
        )}
        {data.stats.personalIssued > 0 && (
          <p className="mt-3 text-small text-text-secondary">
            {data.stats.personalIssued} reward coupons earned by customers · {data.stats.personalUsed} used
          </p>
        )}
      </Card>

      <RuleCard
        icon={<Receipt className="size-5" />}
        title="Bill discount"
        hint="Automatic at checkout when the bill crosses an amount. Pushes bigger orders."
        draft={bill}
        onChange={setBill}
      >
        <MoneyField label="When the bill is at least" value={bill.minBill} onChange={(v) => setBill({ ...bill, minBill: v })} />
      </RuleCard>

      <RuleCard
        icon={<RotateCcw className="size-5" />}
        title="Come-back offer"
        hint="After every paid order, the customer gets a coupon for their next visit."
        draft={comeback}
        onChange={setComeback}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Valid for (days)</Label>
            <Input inputMode="numeric" value={comeback.days} onChange={(e) => setComeback({ ...comeback, days: digits(e.target.value) })} />
          </div>
          <MoneyField label="Next bill at least (optional)" value={comeback.minBill} onChange={(v) => setComeback({ ...comeback, minBill: v })} />
        </div>
      </RuleCard>

      <LoyaltyStepsCard draft={loyalty} onChange={setLoyalty} />

      <RepeatCustomersCard />

      <CouponsCard coupons={data.coupons} />

      <Card padding="md" className="flex items-start gap-3 bg-surface-muted">
        <Info className="mt-0.5 size-5 shrink-0 text-info" aria-hidden />
        <p className="text-small text-text-secondary">
          <span className="font-semibold text-foreground">Listee fee:</span> a small fee on every order. Customers pay the
          same price online or in cash — what you get per item shows on each product card.
        </p>
      </Card>

      <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 px-4 lg:bottom-6 lg:left-64">
        <Button size="lg" className="mx-auto flex w-full max-w-md shadow-premium" isLoading={saveRules.isPending} onClick={save}>
          Save rewards
        </Button>
      </div>
    </div>
  )
}

/** A switchable reward: header with a switch, then % / ₹, amount, cap and the card's own fields. */
function RuleCard({
  icon,
  title,
  hint,
  draft,
  onChange,
  children,
}: {
  icon: ReactNode
  title: string
  hint: string
  draft: RuleDraft
  onChange: (d: RuleDraft) => void
  children: ReactNode
}) {
  return (
    <Card padding="md" className={cn('space-y-4 transition-colors', draft.on && 'border-primary/40')}>
      <label className="flex items-start gap-3">
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', draft.on ? 'bg-primary text-primary-foreground' : 'bg-surface-muted text-text-muted')}>
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-body font-bold text-foreground">{title}</span>
          <span className="block text-small text-text-secondary">{hint}</span>
        </span>
        <Switch checked={draft.on} onCheckedChange={(on) => onChange({ ...draft, on })} aria-label={title} />
      </label>

      {draft.on && (
        <div className="space-y-3 border-t border-border pt-4">
          <DiscountFields draft={draft} onChange={onChange} />
          {children}
        </div>
      )}
    </Card>
  )
}

function DiscountFields({ draft, onChange }: { draft: RuleDraft; onChange: (d: RuleDraft) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>Customer gets</Label>
      <div className="flex items-center gap-2">
        <TypeToggle value={draft.type} onChange={(type) => onChange({ ...draft, type })} />
        <Input
          inputMode="decimal"
          value={draft.value}
          onChange={(e) => onChange({ ...draft, value: digits(e.target.value) })}
          placeholder={draft.type === 'percent' ? '10' : '50'}
          className="min-w-0 flex-1"
          aria-label="Discount"
        />
        {draft.type === 'percent' && (
          <Input
            inputMode="decimal"
            value={draft.maxOff}
            onChange={(e) => onChange({ ...draft, maxOff: digits(e.target.value) })}
            placeholder="Max ₹"
            className="w-24"
            aria-label="Maximum discount"
          />
        )}
      </div>
    </div>
  )
}

function TypeToggle({ value, onChange }: { value: DiscountType; onChange: (t: DiscountType) => void }) {
  return (
    <div className="inline-flex shrink-0 rounded-lg bg-surface-muted p-0.5" role="radiogroup" aria-label="Discount type">
      {(['flat', 'percent'] as const).map((t) => (
        <button
          key={t}
          type="button"
          role="radio"
          aria-checked={value === t}
          onClick={() => onChange(t)}
          className={cn('rounded-md px-3 py-2 text-caption font-bold', value === t ? 'bg-primary text-primary-foreground' : 'text-text-secondary')}
        >
          {t === 'flat' ? '₹ off' : '% off'}
        </button>
      ))}
    </div>
  )
}

function MoneyField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-text-secondary">₹</span>
        <Input inputMode="decimal" value={value} onChange={(e) => onChange(digits(e.target.value))} className="pl-8" />
      </div>
    </div>
  )
}

/* ------------------------------------------------------- loyalty steps -- */

/** Mirrors RewardService::MAX_STEPS / MAX_STEP_AT on the server. */
const MAX_STEPS = 10
const MAX_STEP_AT = 100

interface StepDraft {
  /** Stable key for animations while the order number is being edited. */
  key: string
  at: string
  type: DiscountType
  value: string
  maxOff: string
}

interface LoyaltyDraft {
  on: boolean
  repeat: boolean
  steps: StepDraft[]
}

let stepSeq = 0
const stepKey = () => `step-${++stepSeq}`

function loyaltyDraftFrom(rule: LoyaltyRule | null): LoyaltyDraft {
  if (!rule || rule.steps.length === 0) {
    // A sensible card to start from: something small on the 3rd, more on the 5th.
    return {
      on: false,
      repeat: true,
      steps: [
        { key: stepKey(), at: '3', type: 'flat', value: '20', maxOff: '' },
        { key: stepKey(), at: '5', type: 'flat', value: '50', maxOff: '' },
      ],
    }
  }
  return {
    on: true,
    repeat: rule.repeat,
    steps: rule.steps.map((s) => ({
      key: stepKey(),
      at: String(s.at),
      type: s.type,
      value: String(s.value),
      maxOff: s.max_off != null ? String(s.max_off) : '',
    })),
  }
}

function sortedSteps(steps: StepDraft[]): StepDraft[] {
  return [...steps].sort((a, b) => (Number(a.at) || 999) - (Number(b.at) || 999))
}

/** What is wrong with the steps, in words — or null when they can be saved. */
function checkSteps(steps: StepDraft[]): string | null {
  if (steps.length === 0) return 'add at least one step, or switch loyalty off.'
  const seen = new Set<number>()
  for (const s of steps) {
    const at = Number(s.at)
    if (!Number.isInteger(at) || at < 1 || at > MAX_STEP_AT) return `order numbers go from 1 to ${MAX_STEP_AT}.`
    if (seen.has(at)) return `there are two rewards on the ${ordinal(at)} order.`
    seen.add(at)
    if (!(Number(s.value) > 0)) return `enter the reward for the ${ordinal(at)} order.`
    if (s.type === 'percent' && Number(s.value) > 90) return `keep the ${ordinal(at)} order at 90% or less.`
  }
  return null
}

/**
 * The loyalty card, built step by step: a reward on the 3rd order, a bigger
 * one on the 5th, another on the 6th… Set up once, edited any time. Each
 * reward reaches the customer as a scratch card.
 */
function LoyaltyStepsCard({ draft, onChange }: { draft: LoyaltyDraft; onChange: (d: LoyaltyDraft) => void }) {
  const reduce = useReducedMotion()
  const steps = draft.steps
  const valid = sortedSteps(steps).filter((s) => Number(s.at) > 0 && Number(s.value) > 0)
  const cycle = valid.length ? Number(valid[valid.length - 1].at) : 0
  const atCounts = steps.reduce<Record<string, number>>((m, s) => ({ ...m, [s.at]: (m[s.at] ?? 0) + 1 }), {})

  function update(key: string, patch: Partial<StepDraft>) {
    onChange({ ...draft, steps: steps.map((s) => (s.key === key ? { ...s, ...patch } : s)) })
  }

  function addStep() {
    const last = Math.max(0, ...steps.map((s) => Number(s.at) || 0))
    onChange({
      ...draft,
      steps: [...steps, { key: stepKey(), at: String(Math.min(MAX_STEP_AT, last + 2)), type: 'flat', value: '', maxOff: '' }],
    })
  }

  return (
    <Card padding="md" className={cn('space-y-4 transition-colors', draft.on && 'border-primary/40')}>
      <label className="flex items-start gap-3">
        <span
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-xl',
            draft.on ? 'bg-gradient-to-br from-[#4f46e5] to-[#9333ea] text-white' : 'bg-surface-muted text-text-muted',
          )}
        >
          <Award className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-body font-bold text-foreground">Loyalty steps</span>
          <span className="block text-small text-text-secondary">
            Reward regulars on their 3rd, 5th, 6th… order. Each reward arrives as a scratch card.
          </span>
        </span>
        <Switch checked={draft.on} onCheckedChange={(on) => onChange({ ...draft, on })} aria-label="Loyalty steps" />
      </label>

      <AnimatePresence initial={false}>
        {draft.on && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-border pt-4">
              {/* Live preview of the card customers will see */}
              {valid.length > 0 && <StepsPreview steps={valid} cycle={cycle} />}

              <ul className="space-y-2">
                <AnimatePresence initial={false}>
                  {steps.map((s) => {
                    const at = Number(s.at)
                    const clash = s.at !== '' && (atCounts[s.at] ?? 0) > 1
                    return (
                      <motion.li
                        key={s.key}
                        layout={!reduce}
                        initial={reduce ? false : { opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -24, transition: { duration: 0.18 } }}
                        className={cn('rounded-2xl border bg-surface p-3', clash ? 'border-danger' : 'border-border')}
                      >
                        <div className="flex items-center gap-2">
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-yellow-400 text-amber-900">
                            <Gift className="size-4" aria-hidden />
                          </span>
                          <div className="flex items-center gap-1.5 text-caption font-semibold text-foreground">
                            On order
                            <Input
                              inputMode="numeric"
                              value={s.at}
                              onChange={(e) => update(s.key, { at: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                              className="h-9 w-14 px-2 text-center font-bold"
                              aria-label="Order number"
                            />
                            <span className="text-text-muted">{at > 0 ? ordinal(at).replace(String(at), '') : ''}</span>
                          </div>
                          <button
                            type="button"
                            aria-label={`Remove the ${at > 0 ? ordinal(at) : ''} order step`}
                            onClick={() => onChange({ ...draft, steps: steps.filter((x) => x.key !== s.key) })}
                            className="ml-auto grid size-9 place-items-center rounded-full text-text-muted hover:bg-danger-soft hover:text-danger"
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </div>
                        <div className="mt-2.5">
                          <DiscountFields
                            draft={{ ...s, on: true, minBill: '', days: '', every: '' }}
                            onChange={(d) => update(s.key, { type: d.type, value: d.value, maxOff: d.maxOff })}
                          />
                        </div>
                        {clash && <p className="mt-1.5 text-small text-danger">Another step is on this order too.</p>}
                      </motion.li>
                    )
                  })}
                </AnimatePresence>
              </ul>

              {steps.length < MAX_STEPS && (
                <Button variant="outline" fullWidth leftIcon={<Plus className="size-4" />} onClick={addStep}>
                  Add a step
                </Button>
              )}

              <label className="flex items-start justify-between gap-4 rounded-xl bg-surface-muted p-3">
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-caption font-semibold text-foreground">
                    <Repeat className="size-4 text-primary" aria-hidden /> Start over after the last step
                  </span>
                  <span className="block text-small text-text-secondary">
                    {cycle > 0
                      ? draft.repeat
                        ? `After the ${ordinal(cycle)} order the card restarts — order ${cycle + Number(valid[0].at)} earns the first reward again.`
                        : `Each reward is earned once. After the ${ordinal(cycle)} order, the card is complete.`
                      : 'Add a step to see how it works.'}
                  </span>
                </span>
                <Switch
                  checked={draft.repeat}
                  onCheckedChange={(repeat) => onChange({ ...draft, repeat })}
                  aria-label="Start over after the last step"
                />
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

/** The steps along a track, as the customer's card will show them. */
function StepsPreview({ steps, cycle }: { steps: StepDraft[]; cycle: number }) {
  const reduce = useReducedMotion()
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#6d28d9] px-4 pb-4 pt-3 text-white">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Customers see</p>
      <div className="relative mb-1 mt-6">
        <div className="mx-3 h-1.5 rounded-full bg-white/20" />
        {steps.map((s, i) => (
          <motion.div
            key={s.key}
            layout={!reduce}
            className="absolute top-[3px] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ left: `calc(12px + (100% - 24px) * ${Number(s.at) / cycle})` }}
            initial={reduce ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 400, damping: 20 }}
          >
            <span className="grid size-7 place-items-center rounded-full border-2 border-yellow-200 bg-gradient-to-br from-amber-300 to-yellow-400 text-amber-900">
              <Gift className="size-3.5" aria-hidden />
            </span>
          </motion.div>
        ))}
      </div>
      <div className="mt-5 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
        {steps.map((s) => (
          <span key={s.key} className="shrink-0 rounded-xl bg-white/10 px-2.5 py-1.5">
            <span className="block text-[10px] font-bold uppercase text-white/70">{ordinal(Number(s.at))}</span>
            <span className="block text-small font-extrabold">
              {ruleLabel({ type: s.type, value: Number(s.value), max_off: s.type === 'percent' ? num(s.maxOff) : null })}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---------------------------------------------------- repeat customers -- */

function relativeDay(iso: string | null): string {
  if (!iso) return '—'
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/** Who keeps coming back, how often, and how close each is to their next reward. */
function RepeatCustomersCard() {
  const reduce = useReducedMotion()
  const { data, isLoading, isError, refetch } = useRepeatCustomers()
  const [showAll, setShowAll] = useState(false)

  const customers = data?.customers ?? []
  const shown = showAll ? customers : customers.slice(0, 6)
  const maxOrders = Math.max(1, ...customers.map((c) => c.orders))

  return (
    <Card padding="md" className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-success text-white">
          <Users className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body font-bold text-foreground">Repeat customers</p>
          <p className="text-small text-text-secondary">Who keeps ordering, and how close they are to their next reward.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner size={24} label="Loading customers" />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : customers.length === 0 ? (
        <p className="rounded-xl bg-surface-muted px-3 py-4 text-center text-caption text-text-secondary">
          No paid orders yet. Customers show up here after their first paid order.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Customers', value: data!.summary.customers },
              { label: 'Came back', value: data!.summary.repeat },
              { label: 'Rewards won', value: data!.summary.rewardsEarned },
              { label: 'Used', value: data!.summary.rewardsUsed },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-surface-muted px-1 py-2 text-center">
                <p className="text-subtitle font-extrabold tabular-nums text-foreground">{s.value}</p>
                <p className="text-[10px] font-semibold uppercase leading-tight text-text-muted">{s.label}</p>
              </div>
            ))}
          </div>

          <ul className="divide-y divide-border">
            {shown.map((c, i) => (
              <motion.li
                key={`${c.name}-${i}`}
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 10) * 0.03 }}
                className="flex items-center gap-3 py-2.5"
              >
                <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft text-caption font-bold text-primary">
                  {c.avatar ? <img src={c.avatar} alt="" className="size-full object-cover" /> : c.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2">
                    <span className="truncate text-caption font-semibold text-foreground">{c.name}</span>
                    {c.orders > 1 && (
                      <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-success-soft px-1.5 py-0.5 text-[10px] font-bold text-success">
                        <Repeat className="size-2.5" aria-hidden /> {c.orders}×
                      </span>
                    )}
                  </p>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-muted">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-premium"
                      initial={reduce ? false : { width: 0 }}
                      animate={{ width: `${(c.orders / maxOrders) * 100}%` }}
                      transition={{ type: 'spring', stiffness: 90, damping: 20 }}
                    />
                  </div>
                  <p className="mt-1 truncate text-small text-text-muted">
                    Last order {relativeDay(c.lastOrderAt)} · ₹{Math.round(c.spent).toLocaleString('en-IN')}
                    {c.rewardsEarned > 0 && ` · ${c.rewardsEarned} reward${c.rewardsEarned > 1 ? 's' : ''} won`}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {c.next ? (
                    <>
                      <p className="text-caption font-bold text-foreground">{c.next.ordersLeft} to go</p>
                      <p className="text-[10px] text-text-muted">for {ordinal(c.next.at)} order</p>
                    </>
                  ) : c.finished ? (
                    <p className="text-[11px] font-semibold text-success">All rewards won</p>
                  ) : null}
                </div>
              </motion.li>
            ))}
          </ul>

          {customers.length > 6 && (
            <Button variant="ghost" fullWidth onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'Show fewer' : `Show all ${customers.length}`}
            </Button>
          )}
        </>
      )}
    </Card>
  )
}

/* ------------------------------------------------------------- coupons -- */

function CouponsCard({ coupons }: { coupons: OwnerCoupon[] }) {
  const { updateCoupon, deleteCoupon } = useRewardActions()
  const [editing, setEditing] = useState<OwnerCoupon | 'new' | null>(null)

  function toggle(c: OwnerCoupon, active: boolean) {
    updateCoupon.mutate(
      {
        id: c.id,
        values: {
          code: c.code, title: c.title, discountType: c.discountType, value: c.value, maxDiscount: c.maxDiscount,
          minBill: c.minBill, perCustomerLimit: c.perCustomerLimit, usageLimit: c.usageLimit, expiresAt: c.expiresAt, active,
        },
      },
      { onError: (err) => toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic) },
    )
  }

  return (
    <Card padding="md" className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Ticket className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body font-bold text-foreground">Coupon codes</p>
          <p className="text-small text-text-secondary">Share a code (e.g. WELCOME20) — customers pick it in the cart.</p>
        </div>
        <Button size="sm" leftIcon={<Plus className="size-4" />} onClick={() => setEditing('new')}>
          New
        </Button>
      </div>

      {coupons.length > 0 && (
        <ul className="divide-y divide-border border-t border-border">
          {coupons.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-3">
              <button type="button" onClick={() => setEditing(c)} className="min-w-0 flex-1 text-left">
                <span className="flex items-center gap-2">
                  <span className="rounded-md border border-dashed border-primary px-2 py-0.5 font-mono text-caption font-bold text-primary">
                    {c.code}
                  </span>
                  {!c.live && <Badge tone="neutral" size="sm">{c.active ? 'Ended' : 'Off'}</Badge>}
                </span>
                <span className="mt-1 block truncate text-small text-text-secondary">
                  {c.label}
                  {c.minBill ? ` · above ₹${c.minBill}` : ''} · used {c.usedCount}
                  {c.usageLimit ? `/${c.usageLimit}` : ''}
                </span>
              </button>
              <Switch checked={c.active} onCheckedChange={(v) => toggle(c, v)} aria-label={`${c.code} on`} />
              <button
                type="button"
                aria-label={`Delete ${c.code}`}
                onClick={() =>
                  deleteCoupon.mutate(c.id, { onSuccess: () => toast.success(`${c.code} deleted`) })
                }
                className="grid size-9 place-items-center rounded-full text-text-muted hover:bg-danger-soft hover:text-danger"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <CouponDialog coupon={editing} onClose={() => setEditing(null)} />
    </Card>
  )
}

function CouponDialog({ coupon, onClose }: { coupon: OwnerCoupon | 'new' | null; onClose: () => void }) {
  const { createCoupon, updateCoupon } = useRewardActions()
  const existing = coupon && coupon !== 'new' ? coupon : null
  const [code, setCode] = useState('')
  const [type, setType] = useState<DiscountType>('percent')
  const [value, setValue] = useState('')
  const [maxOff, setMaxOff] = useState('')
  const [minBill, setMinBill] = useState('')
  const [perCustomer, setPerCustomer] = useState('1')
  const [expires, setExpires] = useState('')

  useEffect(() => {
    if (!coupon) return
    setCode(existing?.code ?? '')
    setType(existing?.discountType ?? 'percent')
    setValue(existing ? String(existing.value) : '')
    setMaxOff(existing?.maxDiscount != null ? String(existing.maxDiscount) : '')
    setMinBill(existing?.minBill != null ? String(existing.minBill) : '')
    setPerCustomer(String(existing?.perCustomerLimit ?? 1))
    setExpires(existing?.expiresAt?.slice(0, 10) ?? '')
  }, [coupon, existing])

  const pending = createCoupon.isPending || updateCoupon.isPending

  function submit() {
    const values: CouponFormValues = {
      code,
      discountType: type,
      value: Number(value),
      maxDiscount: type === 'percent' ? num(maxOff) : null,
      minBill: num(minBill),
      perCustomerLimit: Math.max(1, Number(perCustomer) || 1),
      usageLimit: existing?.usageLimit ?? null,
      expiresAt: expires || null,
      active: existing?.active ?? true,
    }
    const done = {
      onSuccess: () => {
        toast.success(existing ? 'Coupon updated' : `${code.toUpperCase()} is live`)
        onClose()
      },
      onError: (err: unknown) => toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic),
    }
    if (existing) updateCoupon.mutate({ id: existing.id, values }, done)
    else createCoupon.mutate(values, done)
  }

  return (
    <Dialog open={coupon !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit coupon' : 'New coupon'}</DialogTitle>
          <DialogDescription>Customers enter or tap this code in their cart.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="c-code">Code</Label>
            <Input
              id="c-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20))}
              placeholder="WELCOME20"
              className="font-mono font-bold tracking-wider"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Discount</Label>
            <div className="flex items-center gap-2">
              <TypeToggle value={type} onChange={setType} />
              <Input inputMode="decimal" value={value} onChange={(e) => setValue(digits(e.target.value))} placeholder={type === 'percent' ? '20' : '50'} className="min-w-0 flex-1" aria-label="Discount" />
              {type === 'percent' && (
                <Input inputMode="decimal" value={maxOff} onChange={(e) => setMaxOff(digits(e.target.value))} placeholder="Max ₹" className="w-24" aria-label="Maximum discount" />
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MoneyField label="Min bill (optional)" value={minBill} onChange={setMinBill} />
            <div className="space-y-1.5">
              <Label htmlFor="c-uses">Uses per customer</Label>
              <Input id="c-uses" inputMode="numeric" value={perCustomer} onChange={(e) => setPerCustomer(e.target.value.replace(/\D/g, '').slice(0, 3))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-exp">Valid till (optional)</Label>
            <Input id="c-exp" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
          </div>
          {Number(value) > 0 && (
            <p className="flex items-center gap-1.5 rounded-xl bg-offer-soft px-3 py-2 text-small text-offer">
              <BadgePercent className="size-4" aria-hidden />
              {ruleLabel({ type, value: Number(value), max_off: type === 'percent' ? num(maxOff) : null })}
              {Number(minBill) > 0 && ` on bills above ₹${minBill}`}
            </p>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} isLoading={pending} disabled={code.length < 3 || !(Number(value) > 0)}>
            {existing ? 'Save' : 'Create coupon'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
