import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { toast } from '@/utils/toast'
import { useAdminPlans, useUpdatePlan } from '@/features/admin/hooks/useAdmin'
import { FEATURE_LABELS, PLAN_MODULES, daysLabel, formatPrice, planPeriod } from '@/features/owner/planDisplay'
import { DurationInput } from '@/features/admin/components/PlanDurationInput'
import { durationPayload, type DurationUnit } from '@/features/admin/planDuration'
import { PlanCreateSheet } from '@/features/admin/components/PlanCreateSheet'
import type { Plan } from '@/features/admin/types'
import type { PlanModuleConfig } from '@/features/owner/types'

const ALL_FEATURES = Object.keys(FEATURE_LABELS)

export function AdminPlansPage() {
  const { data, isLoading, isError, refetch } = useAdminPlans()
  const [creating, setCreating] = useState(false)

  if (isLoading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Spinner size={32} label="Loading plans" />
      </div>
    )
  }
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-title font-bold text-foreground">Plans</h1>
          <p className="text-caption text-text-secondary">
            Price, how long it lasts, what each plan includes, limits and a first-time offer. Switching a plan off
            hides it from shops; shops already on it keep it until their period ends.
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
          New plan
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {data.map((plan) => (
          <PlanEditor key={plan.key} plan={plan} />
        ))}
      </div>

      <PlanCreateSheet open={creating} onOpenChange={setCreating} existingKeys={data.map((p) => p.key)} />
    </div>
  )
}

function PlanEditor({ plan }: { plan: Plan }) {
  const update = useUpdatePlan()
  const [name, setName] = useState(plan.name)
  const [price, setPrice] = useState(String(plan.price))
  const [duration, setDuration] = useState(numStr(plan.durationMonths ?? plan.durationDays ?? null))
  const [durationUnit, setDurationUnit] = useState<DurationUnit>(plan.durationMonths ? 'months' : 'days')
  const [isActive, setIsActive] = useState(plan.isActive ?? true)
  const [customerDetails, setCustomerDetails] = useState<'full' | 'masked'>(plan.customerDetails ?? 'masked')
  const [limits, setLimits] = useState({
    maxProducts: plan.limits.maxProducts ?? null,
    maxActiveOffers: plan.limits.maxActiveOffers,
    maxActiveCombos: plan.limits.maxActiveCombos,
    maxActivePromotions: plan.limits.maxActivePromotions,
    maxPushPerMonth: plan.limits.maxPushPerMonth,
    pushReachPerMonth: plan.limits.pushReachPerMonth ?? null,
    pushPerCustomerPerMonth: plan.limits.pushPerCustomerPerMonth ?? null,
    whatsappPerMonth: plan.limits.whatsappPerMonth ?? null,
    maxOfferDays: plan.limits.maxOfferDays,
    maxQrCodes: plan.limits.maxQrCodes,
    maxGalleryImages: plan.limits.maxGalleryImages,
  })
  const [modules, setModules] = useState<Record<string, PlanModuleConfig>>(() =>
    Object.fromEntries(PLAN_MODULES.map((m) => [m.id, plan.modules?.[m.id] ?? { on: true, days: null }])),
  )
  const [introOn, setIntroOn] = useState(Boolean(plan.intro))
  const [intro, setIntro] = useState({
    price: plan.intro ? String(plan.intro.price) : '',
    days: plan.intro ? String(plan.intro.days) : '',
    endsAt: plan.intro?.endsAt ? plan.intro.endsAt.slice(0, 10) : '',
    label: plan.intro?.label ?? '',
  })
  const [features, setFeatures] = useState<string[]>(plan.features)
  const [showFeatures, setShowFeatures] = useState(false)

  function setLimit(key: keyof typeof limits, raw: string) {
    setLimits((l) => ({ ...l, [key]: raw === '' ? null : Math.max(0, Number(raw)) }))
  }

  function setModule(id: string, patch: Partial<PlanModuleConfig>) {
    setModules((m) => ({ ...m, [id]: { ...m[id], ...patch } }))
  }

  function toggleFeature(key: string, on: boolean) {
    setFeatures((f) => (on ? [...new Set([...f, key])] : f.filter((x) => x !== key)))
  }

  function toggleActive(on: boolean) {
    setIsActive(on)
    update.mutate(
      { key: plan.key, payload: { isActive: on } },
      {
        onSuccess: () => toast.success(on ? `${plan.name} is active` : `${plan.name} is off — shops on it keep it till their period ends`),
        onError: (err) => {
          setIsActive(!on)
          toast.error(err instanceof Error ? err.message : 'Could not change the plan.')
        },
      },
    )
  }

  function save() {
    if (introOn && (intro.price === '' || !(Number(intro.price) >= 0) || !(Number(intro.days) > 0))) {
      toast.error('Give the first-time offer a price and a number of days.')
      return
    }
    const payload = {
      name,
      price: Number(price),
      ...durationPayload(duration, durationUnit),
      ...limits,
      pushPerCustomerPerMonth: limits.pushPerCustomerPerMonth === null ? null : Math.max(1, limits.pushPerCustomerPerMonth),
      customerDetails,
      modules,
      introPrice: introOn ? Number(intro.price) : null,
      introDays: introOn ? Number(intro.days) : null,
      // The end of the chosen day, in the admin's time zone.
      introEndsAt: introOn && intro.endsAt ? new Date(`${intro.endsAt}T23:59:59`).toISOString() : null,
      introLabel: introOn ? intro.label.trim() || null : null,
      features,
    }
    update.mutate(
      { key: plan.key, payload },
      {
        onSuccess: () => toast.success(`${name} saved`),
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save plan.'),
      },
    )
  }

  const groups = [...new Set(PLAN_MODULES.map((m) => m.group))]
  const free = Number(price) === 0

  return (
    <Card elevation="soft" className={`space-y-5 ${isActive ? '' : 'opacity-75'}`} padding="md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 className="text-body-lg font-semibold text-foreground">{plan.name}</h2>
          {plan.isDefault && <Badge tone="neutral" size="sm">Default</Badge>}
          {plan.badge && <Badge tone="premium" size="sm">{plan.badge}</Badge>}
          {!isActive && <Badge tone="warning" size="sm">Inactive</Badge>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <code className="text-small text-text-muted">{plan.key}</code>
          <label className="flex items-center gap-1.5 text-small font-medium text-foreground">
            <Switch
              checked={isActive}
              onCheckedChange={toggleActive}
              disabled={plan.isDefault || update.isPending}
              aria-label={`${plan.name} active`}
            />
            {isActive ? 'Active' : 'Off'}
          </label>
        </div>
      </div>
      {plan.isDefault && (
        <p className="-mt-3 text-small text-text-muted">The default plan is always active — every shop without a plan uses it.</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <LabeledInput label="Name" value={name} onChange={setName} />
        <LabeledInput label={`Price (${plan.currency})`} value={price} onChange={setPrice} type="number" />
        <div className="col-span-2">
          <DurationInput
            label={free ? 'Free for how long' : 'Plan lasts'}
            value={duration}
            unit={durationUnit}
            onChange={setDuration}
            onUnitChange={setDurationUnit}
            placeholder={free ? 'Empty = free forever' : `Empty = by interval (${plan.interval})`}
          />
          <p className="mt-1 text-small text-text-muted">
            {free
              ? 'After this the shop stays visible (menu, QR, link) but every module below locks until they buy a plan. For shops already signed up, it counts from today.'
              : 'How long one payment lasts. Renewing early adds on to the time left. Shops that already bought keep the end date they paid for.'}
          </p>
        </div>
      </div>

      {!free && (
        <section className="space-y-3 rounded-xl border border-border p-3">
          <label className="flex items-center justify-between gap-3">
            <span>
              <span className="block text-caption font-semibold text-foreground">First-time offer</span>
              <span className="block text-small text-text-muted">
                A lower price for a shop&rsquo;s first purchase, e.g. ₹149 for 90 days. Once per owner.
              </span>
            </span>
            <Switch checked={introOn} onCheckedChange={setIntroOn} aria-label="First-time offer" />
          </label>
          {introOn && (
            <div className="grid grid-cols-2 gap-3">
              <LabeledInput label={`Offer price (${plan.currency})`} value={intro.price} onChange={(v) => setIntro((i) => ({ ...i, price: v }))} type="number" placeholder="149" />
              <LabeledInput label="For how many days" value={intro.days} onChange={(v) => setIntro((i) => ({ ...i, days: v }))} type="number" placeholder="90" />
              <LabeledInput label="Offer open until" value={intro.endsAt} onChange={(v) => setIntro((i) => ({ ...i, endsAt: v }))} type="date" />
              <LabeledInput label="Badge text" value={intro.label} onChange={(v) => setIntro((i) => ({ ...i, label: v }))} placeholder="First time only" />
              {intro.price !== '' && Number(price) > 0 && Number(intro.days) > 0 && (
                <p className="col-span-2 rounded-lg bg-success-soft px-3 py-2 text-small text-foreground">
                  Shops see <b>₹{intro.price}</b> for {daysLabel(Number(intro.days))}, then{' '}
                  {formatPrice(Number(price), plan.currency)}
                  {planPeriod({ ...durationPayload(duration, durationUnit), interval: plan.interval })}.
                  {intro.endsAt
                    ? ` Offer ends ${new Date(intro.endsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}.`
                    : ' No end date.'}
                </p>
              )}
            </div>
          )}
        </section>
      )}

      <section className="space-y-3">
        <div>
          <p className="text-caption font-semibold text-foreground">What this plan includes</p>
          <p className="text-small text-text-muted">
            Switch a module on, and give it days to make it a trial (empty = the whole plan). Profile, menu, QR and
            personal link are always on.
          </p>
        </div>
        {groups.map((group) => (
          <div key={group} className="space-y-1.5">
            <p className="text-small font-semibold uppercase tracking-wide text-text-muted">{group}</p>
            <div className="divide-y divide-border rounded-xl border border-border">
              {PLAN_MODULES.filter((m) => m.group === group).map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-3 py-2">
                  <Switch checked={modules[m.id].on} onCheckedChange={(on) => setModule(m.id, { on })} aria-label={m.label} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-caption font-medium text-foreground">{m.label}</span>
                    <span className="block truncate text-small text-text-muted">{m.description}</span>
                  </span>
                  {modules[m.id].on && (
                    <Input
                      value={numStr(modules[m.id].days)}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '')
                        setModule(m.id, { days: digits === '' ? null : Math.max(1, Number(digits)) })
                      }}
                      inputMode="numeric"
                      placeholder="All days"
                      aria-label={`${m.label} days`}
                      className="h-9 w-24 shrink-0 text-small"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <p className="text-caption font-semibold text-foreground">
          Limits <span className="font-normal text-text-muted">(empty = unlimited)</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <LabeledInput label="Max products" value={numStr(limits.maxProducts)} onChange={(v) => setLimit('maxProducts', v)} type="number" placeholder="∞" />
          <LabeledInput label="Max active offers" value={numStr(limits.maxActiveOffers)} onChange={(v) => setLimit('maxActiveOffers', v)} type="number" placeholder="∞" />
          <LabeledInput label="Max active combos" value={numStr(limits.maxActiveCombos)} onChange={(v) => setLimit('maxActiveCombos', v)} type="number" placeholder="∞" />
          <LabeledInput label="Max active promotions" value={numStr(limits.maxActivePromotions)} onChange={(v) => setLimit('maxActivePromotions', v)} type="number" placeholder="∞" />
          <LabeledInput label="Notifications / month" value={numStr(limits.maxPushPerMonth)} onChange={(v) => setLimit('maxPushPerMonth', v)} type="number" placeholder="∞" />
          <LabeledInput label="Customers reached / month" value={numStr(limits.pushReachPerMonth)} onChange={(v) => setLimit('pushReachPerMonth', v)} type="number" placeholder="∞" />
          <LabeledInput label="Notifications to one customer / month" value={numStr(limits.pushPerCustomerPerMonth)} onChange={(v) => setLimit('pushPerCustomerPerMonth', v)} type="number" placeholder="∞" />
          <LabeledInput label="WhatsApp messages / month" value={numStr(limits.whatsappPerMonth)} onChange={(v) => setLimit('whatsappPerMonth', v)} type="number" placeholder="∞" />
          <div className="space-y-1">
            <Label className="text-small">Customer details shops see</Label>
            <Select value={customerDetails} onValueChange={(v) => setCustomerDetails(v as 'full' | 'masked')}>
              <SelectTrigger className="h-11 w-full" aria-label="Customer details shops see">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="masked">Masked (ra***@gmail.com, 98******10)</SelectItem>
                <SelectItem value="full">Full email and phone</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <LabeledInput label="Max offer days" value={numStr(limits.maxOfferDays)} onChange={(v) => setLimit('maxOfferDays', v)} type="number" placeholder="∞" />
          <LabeledInput label="Max QR codes" value={numStr(limits.maxQrCodes)} onChange={(v) => setLimit('maxQrCodes', v)} type="number" placeholder="∞" />
          <LabeledInput label="Max gallery images" value={numStr(limits.maxGalleryImages)} onChange={(v) => setLimit('maxGalleryImages', v)} type="number" placeholder="∞" />
        </div>
      </section>

      <div>
        <button type="button" onClick={() => setShowFeatures((v) => !v)} className="text-small font-semibold text-primary hover:underline">
          {showFeatures ? 'Hide' : 'Show'} extra lines on the plan card
        </button>
        {showFeatures && (
          <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {ALL_FEATURES.map((key) => (
              <label key={key} className="flex items-center gap-2 text-small text-foreground">
                <Checkbox checked={features.includes(key)} onCheckedChange={(v) => toggleFeature(key, v === true)} />
                {FEATURE_LABELS[key]}
              </label>
            ))}
          </div>
        )}
      </div>

      <Button size="sm" onClick={save} isLoading={update.isPending}>
        Save {plan.name}
      </Button>
    </Card>
  )
}

function numStr(n: number | null | undefined): string {
  return n == null ? '' : String(n)
}

function LabeledInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div className="space-y-1">
      <Label className="text-small">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} type={type} placeholder={placeholder} className="h-11" />
    </div>
  )
}
