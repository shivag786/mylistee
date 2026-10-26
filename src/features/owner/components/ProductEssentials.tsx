import { ImageCropField } from '@/components/forms/ImageCropField'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FoodTypePicker } from './FoodTypePicker'
import { ProductCategorySelect } from './ProductCategorySelect'
import { FeeBreakdown } from './FeeBreakdown'
import { BadgePercent, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import {
  applyDiscount,
  PRODUCT_PHOTO_OUTPUT,
  type ProductEssentialsErrors,
  type ProductEssentialsValue,
} from '../productEssentials'
import type { ProductDiscount } from '../productTypes'

/**
 * What a product needs to go on the menu — photo, name and price — plus the two
 * quick optional picks (food type, menu section). Shared by the add/edit sheet
 * and the "first product" step after a shop registers.
 */
export function ProductEssentials({
  value,
  onChange,
  errors,
  existingImageUrl,
  sizesFrom,
}: {
  value: ProductEssentialsValue
  onChange: (patch: Partial<ProductEssentialsValue>) => void
  errors: ProductEssentialsErrors
  existingImageUrl?: string | null
  /** Cheapest size, when the product has sizes — the price is then set by them. */
  sizesFrom?: number | null
}) {
  const priceLocked = sizesFrom != null
  return (
    <div className="space-y-5">
      <ImageCropField
        label="Product photo"
        variant="hero"
        shape="rect"
        aspect={4 / 3}
        value={value.image}
        previewUrl={existingImageUrl}
        onChange={(image) => onChange({ image })}
        output={PRODUCT_PHOTO_OUTPUT}
        hint="A bright, close-up photo sells best"
      />

      <div className="space-y-1.5">
        <Label htmlFor="p-name">Product name</Label>
        <Input
          id="p-name"
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Paneer Tikka"
          aria-invalid={Boolean(errors.name)}
          maxLength={120}
        />
        {errors.name && <p className="text-caption text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="p-price">Price</Label>
        {priceLocked ? (
          <p className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-caption text-text-secondary">
            <span className="font-semibold text-foreground">From ₹{sizesFrom}</span> · set by the sizes below
          </p>
        ) : (
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-body font-semibold text-text-secondary">
              ₹
            </span>
            <Input
              id="p-price"
              inputMode="decimal"
              value={value.price}
              onChange={(e) => onChange({ price: e.target.value.replace(/[^\d.]/g, '') })}
              placeholder="149"
              className="pl-9 text-body-lg font-semibold"
              aria-invalid={Boolean(errors.price)}
            />
          </div>
        )}
        {errors.price && !priceLocked && <p className="text-caption text-destructive">{errors.price}</p>}
        <DiscountField
          price={priceLocked ? sizesFrom : Number(value.price) || 0}
          value={value.discount}
          onChange={(discount) => onChange({ discount })}
          error={errors.discount}
          perSize={priceLocked}
        />
        <FeeBreakdown
          price={applyDiscount(priceLocked ? sizesFrom : Number(value.price) || 0, value.discount)}
          note={priceLocked ? 'For the cheapest size — every size works the same way.' : 'Same price for the customer in cash or online.'}
        />
      </div>

      <FoodTypePicker value={value.foodType} onChange={(foodType) => onChange({ foodType })} />

      <ProductCategorySelect value={value.section} onChange={(section) => onChange({ section })} />
    </div>
  )
}

/**
 * "+ Add discount" — opens to a % / ₹ switch and an amount, with what the
 * customer will pay. Removing it clears the discount.
 */
function DiscountField({
  price,
  value,
  onChange,
  error,
  perSize,
}: {
  price: number
  value: ProductDiscount | null
  onChange: (value: ProductDiscount | null) => void
  error?: string
  perSize?: boolean
}) {
  if (!value) {
    return (
      <button
        type="button"
        onClick={() => onChange({ type: 'percent', value: 0 })}
        className="inline-flex items-center gap-1.5 pt-1 text-caption font-semibold text-primary hover:underline"
      >
        <BadgePercent className="size-4" aria-hidden />
        Add discount
      </button>
    )
  }

  const after = applyDiscount(price, value)
  return (
    <div className="mt-1 space-y-2 rounded-xl border border-offer/30 bg-offer-soft/60 p-3">
      <div className="flex items-center gap-2">
        <div className="inline-flex shrink-0 rounded-lg bg-surface p-0.5 ring-1 ring-border" role="radiogroup" aria-label="Discount type">
          {(['percent', 'flat'] as const).map((type) => (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={value.type === type}
              onClick={() => onChange({ ...value, type })}
              className={cn(
                'rounded-md px-3 py-1.5 text-caption font-bold transition-colors',
                value.type === type ? 'bg-offer text-offer-foreground' : 'text-text-secondary',
              )}
            >
              {type === 'percent' ? '% off' : '₹ off'}
            </button>
          ))}
        </div>
        <Input
          inputMode="decimal"
          aria-label="Discount amount"
          value={value.value ? String(value.value) : ''}
          onChange={(e) => onChange({ ...value, value: Number(e.target.value.replace(/[^\d.]/g, '')) || 0 })}
          placeholder={value.type === 'percent' ? '10' : '20'}
          className="h-10 min-w-0 flex-1 bg-surface"
          autoFocus
        />
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Remove discount"
          className="grid size-9 shrink-0 place-items-center rounded-full text-text-muted hover:bg-surface hover:text-danger"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      {error ? (
        <p className="text-small text-destructive">{error}</p>
      ) : (
        price > 0 &&
        value.value > 0 && (
          <p className="text-small text-text-secondary">
            Customers pay <span className="font-bold text-offer">₹{after}</span>{' '}
            <span className="line-through">₹{price}</span>
            {perSize && ' on the cheapest size — the same discount applies to every size'}
          </p>
        )
      )}
    </div>
  )
}
