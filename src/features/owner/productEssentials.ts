import type { MenuSectionValue } from './components/ProductCategorySelect'
import type { FoodType, ProductDiscount, ProductOption } from './productTypes'

export interface ProductEssentialsValue {
  image: File | null
  name: string
  /** The price before any discount. With sizes, set by the cheapest size. */
  price: string
  /** Optional % or ₹ off; null = none. */
  discount: ProductDiscount | null
  foodType: FoodType | null
  section: MenuSectionValue
}

export interface ProductEssentialsErrors {
  name?: string
  price?: string
  discount?: string
}

/** Product photos: 4:3 like the menu cards, ~1200px and well compressed. */
export const PRODUCT_PHOTO_OUTPUT = { maxDimension: 1200, quality: 0.82 }

/** A price after the discount, never below zero. Mirrors Product::applyDiscount(). */
export function applyDiscount(price: number, discount: ProductDiscount | null): number {
  if (!discount || !(discount.value > 0)) return price
  const off = discount.type === 'percent' ? (price * Math.min(100, discount.value)) / 100 : discount.value
  return Math.max(0, Math.round((price - off) * 100) / 100)
}

/**
 * Sizes / add-ons the owner has actually filled in (blank rows are ignored). A
 * size row may be a type alone ("Fried"), so a type counts as a name.
 */
export function filledOptions(
  rows: { name: string; price: string; id?: string; type?: string; qty?: string }[],
): ProductOption[] {
  return rows
    .filter((r) => (r.name.trim() || r.type?.trim()) && r.price.trim() !== '' && !Number.isNaN(Number(r.price)))
    .map((r) => ({
      ...(r.id ? { id: r.id } : {}),
      ...(r.type?.trim() ? { type: r.type.trim() } : {}),
      name: r.name.trim(),
      ...(r.qty?.trim() ? { qty: r.qty.trim() } : {}),
      price: Number(r.price),
    }))
}

/**
 * The stored price pair. `mrp` is the undiscounted price, kept only when a
 * discount makes it differ; `sellingPrice` is what the menu shows ("from" it,
 * when there are sizes).
 */
export function pricing(
  price: number,
  discount: ProductDiscount | null,
): { mrp: number | null; sellingPrice: number } {
  const selling = applyDiscount(price, discount)
  return { mrp: selling < price ? price : null, sellingPrice: selling }
}

/** Name, price and discount checks; empty object = valid. */
export function validateEssentials(value: ProductEssentialsValue): ProductEssentialsErrors {
  const errors: ProductEssentialsErrors = {}
  if (!value.name.trim()) errors.name = 'Give your product a name.'
  const price = Number(value.price)
  if (!value.price || Number.isNaN(price) || price < 0) errors.price = 'Enter the price.'
  const d = value.discount
  if (d && (Number.isNaN(d.value) || d.value < 0 || (d.type === 'percent' && d.value > 90) || (d.type === 'flat' && price > 0 && d.value >= price))) {
    errors.discount = d.type === 'percent' ? 'Keep the discount between 1% and 90%.' : 'The discount must be less than the price.'
  }
  return errors
}

export interface OptionRow {
  /** Kept from the server so renaming a size doesn't break carts. */
  id?: string
  name: string
  price: string
  /** Sizes only: "Steam" / "Fried" and "6 pcs" / "500 g". */
  type?: string
  qty?: string
  /** Local key for React; not sent. */
  key: string
}

let seq = 0
export const newOptionRow = (name = '', price = ''): OptionRow => ({ name, price, key: `row-${++seq}` })
