import { Pencil, Utensils, Star, Sparkles, EyeOff, Tag, Wallet } from 'lucide-react'
import { useAppConfig } from '@/hooks/useAppConfig'
import { shopEarning } from '@/features/rewards/format'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { IconButton } from '@/components/ui/icon-button'
import { cn } from '@/utils/cn'
import type { Product } from '../productTypes'
import { PROMOTION_STATUS_TONE, type Promotion } from '../promotionTypes'

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onToggleVisible: (product: Product, value: boolean) => void
  onToggleStock: (product: Product, value: boolean) => void
  onSmartOffer: (product: Product) => void
  /** Existing product-scoped promotion (any status), if any. */
  promotion?: Promotion | null
  onEditOffer: (promotion: Promotion) => void
  busy?: boolean
}

const FOOD_DOT: Record<string, string> = {
  veg: 'border-success text-success',
  non_veg: 'border-destructive text-destructive',
  egg: 'border-warning text-warning',
}

/** Owner product card (PHASE 7.2 §Product Card) — image, price, badges, quick actions. */
export function ProductCard({
  product,
  onEdit,
  onToggleVisible,
  onToggleStock,
  onSmartOffer,
  promotion,
  onEditOffer,
  busy,
}: ProductCardProps) {
  const hasOffer = Boolean(product.activeOffer)
  const effective = product.effectivePrice ?? product.sellingPrice
  // What the shop keeps per unit after Listee's fee (known once /config loads).
  const { data: config } = useAppConfig()
  const fees = config?.payments
  const earning =
    fees?.platformFeePercent != null
      ? shopEarning(hasOffer ? effective : product.sellingPrice, {
          platformPercent: fees.platformFeePercent,
          gatewayPercent: fees.gatewayFeePercent ?? 0,
        })
      : null
  return (
    <Card className="flex h-full flex-col gap-2 p-0 overflow-hidden" padding="none">
      <div className="relative aspect-[4/3] w-full bg-surface-muted">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-text-muted">
            <Utensils className="size-7" aria-hidden />
          </div>
        )}
        {product.discountPercent > 0 && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
            {product.discountPercent}% OFF
          </span>
        )}
        {product.stockQty != null && (
          <span
            className={cn(
              'absolute bottom-1.5 left-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm',
              product.stockQty === 0
                ? 'bg-danger text-danger-foreground'
                : product.stockQty <= 5
                  ? 'bg-warning text-warning-foreground'
                  : 'bg-surface/95 text-foreground',
            )}
          >
            {product.stockQty === 0 ? 'Sold out' : `${product.stockQty} left`}
          </span>
        )}
        {!product.isVisible && (
          <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-dark/70 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">
            <EyeOff className="size-2.5" aria-hidden /> Hidden
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-3 pb-3">
        <div className="flex items-start gap-1.5">
          {product.foodType && (
            <span
              className={`mt-0.5 grid size-3 shrink-0 place-items-center rounded-[3px] border-2 ${FOOD_DOT[product.foodType] ?? ''}`}
              aria-label={product.foodType}
            >
              <span className="size-1 rounded-full bg-current" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-caption font-semibold text-foreground">{product.name}</p>
            {product.categoryName && (
              <p className="truncate text-[11px] text-text-muted">{product.categoryName}</p>
            )}
          </div>
        </div>

        <div className="flex items-baseline gap-1.5">
          {hasOffer ? (
            <>
              <span className="text-caption font-bold text-success">₹{effective}</span>
              <span className="text-[11px] text-text-muted line-through">₹{product.sellingPrice}</span>
            </>
          ) : (
            <>
              <span className="text-caption font-bold text-foreground">₹{product.sellingPrice}</span>
              {product.mrp != null && product.mrp > product.sellingPrice && (
                <span className="text-[11px] text-text-muted line-through">₹{product.mrp}</span>
              )}
            </>
          )}
        </div>

        {earning && (
          <p className="flex items-center gap-1 text-[11px] text-text-muted" title="After Listee's fee">
            <Wallet className="size-3 shrink-0" aria-hidden />
            <span className="truncate">
              You get <span className="font-semibold text-success">₹{earning.cash}</span>
            </span>
          </p>
        )}

        {(product.variants.length > 0 || product.addons.length > 0) && (
          <p className="truncate text-[11px] font-medium text-text-secondary">
            {[
              product.variants.length > 0 && `${product.variants.length} sizes`,
              product.addons.length > 0 && `${product.addons.length} add-ons`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}

        <div className="flex flex-wrap gap-1">
          {promotion && (
            <button
              type="button"
              onClick={() => onEditOffer(promotion)}
              aria-label={`Edit offer: ${promotion.name}`}
              className="inline-flex rounded-full transition-opacity hover:opacity-80"
            >
              <Badge tone={PROMOTION_STATUS_TONE[promotion.status]} className="max-w-[9rem] gap-1">
                <Tag className="size-3 shrink-0" aria-hidden />
                <span className="truncate">{promotion.name}</span>
                <Pencil className="size-3 shrink-0" aria-hidden />
              </Badge>
            </button>
          )}
          {product.isTodaysSpecial && (
            <Badge tone="warning" className="gap-1">
              <Sparkles className="size-3" aria-hidden /> Special
            </Badge>
          )}
          {product.isBestseller && (
            <Badge tone="premium" className="gap-1">
              <Star className="size-3" aria-hidden /> Bestseller
            </Badge>
          )}
          {product.isRecommended && <Badge tone="info">Recommended</Badge>}
        </div>

        {!promotion && (
          <button
            type="button"
            onClick={() => onSmartOffer(product)}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-dashed border-primary/50 py-1.5 text-small font-semibold text-primary transition-colors hover:bg-primary-soft"
          >
            <Tag className="size-3.5" aria-hidden /> Add offer
          </button>
        )}

        <div className="mt-auto space-y-2 border-t border-border pt-2">
          {/* Stock is what a busy kitchen flips most — a labelled switch, one tap. */}
          <label className="flex items-center justify-between gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[11px] font-bold',
                product.inStock ? 'text-success' : 'text-danger',
              )}
            >
              <span className="size-1.5 rounded-full bg-current" aria-hidden />
              {product.inStock ? 'In stock' : 'Out of stock'}
            </span>
            <Switch
              checked={product.inStock}
              onCheckedChange={(v) => onToggleStock(product, v)}
              disabled={busy}
              aria-label="In stock"
            />
          </label>
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-[11px] font-semibold text-text-secondary">
              <Switch
                checked={product.isVisible}
                onCheckedChange={(v) => onToggleVisible(product, v)}
                disabled={busy}
                aria-label="Visible on menu"
              />
              On menu
            </label>
            <IconButton aria-label={`Edit ${product.name}`} size="sm" onClick={() => onEdit(product)}>
              <Pencil className="size-4" aria-hidden />
            </IconButton>
          </div>
        </div>
      </div>
    </Card>
  )
}
