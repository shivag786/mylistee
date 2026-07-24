import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Utensils } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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
  PROMOTION_STATUS_TONE,
  type Promotion,
  type PromotionFormValues,
  type PromotionTypeKey,
} from '../promotionTypes'
import type { Product } from '../productTypes'

interface PromotionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  promotion: Promotion | null
  /** When launched as a product "Smart Offer", the target product is fixed. */
  presetProductId?: string | null
  presetProductName?: string | null
  /** Full target product — shown as a details header at the top of the form. */
  product?: Product | null
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
  product,
}: PromotionFormProps) {
  const { create, update } = usePromotionActions()
  const isEdit = promotion !== null
  const targetProductId = product?.id ?? presetProductId ?? promotion?.productId ?? null
  const targetProductName = product?.name ?? presetProductName ?? promotion?.productName ?? null

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

  // Split the datetime into separate, easy-to-read date + time fields. A schedule
  // needs a date; the time defaults sensibly (start of day / end of day) so the
  // owner can pick just a date and be done.
  const startDate = form.startsAt.slice(0, 10)
  const startTime = form.startsAt.slice(11, 16)
  const endDate = form.endsAt.slice(0, 10)
  const endTime = form.endsAt.slice(11, 16)

  function setStart(date: string, time: string) {
    set('startsAt', date ? `${date}T${time || '00:00'}` : '')
  }
  function setEnd(date: string, time: string) {
    set('endsAt', date ? `${date}T${time || '23:59'}` : '')
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
      product_id: targetProductId,
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
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle>{isEdit ? 'Edit promotion' : 'New promotion'}</SheetTitle>
          <SheetDescription>
            {targetProductName
              ? `Offer for ${targetProductName}`
              : 'Runs automatically on the schedule you set.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {/* Item details — so the owner always sees which product this offer is for. */}
          {(product || targetProductName) && (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-muted/50 p-3">
              <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-muted">
                {product?.imageUrl ? (
                  <img src={product.imageUrl} alt="" className="size-full object-cover" />
                ) : (
                  <Utensils className="size-6 text-text-muted" aria-hidden />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-caption font-semibold text-foreground">
                  {targetProductName ?? 'This product'}
                </p>
                {product && (
                  <p className="flex items-baseline gap-1.5 text-small text-text-muted">
                    <span className="font-semibold text-foreground">₹{product.effectivePrice ?? product.sellingPrice}</span>
                    {product.mrp != null && product.mrp > product.sellingPrice && (
                      <span className="line-through">₹{product.mrp}</span>
                    )}
                  </p>
                )}
              </div>
              {isEdit && promotion && (
                <Badge tone={PROMOTION_STATUS_TONE[promotion.status]} className="capitalize">
                  {promotion.status}
                </Badge>
              )}
            </div>
          )}
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

          {/* Schedule — separate date + time fields so the whole window is easy to
              read and set, even on wide laptop screens. */}
          <fieldset className="space-y-4 rounded-2xl border border-border bg-surface-muted/40 p-4">
            <legend className="px-1 text-caption font-medium text-foreground">
              Schedule <span className="font-normal text-text-muted">(optional)</span>
            </legend>

            <div className="space-y-1.5">
              <span className="text-small font-semibold uppercase tracking-wide text-text-muted">Starts</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="promo-start-date">Start date</Label>
                  <Input
                    id="promo-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStart(e.target.value, startTime)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="promo-start-time">Start time</Label>
                  <Input
                    id="promo-start-time"
                    type="time"
                    value={startTime}
                    disabled={!startDate}
                    onChange={(e) => setStart(startDate, e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-small font-semibold uppercase tracking-wide text-text-muted">Ends</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="promo-end-date">End date</Label>
                  <Input
                    id="promo-end-date"
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => setEnd(e.target.value, endTime)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="promo-end-time">End time</Label>
                  <Input
                    id="promo-end-time"
                    type="time"
                    value={endTime}
                    disabled={!endDate}
                    onChange={(e) => setEnd(endDate, e.target.value)}
                  />
                </div>
              </div>
            </div>
          </fieldset>

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
