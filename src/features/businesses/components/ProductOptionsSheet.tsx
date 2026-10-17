import { useEffect, useState } from 'react'
import { Check, Minus, Plus } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import type { CartItem } from '@/features/orders/cartStore'
import type { PublicProduct } from '../publicTypes'

/**
 * A running promotion as a share of the price, so it can be shown on each size.
 * The server prices the order exactly; this only keeps the sheet's total honest.
 */
function promoFactor(product: PublicProduct): number {
  return product.activeOffer && product.effectivePrice != null && product.sellingPrice > 0
    ? product.effectivePrice / product.sellingPrice
    : 1
}

const money = (n: number) => Math.round(n * 100) / 100

/**
 * "Customise" sheet for a product with sizes and/or add-ons: pick one size,
 * tick any add-ons, choose how many, and add — the button shows the total.
 */
export function ProductOptionsSheet({
  product,
  onClose,
  onConfirm,
}: {
  product: PublicProduct | null
  onClose: () => void
  onConfirm: (item: Omit<CartItem, 'quantity'>, quantity: number) => void
}) {
  const [variantId, setVariantId] = useState<string | null>(null)
  const [addonIds, setAddonIds] = useState<string[]>([])
  const [qty, setQty] = useState(1)

  useEffect(() => {
    if (!product) return
    setVariantId(product.variants?.[0]?.id ?? null)
    setAddonIds([])
    setQty(1)
  }, [product])

  const variants = product?.variants ?? []
  const addons = product?.addons ?? []
  const factor = product ? promoFactor(product) : 1
  const variant = variants.find((v) => v.id === variantId) ?? null
  const base = product
    ? variant
      ? money(variant.sellingPrice * factor)
      : (product.effectivePrice ?? product.sellingPrice)
    : 0
  const extras = addons.filter((a) => addonIds.includes(a.id)).reduce((sum, a) => sum + a.price, 0)
  const unit = money(base + extras)

  function confirm() {
    if (!product) return
    const picked = addons.filter((a) => addonIds.includes(a.id))
    onConfirm(
      {
        type: 'product',
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        unitPrice: unit,
        options: {
          variantId: variant?.id ?? null,
          variantName: variant?.name ?? null,
          addonIds: picked.map((a) => a.id),
          addonNames: picked.map((a) => a.name),
        },
      },
      qty,
    )
  }

  return (
    <Sheet open={product !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="mx-auto max-h-[88dvh] w-full max-w-lg gap-0 rounded-t-3xl p-0">
        {product && (
          <div className="flex max-h-[88dvh] flex-col">
            <div className="flex items-center gap-3 border-b border-border px-5 pb-4 pt-5">
              {product.imageUrl && (
                <img src={product.imageUrl} alt="" className="size-16 shrink-0 rounded-2xl object-cover" />
              )}
              <div className="min-w-0">
                <SheetTitle className="line-clamp-2 text-body-lg font-bold">{product.name}</SheetTitle>
                <SheetDescription className="text-small">
                  {variants.length > 0 ? 'Pick a size' : 'Add extras'}
                  {variants.length > 0 && addons.length > 0 && ' and extras'}
                </SheetDescription>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              {variants.length > 0 && (
                <section className="space-y-2">
                  <h4 className="flex items-center justify-between text-caption font-bold text-foreground">
                    Size
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
                      Required
                    </span>
                  </h4>
                  <div role="radiogroup" className="space-y-2">
                    {variants.map((v) => {
                      const active = v.id === variantId
                      const now = money(v.sellingPrice * factor)
                      return (
                        <button
                          key={v.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setVariantId(v.id)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
                            active ? 'border-primary bg-primary-soft' : 'border-border hover:border-border-strong',
                          )}
                        >
                          <span
                            className={cn(
                              'grid size-5 shrink-0 place-items-center rounded-full border-2',
                              active ? 'border-primary' : 'border-border-strong',
                            )}
                          >
                            {active && <span className="size-2.5 rounded-full bg-primary" />}
                          </span>
                          <span className="flex-1 text-body font-medium text-foreground">{v.name}</span>
                          <span className="text-body font-semibold text-foreground">₹{now}</span>
                          {v.price > now && <span className="text-small text-text-muted line-through">₹{v.price}</span>}
                        </button>
                      )
                    })}
                  </div>
                </section>
              )}

              {addons.length > 0 && (
                <section className="space-y-2">
                  <h4 className="flex items-center justify-between text-caption font-bold text-foreground">
                    Add-ons
                    <span className="text-[10px] font-semibold text-text-muted">Choose any</span>
                  </h4>
                  <div className="space-y-2">
                    {addons.map((a) => {
                      const on = addonIds.includes(a.id)
                      return (
                        <button
                          key={a.id}
                          type="button"
                          role="checkbox"
                          aria-checked={on}
                          onClick={() =>
                            setAddonIds((ids) => (on ? ids.filter((x) => x !== a.id) : [...ids, a.id]))
                          }
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
                            on ? 'border-primary bg-primary-soft' : 'border-border hover:border-border-strong',
                          )}
                        >
                          <span
                            className={cn(
                              'grid size-5 shrink-0 place-items-center rounded-md border-2',
                              on ? 'border-primary bg-primary text-primary-foreground' : 'border-border-strong',
                            )}
                          >
                            {on && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
                          </span>
                          <span className="flex-1 text-body font-medium text-foreground">{a.name}</span>
                          <span className="text-body font-semibold text-text-secondary">+₹{a.price}</span>
                        </button>
                      )
                    })}
                  </div>
                </section>
              )}
            </div>

            <div className="flex items-center gap-3 border-t border-border px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="inline-flex h-12 shrink-0 items-center gap-1 rounded-full border border-border px-1">
                <button
                  type="button"
                  aria-label="Fewer"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid size-9 place-items-center rounded-full text-primary hover:bg-primary-soft"
                >
                  <Minus className="size-4" aria-hidden />
                </button>
                <span className="w-6 text-center text-body font-bold">{qty}</span>
                <button
                  type="button"
                  aria-label="More"
                  onClick={() => setQty((q) => Math.min(50, q + 1))}
                  className="grid size-9 place-items-center rounded-full text-primary hover:bg-primary-soft"
                >
                  <Plus className="size-4" aria-hidden />
                </button>
              </div>
              <Button
                size="lg"
                className="flex-1"
                disabled={variants.length > 0 && !variant}
                onClick={confirm}
              >
                Add item · ₹{money(unit * qty)}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
