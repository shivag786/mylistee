import { useEffect, useRef, useState } from 'react'
import { Utensils, Star, Sparkles, Layers, Coins, Tag, Plus, Minus, Flame } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ExpandableText } from '@/components/data/ExpandableText'
import { cart, useCart, type CartItem } from '@/features/orders/cartStore'
import { ImageLightbox, type LightboxImage } from '@/components/media/ImageLightbox'
import { cn } from '@/utils/cn'
import type { PublicCombo, PublicMenuSection, PublicProduct } from '../publicTypes'

type AddHandler = (item: Omit<CartItem, 'quantity'>) => void
type ZoomHandler = (images: LightboxImage[], index: number, title: string) => void

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

  const [lightbox, setLightbox] = useState<{ images: LightboxImage[]; index: number; title: string } | null>(null)
  const onZoom: ZoomHandler = (images, index, title) => setLightbox({ images, index, title })

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
              <ComboRow key={combo.id} combo={combo} qty={qtyOf('combo', combo.id)} onAdd={onAdd} onZoom={onZoom} />
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
                onZoom={onZoom}
                focus={product.id === focusProductId}
              />
            ))}
          </div>
        </section>
      ))}

      <ImageLightbox
        open={lightbox !== null}
        onOpenChange={(o) => !o && setLightbox(null)}
        images={lightbox?.images ?? []}
        startIndex={lightbox?.index ?? 0}
        title={lightbox?.title ?? 'Image'}
      />
    </div>
  )
}

/**
 * "Most ordered" social-proof badge. Shows the real order count whenever the item
 * has been ordered; a hot flame + warning tone once it clears the popularity
 * threshold, otherwise a quiet neutral count.
 */
function PopularBadge({ count, popular }: { count?: number | null; popular?: boolean }) {
  const n = count ?? 0
  return (
    <Badge tone={popular ? 'warning' : 'neutral'} size="sm" className="gap-0.5">
      <Flame className={cn('size-2.5', popular && 'fill-current')} aria-hidden />
      {n > 0 ? `${n} ordered` : 'Popular'}
    </Badge>
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
  onZoom,
  focus,
}: {
  product: PublicProduct
  qty: number
  onAdd?: AddHandler
  onZoom?: ZoomHandler
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
          {((product.orderCount ?? 0) > 0 || product.isPopular) && (
            <PopularBadge count={product.orderCount} popular={product.isPopular} />
          )}
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
          <button
            type="button"
            onClick={() => onZoom?.([{ url: product.imageUrl!, label: product.name }], 0, product.name)}
            className="overflow-hidden rounded-image focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`View ${product.name} image`}
          >
            <img
              src={product.imageUrl}
              alt=""
              loading="lazy"
              className="size-16 object-cover transition-transform duration-200 hover:scale-105"
            />
          </button>
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

function ComboRow({
  combo,
  qty,
  onAdd,
  onZoom,
}: {
  combo: PublicCombo
  qty: number
  onAdd?: AddHandler
  onZoom?: ZoomHandler
}) {
  // Slider images: the combo's own photo first (if any), then each item's photo.
  const galleryImages: LightboxImage[] = [
    ...(combo.imageUrl ? [{ url: combo.imageUrl, label: combo.name }] : []),
    ...combo.items
      .filter((i) => i.imageUrl)
      .map((i) => ({ url: i.imageUrl as string, label: i.name })),
  ]
  const canZoom = onZoom && galleryImages.length > 0

  return (
    <Card className="flex items-start gap-3" padding="sm">
      {combo.imageUrl ? (
        <button
          type="button"
          onClick={() => canZoom && onZoom!(galleryImages, 0, combo.name)}
          disabled={!canZoom}
          className="shrink-0 overflow-hidden rounded-image focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-default"
          aria-label={`View ${combo.name} images`}
        >
          <img
            src={combo.imageUrl}
            alt=""
            loading="lazy"
            className="size-14 object-cover transition-transform duration-200 hover:scale-105"
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => canZoom && onZoom!(galleryImages, 0, combo.name)}
          disabled={!canZoom}
          className="flex shrink-0 -space-x-3 pt-0.5 focus:outline-none disabled:cursor-default"
          aria-label={`View ${combo.name} images`}
        >
          {combo.items.slice(0, 3).map((item, i) => (
            <span key={item.productId ?? i} className="grid size-8 place-items-center overflow-hidden rounded-full border-2 border-surface bg-surface-muted">
              {item.imageUrl ? <img src={item.imageUrl} alt="" className="size-full object-cover" /> : <Utensils className="size-3 text-text-muted" aria-hidden />}
            </span>
          ))}
        </button>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-caption font-semibold text-foreground">{combo.name}</p>
        <ExpandableText text={combo.items.map((i) => i.name).join(' + ')} limit={48} className="text-small" />
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="text-caption font-bold text-foreground">₹{combo.comboPrice}</span>
          {combo.totalPrice > combo.comboPrice && (
            <span className="text-small text-text-muted line-through">₹{combo.totalPrice}</span>
          )}
          {((combo.orderCount ?? 0) > 0 || combo.isPopular) && (
            <PopularBadge count={combo.orderCount} popular={combo.isPopular} />
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
                // Combos without their own photo fall back to a component item's
                // image so the cart still shows a picture instead of a placeholder.
                imageUrl: combo.imageUrl ?? combo.items.find((i) => i.imageUrl)?.imageUrl ?? null,
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
