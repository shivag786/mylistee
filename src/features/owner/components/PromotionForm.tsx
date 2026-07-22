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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePromotionActions } from '../hooks/usePromotions'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'
import {
  PROMOTION_TYPES,
  type Promotion,
  type PromotionFormValues,
  type PromotionTypeKey,
} from '../promotionTypes'

interface PromotionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  promotion: Promotion | null
  /** When launched as a product "Smart Offer", the target product is fixed. */
  presetProductId?: string | null
  presetProductName?: string | null
}

interface State {
  type: PromotionTypeKey
  name: string
  discountType: 'percentage' | 'flat'
  value: string
  buyQty: string
  getQty: string
  minQty: string
  startsAt: string
  endsAt: string
  dailyStart: string
  dailyEnd: string
  priority: string
  autoStart: boolean
  autoStop: boolean
}

function initial(promotion: Promotion | null): State {
  return {
    type: promotion?.type ?? 'percentage',
    name: promotion?.name ?? '',
    discountType: promotion?.discountType ?? 'percentage',
    value: promotion?.value != null ? String(promotion.value) : '',
    buyQty: promotion?.buyQty != null ? String(promotion.buyQty) : '1',
    getQty: promotion?.getQty != null ? String(promotion.getQty) : '1',
    minQty: promotion?.minQty != null ? String(promotion.minQty) : '2',
    startsAt: promotion?.startsAt ? promotion.startsAt.slice(0, 16) : '',
    endsAt: promotion?.endsAt ? promotion.endsAt.slice(0, 16) : '',
    dailyStart: promotion?.dailyStartTime?.slice(0, 5) ?? '',
    dailyEnd: promotion?.dailyEndTime?.slice(0, 5) ?? '',
    priority: promotion?.priority != null ? String(promotion.priority) : '0',
    autoStart: promotion?.autoStart ?? true,
    autoStop: promotion?.autoStop ?? true,
  }
}

/**
 * Create / edit a promotion (07A). Progressive disclosure — only the fields the
 * chosen type needs are shown. Reused both from Grow Sales and as a product
 * "Smart Offer".
 */
export function PromotionForm({
  open,
  onOpenChange,
  promotion,
  presetProductId,
  presetProductName,
}: PromotionFormProps) {
  const { create, update } = usePromotionActions()
  const isEdit = promotion !== null

  const [form, setForm] = useState<State>(() => initial(promotion))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(initial(promotion))
      setError(null)
    }
  }, [open, promotion])

  function set<K extends keyof State>(key: K, value: State[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const pending = create.isPending || update.isPending
  const t = form.type
  const isBogo = t === 'bogo'
  const isQuantity = t === 'quantity_discount'
  const hasDiscountTypeChoice = ['happy_hour', 'flash_sale', 'weekend', 'festival', 'quantity_discount'].includes(t)
  const needsDailyWindow = t === 'happy_hour'
  const needsValue = !isBogo
  const valueIsPercent = t === 'percentage' || (hasDiscountTypeChoice && form.discountType === 'percentage')

  async function handleSubmit() {
    if (!form.name.trim()) {
      setError('Give this promotion a name.')
      return
    }
    if (needsValue && (!form.value || Number(form.value) <= 0)) {
      setError('Enter a discount value.')
      return
    }

    const values: PromotionFormValues = {
      promotion_type: t,
      name: form.name.trim(),
      product_id: presetProductId ?? promotion?.productId ?? null,
      priority: form.priority ? Number(form.priority) : 0,
      auto_start: form.autoStart,
      auto_stop: form.autoStop,
      starts_at: form.startsAt || null,
      ends_at: form.endsAt || null,
    }

    if (needsValue) {
      values.value = Number(form.value)
      values.discount_type = t === 'flat' ? 'flat' : t === 'percentage' ? 'percentage' : form.discountType
    }
    if (isBogo) {
      values.buy_qty = Number(form.buyQty)
      values.get_qty = Number(form.getQty)
    }
    if (isQuantity) {
      values.min_qty = Number(form.minQty)
    }
    if (needsDailyWindow) {
      values.daily_start_time = form.dailyStart || null
      values.daily_end_time = form.dailyEnd || null
    }

    try {
      if (isEdit) {
        await update.mutateAsync({ id: promotion.id, values })
        toast.success('Promotion updated')
      } else {
        await create.mutateAsync(values)
        toast.success('Promotion created')
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle>{isEdit ? 'Edit promotion' : 'New promotion'}</SheetTitle>
          <SheetDescription>
            {presetProductName
              ? `Smart offer for ${presetProductName}`
              : 'Runs automatically on the schedule you set.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="promo-type">Promotion type</Label>
              <Select value={t} onValueChange={(v) => set('type', v as PromotionTypeKey)}>
                <SelectTrigger id="promo-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROMOTION_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-small text-text-muted">
                {PROMOTION_TYPES.find((o) => o.value === t)?.hint}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="promo-name">Name</Label>
            <Input
              id="promo-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Weekend 20% off"
              aria-invalid={Boolean(error)}
            />
          </div>

          {hasDiscountTypeChoice && (
            <div className="space-y-1.5">
              <Label htmlFor="promo-dtype">Discount type</Label>
              <Select value={form.discountType} onValueChange={(v) => set('discountType', v as 'percentage' | 'flat')}>
                <SelectTrigger id="promo-dtype" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="flat">Flat amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {needsValue && (
            <div className="space-y-1.5">
              <Label htmlFor="promo-value">{valueIsPercent ? 'Discount (%)' : 'Discount amount (₹)'}</Label>
              <Input
                id="promo-value"
                inputMode="decimal"
                value={form.value}
                onChange={(e) => set('value', e.target.value)}
                placeholder={valueIsPercent ? '20' : '50'}
              />
            </div>
          )}

          {isBogo && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="promo-buy">Buy quantity</Label>
                <Input id="promo-buy" inputMode="numeric" value={form.buyQty} onChange={(e) => set('buyQty', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="promo-get">Get free</Label>
                <Input id="promo-get" inputMode="numeric" value={form.getQty} onChange={(e) => set('getQty', e.target.value)} />
              </div>
            </div>
          )}

          {isQuantity && (
            <div className="space-y-1.5">
              <Label htmlFor="promo-min">Minimum quantity</Label>
              <Input id="promo-min" inputMode="numeric" value={form.minQty} onChange={(e) => set('minQty', e.target.value)} />
            </div>
          )}

          {needsDailyWindow && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="promo-dstart">Daily from</Label>
                <Input id="promo-dstart" type="time" value={form.dailyStart} onChange={(e) => set('dailyStart', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="promo-dend">Daily to</Label>
                <Input id="promo-dend" type="time" value={form.dailyEnd} onChange={(e) => set('dailyEnd', e.target.value)} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="promo-start">Starts</Label>
              <Input id="promo-start" type="datetime-local" value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="promo-end">Ends</Label>
              <Input id="promo-end" type="datetime-local" value={form.endsAt} onChange={(e) => set('endsAt', e.target.value)} />
            </div>
          </div>

          <label className="flex items-center justify-between gap-4 py-0.5">
            <span className="space-y-0.5">
              <span className="block text-caption font-medium text-foreground">Start automatically</span>
              <span className="block text-small text-text-muted">Go live at the start time.</span>
            </span>
            <Switch checked={form.autoStart} onCheckedChange={(v) => set('autoStart', v)} />
          </label>
          <label className="flex items-center justify-between gap-4 py-0.5">
            <span className="space-y-0.5">
              <span className="block text-caption font-medium text-foreground">Stop automatically</span>
              <span className="block text-small text-text-muted">End at the end time.</span>
            </span>
            <Switch checked={form.autoStop} onCheckedChange={(v) => set('autoStop', v)} />
          </label>

          {error && <p className="text-caption text-destructive">{error}</p>}
        </div>

        <SheetFooter className="border-t border-border px-5 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} isLoading={pending}>
            {isEdit ? 'Save' : 'Create promotion'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
