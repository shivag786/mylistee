import { Pencil, Trash2, Utensils, Star, Sparkles, EyeOff, Tag } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { IconButton } from '@/components/ui/icon-button'
import type { Product } from '../productTypes'
import { PROMOTION_STATUS_TONE, type Promotion } from '../promotionTypes'

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onToggleVisible: (product: Product, value: boolean) => void
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
  onDelete,
  onToggleVisible,
  onSmartOffer,
  promotion,
  onEditOffer,
  busy,
}: ProductCardProps) {
  const hasOffer = Boolean(product.activeOffer)
  const effective = product.effectivePrice ?? product.sellingPrice
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
          {!product.inStock && <Badge tone="danger">Out of stock</Badge>}
        </div>

        <div className="mt-auto flex items-center justify-between gap-1 border-t border-border pt-2">
          <Switch
            checked={product.isVisible}
            onCheckedChange={(v) => onToggleVisible(product, v)}
            disabled={busy}
            aria-label="Visible on menu"
          />
          <div className="flex items-center gap-0.5">
            {!promotion && (
              <IconButton aria-label={`Create offer for ${product.name}`} size="sm" onClick={() => onSmartOffer(product)}>
                <Tag className="size-4" aria-hidden />
              </IconButton>
            )}
            <IconButton aria-label={`Edit ${product.name}`} size="sm" onClick={() => onEdit(product)}>
              <Pencil className="size-4" aria-hidden />
            </IconButton>
            <IconButton aria-label={`Delete ${product.name}`} size="sm" onClick={() => onDelete(product)}>
              <Trash2 className="size-4 text-destructive" aria-hidden />
            </IconButton>
          </div>
        </div>
      </div>
    </Card>
  )
}
