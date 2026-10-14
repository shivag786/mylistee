import { useEffect, useState } from 'react'
import { Tag, Timer, Utensils, ChevronRight } from 'lucide-react'
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
import { usePromotionActions } from '../hooks/usePromotions'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'
import { cn } from '@/utils/cn'
import type { Product } from '../productTypes'

type Kind = 'percentage' | 'flat'
interface Discount {
  kind: Kind
  value: number
}

const DURATIONS = [
  { value: 'today', label: 'Till tonight' },
  { value: '3d', label: '3 days' },
  { value: '7d', label: '7 days' },
  { value: 'always', label: 'Always' },
] as const
type Duration = (typeof DURATIONS)[number]['value']

/** The end time a duration chip stands for (ISO), or null for no end. */
function endFor(duration: Duration): string | null {
  const now = new Date()
  if (duration === 'always') return null
  if (duration === 'today') {
    const end = new Date(now)
    end.setHours(23, 59, 59, 0)
    return end.toISOString()
  }
  return new Date(now.getTime() + Number(duration.replace('d', '')) * 86_400_000).toISOString()
}

/** Discount chips that make sense for this price — flat amounts only when they leave something to pay. */
function presets(price: number): Discount[] {
  const flats = [10, 20, 50].filter((v) => v < price * 0.6)
  return [
    { kind: 'percentage', value: 10 },
    { kind: 'percentage', value: 20 },
    { kind: 'percentage', value: 30 },
    ...flats.slice(0, 2).map((value) => ({ kind: 'flat' as const, value })),
  ]
}

const label = (d: Discount) => (d.kind === 'percentage' ? `${d.value}% off` : `₹${d.value} off`)

function priceAfter(price: number, d: Discount): number {
  const off = d.kind === 'percentage' ? (price * d.value) / 100 : d.value
  return Math.max(0, Math.round(price - off))
}

interface QuickOfferSheetProps {
  product: Product | null
  onOpenChange: (open: boolean) => void
  /** Opens the full offer form (happy hour, Buy X Get Y, …). */
  onAdvanced: (product: Product) => void
}

/**
 * "Add offer" in three taps: how much off, for how long, save. Creates the same
 * promotion the full Grow-sales form would, with a live price preview so the
 * owner sees exactly what customers will.
 */
export function QuickOfferSheet({ product, onOpenChange, onAdvanced }: QuickOfferSheetProps) {
  const { create } = usePromotionActions()
  const [discount, setDiscount] = useState<Discount | null>(null)
  const [custom, setCustom] = useState('')
  const [customKind, setCustomKind] = useState<Kind>('percentage')
  const [duration, setDuration] = useState<Duration>('3d')

  useEffect(() => {
    if (!product) return
    setDiscount({ kind: 'percentage', value: 10 })
    setCustom('')
    setCustomKind('percentage')
    setDuration('3d')
  }, [product])

  const price = product?.sellingPrice ?? 0
  const customValue = Number(custom)
  const chosen: Discount | null = custom ? (customValue > 0 ? { kind: customKind, value: customValue } : null) : discount
  const valid =
    chosen !== null && (chosen.kind === 'percentage' ? chosen.value < 100 : chosen.value < price)
  const after = chosen ? priceAfter(price, chosen) : price

  async function save() {
    if (!product || !chosen || !valid) return
    try {
      await create.mutateAsync({
        promotion_type: chosen.kind,
        name: `${label(chosen)} on ${product.name}`,
        product_id: product.id,
        discount_type: chosen.kind,
        value: chosen.value,
        ends_at: endFor(duration),
        auto_start: true,
        auto_stop: true,
      })
      toast.success('Offer is live', `${product.name} now shows ₹${after}`)
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic)
    }
  }

  return (
    <Sheet open={product !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="inline-flex items-center gap-2">
            <Tag className="size-5 text-primary" aria-hidden /> Add offer
          </SheetTitle>
          <SheetDescription>Pick a discount and how long it runs.</SheetDescription>
        </SheetHeader>

        {product && (
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            {/* Live preview — what customers will see */}
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-soft">
              <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-muted">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt="" className="size-full object-cover" />
                ) : (
                  <Utensils className="size-5 text-text-muted" aria-hidden />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-caption font-semibold text-foreground">{product.name}</p>
                <p className="flex items-baseline gap-2">
                  <span className="text-subtitle font-black text-success">₹{after}</span>
                  {after < price && <span className="text-caption text-text-muted line-through">₹{price}</span>}
                </p>
              </div>
              {chosen && valid && (
                <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-small font-bold text-primary-foreground">
                  {label(chosen).toUpperCase()}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label>How much off?</Label>
              <div className="flex flex-wrap gap-2">
                {presets(price).map((d) => (
                  <Chip
                    key={label(d)}
                    active={!custom && discount?.kind === d.kind && discount.value === d.value}
                    onClick={() => {
                      setCustom('')
                      setDiscount(d)
                    }}
                  >
                    {label(d)}
                  </Chip>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  inputMode="decimal"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value.replace(/[^\d.]/g, ''))}
                  placeholder="Other amount"
                  className="flex-1"
                  aria-label="Custom discount"
                />
                <div className="flex rounded-full bg-surface-muted p-0.5">
                  {(['percentage', 'flat'] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setCustomKind(k)}
                      className={cn(
                        'rounded-full px-3 py-1 text-small font-semibold',
                        customKind === k ? 'bg-surface text-foreground shadow-soft' : 'text-text-muted',
                      )}
                    >
                      {k === 'percentage' ? '%' : '₹'}
                    </button>
                  ))}
                </div>
              </div>
              {chosen && !valid && <p className="text-small text-destructive">That’s more than the price.</p>}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Timer className="size-4" aria-hidden /> For how long?
              </Label>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((d) => (
                  <Chip key={d.value} active={duration === d.value} onClick={() => setDuration(d.value)}>
                    {d.label}
                  </Chip>
                ))}
              </div>
              <p className="text-small text-text-muted">
                {duration === 'always'
                  ? 'Runs until you turn it off.'
                  : 'Customers see a countdown on the deal, and it ends on its own.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onAdvanced(product)}
              className="flex w-full items-center justify-between rounded-xl bg-surface-muted px-3 py-2.5 text-left text-caption text-text-secondary hover:text-foreground"
            >
              Happy hour, Buy 1 Get 1, festival…
              <span className="inline-flex items-center gap-0.5 font-medium text-primary">
                Advanced <ChevronRight className="size-4" aria-hidden />
              </span>
            </button>
          </div>
        )}

        <SheetFooter className="border-t border-border px-5 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Cancel
          </Button>
          <Button onClick={() => void save()} isLoading={create.isPending} disabled={!valid}>
            Start offer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full px-3.5 py-1.5 text-caption font-semibold transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'bg-surface-muted text-text-secondary hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
