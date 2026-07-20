import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { toast } from '@/utils/toast'
import { useAdminPlans, useUpdatePlan } from '@/features/admin/hooks/useAdmin'
import { FEATURE_LABELS } from '@/features/owner/planDisplay'
import type { Plan } from '@/features/admin/types'

const ALL_FEATURES = Object.keys(FEATURE_LABELS)

export function AdminPlansPage() {
  const { data, isLoading, isError, refetch } = useAdminPlans()

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
      <header>
        <h1 className="text-title font-bold text-foreground">Plans</h1>
        <p className="text-caption text-text-secondary">
          Edit limits, pricing and features. Empty limit = unlimited.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {data.map((plan) => (
          <PlanEditor key={plan.key} plan={plan} />
        ))}
      </div>
    </div>
  )
}

function PlanEditor({ plan }: { plan: Plan }) {
  const update = useUpdatePlan()
  const [name, setName] = useState(plan.name)
  const [price, setPrice] = useState(String(plan.price))
  const [limits, setLimits] = useState({
    maxActiveOffers: plan.limits.maxActiveOffers,
    maxOfferDays: plan.limits.maxOfferDays,
    maxQrCodes: plan.limits.maxQrCodes,
    maxGalleryImages: plan.limits.maxGalleryImages,
  })
  const [features, setFeatures] = useState<string[]>(plan.features)

  function setLimit(key: keyof typeof limits, raw: string) {
    setLimits((l) => ({ ...l, [key]: raw === '' ? null : Math.max(0, Number(raw)) }))
  }

  function toggleFeature(key: string, on: boolean) {
    setFeatures((f) => (on ? [...new Set([...f, key])] : f.filter((x) => x !== key)))
  }

  function save() {
    update.mutate(
      { key: plan.key, payload: { name, price: Number(price), ...limits, features } },
      {
        onSuccess: () => toast.success(`${name} saved`),
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save plan.'),
      },
    )
  }

  return (
    <Card elevation="soft" className="space-y-4" padding="md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-body-lg font-semibold text-foreground">{plan.name}</h2>
          {plan.isDefault && <Badge tone="neutral" size="sm">Default</Badge>}
          {plan.badge && <Badge tone="premium" size="sm">{plan.badge}</Badge>}
        </div>
        <code className="text-small text-text-muted">{plan.key}</code>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <LabeledInput label="Name" value={name} onChange={setName} />
        <LabeledInput label={`Price (${plan.currency})`} value={price} onChange={setPrice} type="number" />
        <LabeledInput label="Max active offers" value={numStr(limits.maxActiveOffers)} onChange={(v) => setLimit('maxActiveOffers', v)} type="number" placeholder="∞" />
        <LabeledInput label="Max offer days" value={numStr(limits.maxOfferDays)} onChange={(v) => setLimit('maxOfferDays', v)} type="number" placeholder="∞" />
        <LabeledInput label="Max QR codes" value={numStr(limits.maxQrCodes)} onChange={(v) => setLimit('maxQrCodes', v)} type="number" placeholder="∞" />
        <LabeledInput label="Max gallery images" value={numStr(limits.maxGalleryImages)} onChange={(v) => setLimit('maxGalleryImages', v)} type="number" placeholder="∞" />
      </div>

      <div>
        <p className="mb-2 text-caption font-medium text-foreground">Features</p>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {ALL_FEATURES.map((key) => (
            <label key={key} className="flex items-center gap-2 text-small text-foreground">
              <Checkbox checked={features.includes(key)} onCheckedChange={(v) => toggleFeature(key, v === true)} />
              {FEATURE_LABELS[key]}
            </label>
          ))}
        </div>
      </div>

      <Button size="sm" onClick={save} isLoading={update.isPending}>
        Save {plan.name}
      </Button>
    </Card>
  )
}

function numStr(n: number | null): string {
  return n === null ? '' : String(n)
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
