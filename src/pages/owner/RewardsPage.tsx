import { useEffect, useState, type ReactNode } from 'react'
import { Award, BadgePercent, Gift, Info, Plus, Receipt, RotateCcw, Ticket, Trash2 } from 'lucide-react'
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
import { useOwnerRewards, useRewardActions } from '@/features/rewards/useRewards'
import { ordinal, ruleLabel } from '@/features/rewards/format'
import type {
  CouponFormValues,
  DiscountType,
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
  const [loyalty, setLoyalty] = useState(() => draftFrom(data.loyalty, { value: '100' }))

  useEffect(() => {
    setBill(draftFrom(data.billDiscount, { minBill: '499', value: '50' }))
    setComeback(draftFrom(data.comeback, { type: 'percent', value: '10' }))
    setLoyalty(draftFrom(data.loyalty, { value: '100' }))
  }, [data.billDiscount, data.comeback, data.loyalty])

  const base = (d: RuleDraft) => ({
    type: d.type,
    value: Number(d.value) || 0,
    max_off: d.type === 'percent' ? num(d.maxOff) : null,
  })

  function save() {
    for (const [name, d] of [['Bill discount', bill], ['Come-back offer', comeback], ['Loyalty reward', loyalty]] as const) {
      if (d.on && !(Number(d.value) > 0)) return toast.error(`${name}: enter the discount amount.`)
      if (d.on && d.type === 'percent' && Number(d.value) > 90) return toast.error(`${name}: keep it at 90% or less.`)
    }
    saveRules.mutate(
      {
        billDiscount: bill.on ? { ...base(bill), min_bill: Number(bill.minBill) || 0 } : null,
        comeback: comeback.on ? { ...base(comeback), min_bill: num(comeback.minBill), days: Number(comeback.days) || 15 } : null,
        loyalty: loyalty.on ? { ...base(loyalty), every: Math.max(2, Number(loyalty.every) || 5) } : null,
      },
      {
        onSuccess: () => toast.success('Rewards saved — customers see them now'),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic),
      },
    )
  }

  const preview = [
    bill.on && Number(bill.value) > 0 && `${ruleLabel(base(bill))} on bills above ₹${Number(bill.minBill) || 0}`,
    loyalty.on && Number(loyalty.value) > 0 && `Every ${ordinal(Number(loyalty.every) || 5)} order: ${ruleLabel(base(loyalty))}`,
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

      <RuleCard
        icon={<Award className="size-5" />}
        title="Loyalty reward"
        hint="Every Nth paid order unlocks a reward. Customers see their progress as stamps."
        draft={loyalty}
        onChange={setLoyalty}
      >
        <div className="space-y-1.5">
          <Label>Reward on every</Label>
          <div className="flex flex-wrap gap-2">
            {['3', '5', '7', '10'].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setLoyalty({ ...loyalty, every: n })}
                aria-pressed={loyalty.every === n}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-caption font-semibold',
                  loyalty.every === n ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface',
                )}
              >
                {ordinal(Number(n))} order
              </button>
            ))}
          </div>
          <Stamps every={Number(loyalty.every) || 5} />
        </div>
      </RuleCard>

      <CouponsCard coupons={data.coupons} />

      <Card padding="md" className="flex items-start gap-3 bg-surface-muted">
        <Info className="mt-0.5 size-5 shrink-0 text-info" aria-hidden />
        <p className="text-small text-text-secondary">
          <span className="font-semibold text-foreground">Listee fee:</span> {data.fees.platformPercent}% on every order, plus{' '}
          {data.fees.gatewayPercent}% payment charges on online payments. Customers pay the same price online or in cash — your
          earning per item shows on each product card.
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

/** The loyalty card as customers see it: N stamps, the last one is the gift. */
function Stamps({ every }: { every: number }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5" aria-hidden>
      {Array.from({ length: Math.min(every, 12) }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'grid size-8 place-items-center rounded-full border-2 border-dashed text-[10px] font-bold',
            i === every - 1 ? 'border-premium bg-gold-soft text-premium-foreground' : 'border-border text-text-muted',
          )}
        >
          {i === every - 1 ? <Gift className="size-4" /> : i + 1}
        </span>
      ))}
    </div>
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
