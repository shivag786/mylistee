import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { useCreatePlan } from '@/features/admin/hooks/useAdmin'
import { FEATURE_LABELS } from '@/features/owner/planDisplay'

const ALL_FEATURES = Object.keys(FEATURE_LABELS)

const LIMIT_FIELDS = [
  { key: 'maxActiveOffers', label: 'Max active offers' },
  { key: 'maxActiveCombos', label: 'Max active combos' },
  { key: 'maxActivePromotions', label: 'Max active promotions' },
  { key: 'maxPushPerMonth', label: 'Push / month' },
  { key: 'maxOfferDays', label: 'Max offer days' },
  { key: 'maxQrCodes', label: 'Max QR codes' },
  { key: 'maxGalleryImages', label: 'Max gallery images' },
] as const

type LimitKey = (typeof LIMIT_FIELDS)[number]['key']

interface PlanCreateSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingKeys: string[]
}

const EMPTY = {
  key: '',
  name: '',
  description: '',
  price: '0',
  interval: 'month',
  badge: '',
}

/** Create a new subscription plan from the admin panel (SPEC: plans are data). */
export function PlanCreateSheet({ open, onOpenChange, existingKeys }: PlanCreateSheetProps) {
  const create = useCreatePlan()
  const [form, setForm] = useState({ ...EMPTY })
  const [limits, setLimits] = useState<Record<LimitKey, string>>({} as Record<LimitKey, string>)
  const [features, setFeatures] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY })
      setLimits({} as Record<LimitKey, string>)
      setFeatures([])
      setError(null)
    }
  }, [open])

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function toggleFeature(key: string, on: boolean) {
    setFeatures((f) => (on ? [...new Set([...f, key])] : f.filter((x) => x !== key)))
  }

  async function handleSave() {
    const key = form.key.trim().toLowerCase()
    if (!/^[a-z0-9_-]+$/.test(key)) {
      setError('Key must be lowercase letters, numbers, - or _.')
      return
    }
    if (existingKeys.includes(key)) {
      setError('That key already exists. Choose a unique key.')
      return
    }
    if (!form.name.trim()) {
      setError('Name is required.')
      return
    }

    // Empty limit input = unlimited (null).
    const limitPayload: Record<string, number | null> = {}
    for (const { key: k } of LIMIT_FIELDS) {
      const raw = limits[k]
      limitPayload[k] = raw == null || raw === '' ? null : Math.max(0, Number(raw))
    }

    try {
      await create.mutateAsync({
        key,
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: Number(form.price) || 0,
        interval: form.interval,
        badge: form.badge.trim() || null,
        features,
        ...limitPayload,
      })
      toast.success(`${form.name.trim()} created`)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create plan.')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle>New plan</SheetTitle>
          <SheetDescription>Empty limit = unlimited.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-key">Key</Label>
              <Input id="p-key" value={form.key} onChange={(e) => set('key', e.target.value)} placeholder="growth" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Name</Label>
              <Input id="p-name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Growth" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-desc">Description</Label>
            <Textarea id="p-desc" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-price">Price (₹)</Label>
              <Input id="p-price" type="number" value={form.price} onChange={(e) => set('price', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-interval">Billing</Label>
              <Select value={form.interval} onValueChange={(v) => set('interval', v)}>
                <SelectTrigger id="p-interval" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="quarter">Quarterly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-badge">Badge</Label>
              <Input id="p-badge" value={form.badge} onChange={(e) => set('badge', e.target.value)} placeholder="Popular" />
            </div>
          </div>

          <div>
            <p className="mb-2 text-caption font-medium text-foreground">Limits</p>
            <div className="grid grid-cols-2 gap-3">
              {LIMIT_FIELDS.map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <Label className="text-small">{label}</Label>
                  <Input
                    type="number"
                    placeholder="∞"
                    value={limits[key] ?? ''}
                    onChange={(e) => setLimits((l) => ({ ...l, [key]: e.target.value }))}
                    className="h-11"
                  />
                </div>
              ))}
            </div>
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

          {error && <p className="text-caption text-destructive">{error}</p>}
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} isLoading={create.isPending}>
            Create plan
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
