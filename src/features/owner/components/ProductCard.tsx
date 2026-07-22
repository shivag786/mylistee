import { Pencil, Trash2, Utensils, Star, Sparkles, EyeOff, Tag } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { IconButton } from '@/components/ui/icon-button'
import type { Product } from '../productTypes'

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onToggleVisible: (product: Product, value: boolean) => void
  onSmartOffer: (product: Product) => void
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
  busy,
}: ProductCardProps) {
  const hasOffer = Boolean(product.activeOffer)
  const effective = product.effectivePrice ?? product.sellingPrice
  return (
    <Card className="flex h-full flex-col gap-3 p-0 overflow-hidden" padding="none">
      <div className="relative aspect-[4/3] w-full bg-surface-muted">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-text-muted">
            <Utensils className="size-8" aria-hidden />
          </div>
        )}
        {product.discountPercent > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-small font-semibold text-primary-foreground">
            {product.discountPercent}% OFF
          </span>
        )}
        {!product.isVisible && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-dark/70 px-2 py-0.5 text-small font-medium text-white backdrop-blur">
            <EyeOff className="size-3" aria-hidden /> Hidden
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4 pb-4">
        <div className="flex items-start gap-2">
          {product.foodType && (
            <span
              className={`mt-1 grid size-3.5 shrink-0 place-items-center rounded-[3px] border-2 ${FOOD_DOT[product.foodType] ?? ''}`}
              aria-label={product.foodType}
            >
              <span className="size-1.5 rounded-full bg-current" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-body font-semibold text-foreground">{product.name}</p>
            {product.categoryName && (
              <p className="text-small text-text-muted">{product.categoryName}</p>
            )}
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          {hasOffer ? (
            <>
              <span className="text-body font-bold text-success">₹{effective}</span>
              <span className="text-small text-text-muted line-through">₹{product.sellingPrice}</span>
            </>
          ) : (
            <>
              <span className="text-body font-bold text-foreground">₹{product.sellingPrice}</span>
              {product.mrp != null && product.mrp > product.sellingPrice && (
                <span className="text-small text-text-muted line-through">₹{product.mrp}</span>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {hasOffer && (
            <Badge tone="primary" className="gap-1">
              <Tag className="size-3" aria-hidden /> {product.activeOffer?.name}
            </Badge>
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

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
          <label className="flex items-center gap-2 text-small text-text-secondary">
            <Switch
              checked={product.isVisible}
              onCheckedChange={(v) => onToggleVisible(product, v)}
              disabled={busy}
              aria-label="Visible on menu"
            />
            Visible
          </label>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Tag className="size-4" />}
              onClick={() => onSmartOffer(product)}
            >
              Offer
            </Button>
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
