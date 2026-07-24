import { useEffect, useRef, useState } from 'react'
import { Utensils, Star, Sparkles, Layers, Coins, Tag, Plus, Minus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ExpandableText } from '@/components/data/ExpandableText'
import { cart, useCart, type CartItem } from '@/features/orders/cartStore'
import { cn } from '@/utils/cn'
import type { PublicCombo, PublicMenuSection, PublicProduct } from '../publicTypes'

type AddHandler = (item: Omit<CartItem, 'quantity'>) => void

const FOOD_DOT: Record<string, string> = {
  veg: 'border-success text-success',
  non_veg: 'border-destructive text-destructive',
  egg: 'border-warning text-warning',
}

interface MenuListProps {
  menu: PublicMenuSection[]
  combos: PublicCombo[]
  businessSlug: string
  onAdd?: AddHandler
  /** Product to scroll to and highlight (deep-link from a home deal). */
  focusProductId?: string
}

/** Customer-facing menu (Phase 7.4/7.5) — combos + products grouped by section. */
export function MenuList({ menu, combos, businessSlug, onAdd, focusProductId }: MenuListProps) {
  const cartData = useCart()
  const inShop = cartData?.businessSlug === businessSlug

  const qtyOf = (type: CartItem['type'], id: string) =>
    inShop ? (cartData?.items.find((i) => i.type === type && i.id === id)?.quantity ?? 0) : 0

  const activeCombos = combos.filter((c) => c.isActiveNow)
  const isEmpty = menu.length === 0 && activeCombos.length === 0

  if (isEmpty) {
    return (
      <EmptyState
        icon={<Utensils className="size-7" />}
        title="Menu coming soon"
        description="This shop hasn't added its menu yet. Check back shortly."
      />
    )
  }

  return (
    <div className="space-y-5">
      {activeCombos.length > 0 && (
        <section className="space-y-2">
          <h3 className="flex items-center gap-1.5 text-body font-semibold text-foreground">
            <Layers className="size-4 text-primary" aria-hidden /> Combos
          </h3>
          <div className="space-y-2">
            {activeCombos.map((combo) => (
              <ComboRow key={combo.id} combo={combo} qty={qtyOf('combo', combo.id)} onAdd={onAdd} />
            ))}
          </div>
        </section>
      )}

      {menu.map((section) => (
        <section key={section.id} className="space-y-2">
          <h3 className="text-body font-semibold text-foreground">{section.name}</h3>
          <div className="space-y-2">
            {section.products.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                qty={qtyOf('product', product.id)}
                onAdd={onAdd}
                focus={product.id === focusProductId}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/** Add button, or a compact −/qty/+ stepper once the item is in the cart. */
function AddControl({
  qty,
  disabled,
  onAdd,
  onInc,
  onDec,
}: {
  qty: number
  disabled?: boolean
  onAdd: () => void
  onInc: () => void
  onDec: () => void
}) {
  if (disabled) {
    return <span className="text-small font-medium text-destructive">Out of stock</span>
  }
  if (qty <= 0) {
    return (
      <Button size="sm" variant="outline" leftIcon={<Plus className="size-3.5" />} onClick={onAdd}>
        Add
      </Button>
    )
  }
  return (
    <div className="flex items-center gap-2 rounded-full border border-primary px-1 py-0.5">
      <button type="button" aria-label="Decrease" onClick={onDec} className="grid size-6 place-items-center rounded-full text-primary hover:bg-primary-soft">
        <Minus className="size-3.5" aria-hidden />
      </button>
      <span className="w-4 text-center text-caption font-semibold text-foreground">{qty}</span>
      <button type="button" aria-label="Increase" onClick={onInc} className="grid size-6 place-items-center rounded-full text-primary hover:bg-primary-soft">
        <Plus className="size-3.5" aria-hidden />
      </button>
    </div>
  )
}

function ProductRow({
  product,
  qty,
  onAdd,
  focus,
}: {
  product: PublicProduct
  qty: number
  onAdd?: AddHandler
  focus?: boolean
}) {
  const hasOffer = Boolean(product.activeOffer) && product.effectivePrice != null
  const price = hasOffer ? product.effectivePrice! : product.sellingPrice

  const ref = useRef<HTMLDivElement>(null)
  const [highlight, setHighlight] = useState(false)

  // Deep-linked from a home deal: scroll into view and pulse a ring briefly.
  useEffect(() => {
    if (!focus) return
    const el = ref.current
    const t = setTimeout(() => {
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlight(true)
    }, 250)
    const clear = setTimeout(() => setHighlight(false), 2600)
    return () => {
      clearTimeout(t)
      clearTimeout(clear)
    }
  }, [focus])

  return (
    <Card
      ref={ref}
      id={`product-${product.id}`}
      className={cn(
        'flex scroll-mt-24 gap-3 transition-shadow duration-300',
        highlight && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
      padding="sm"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {product.foodType && (
            <span className={`grid size-3 shrink-0 place-items-center rounded-[3px] border-2 ${FOOD_DOT[product.foodType] ?? ''}`} aria-label={product.foodType}>
              <span className="size-1 rounded-full bg-current" />
            </span>
          )}
          <p className="truncate text-caption font-semibold text-foreground">{product.name}</p>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1">
          {product.isBestseller && (
            <Badge tone="premium" size="sm" className="gap-0.5">
              <Star className="size-2.5" aria-hidden /> Bestseller
            </Badge>
          )}
          {product.isTodaysSpecial && (
            <Badge tone="warning" size="sm" className="gap-0.5">
              <Sparkles className="size-2.5" aria-hidden /> Special
            </Badge>
          )}
          {product.promo && (
            <Badge tone="primary" size="sm" className="gap-0.5">
              <Tag className="size-2.5" aria-hidden /> {product.promo.label}
            </Badge>
          )}
        </div>

        <div className="mt-1 flex items-baseline gap-1.5">
          <span className={`text-caption font-bold ${hasOffer ? 'text-success' : 'text-foreground'}`}>₹{price}</span>
          {hasOffer ? (
            <span className="text-small text-text-muted line-through">₹{product.sellingPrice}</span>
          ) : product.mrp != null && product.mrp > product.sellingPrice ? (
            <span className="text-small text-text-muted line-through">₹{product.mrp}</span>
          ) : null}
          {product.discountPercent > 0 && !hasOffer && (
            <Badge tone="success" size="sm">{product.discountPercent}% off</Badge>
          )}
        </div>

        {product.description && <ExpandableText text={product.description} limit={90} className="mt-1 text-small" />}
      </div>

      <div className="flex shrink-0 flex-col items-end justify-between gap-1.5">
        {product.imageUrl && (
          <img src={product.imageUrl} alt="" loading="lazy" className="size-16 rounded-image object-cover" />
        )}
        {onAdd && (
          <AddControl
            qty={qty}
            disabled={!product.inStock}
            onAdd={() =>
              onAdd({ type: 'product', id: product.id, name: product.name, imageUrl: product.imageUrl, unitPrice: price })
            }
            onInc={() => cart.setQuantity('product', product.id, qty + 1)}
            onDec={() => cart.setQuantity('product', product.id, qty - 1)}
          />
        )}
      </div>
    </Card>
  )
}

function ComboRow({ combo, qty, onAdd }: { combo: PublicCombo; qty: number; onAdd?: AddHandler }) {
  return (
    <Card className="flex items-start gap-3" padding="sm">
      {combo.imageUrl ? (
        <img src={combo.imageUrl} alt="" loading="lazy" className="size-14 shrink-0 rounded-image object-cover" />
      ) : (
        <div className="flex shrink-0 -space-x-3 pt-0.5">
          {combo.items.slice(0, 3).map((item, i) => (
            <span key={item.productId ?? i} className="grid size-8 place-items-center overflow-hidden rounded-full border-2 border-surface bg-surface-muted">
              {item.imageUrl ? <img src={item.imageUrl} alt="" className="size-full object-cover" /> : <Utensils className="size-3 text-text-muted" aria-hidden />}
            </span>
          ))}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-caption font-semibold text-foreground">{combo.name}</p>
        <ExpandableText text={combo.items.map((i) => i.name).join(' + ')} limit={48} className="text-small" />
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="text-caption font-bold text-foreground">₹{combo.comboPrice}</span>
          {combo.totalPrice > combo.comboPrice && (
            <span className="text-small text-text-muted line-through">₹{combo.totalPrice}</span>
          )}
          {combo.savings > 0 && <Badge tone="success" size="sm">Save ₹{combo.savings}</Badge>}
          {combo.coinsEarned ? (
            <Badge tone="premium" size="sm" className="gap-0.5">
              <Coins className="size-2.5" aria-hidden /> +{combo.coinsEarned}
            </Badge>
          ) : null}
        </div>
      </div>

      {onAdd && (
        <div className="shrink-0 self-center">
          <AddControl
            qty={qty}
            onAdd={() =>
              onAdd({
                type: 'combo',
                id: combo.id,
                name: combo.name,
                imageUrl: combo.imageUrl,
                unitPrice: combo.comboPrice,
                coinsAccepted: combo.coinsAccepted,
              })
            }
            onInc={() => cart.setQuantity('combo', combo.id, qty + 1)}
            onDec={() => cart.setQuantity('combo', combo.id, qty - 1)}
          />
        </div>
      )}
    </Card>
  )
}
