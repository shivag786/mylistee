import type { CartItem } from '@/features/orders/cartStore'
import type { PublicCombo, PublicMenuSection, PublicProduct } from '../../publicTypes'

/** One menu item — product or combo — in the shape the dish views need. */
export interface Dish {
  key: string
  type: CartItem['type']
  id: string
  name: string
  imageUrl: string | null
  /** What the customer pays now. */
  price: number
  /** Crossed-out price, when there's a saving to show. */
  strikePrice: number | null
  description: string | null
  foodType: PublicProduct['foodType']
  /** Short highlight chips: "Bestseller", "Save ₹40", … */
  tags: string[]
  section: string
  inStock: boolean
  cartItem: Omit<CartItem, 'quantity'>
}

export const dishKey = (type: CartItem['type'], id: string) => `${type}:${id}`

export function productDish(product: PublicProduct, section: string): Dish {
  const hasOffer = Boolean(product.activeOffer) && product.effectivePrice != null
  const price = hasOffer ? product.effectivePrice! : product.sellingPrice
  const strike = hasOffer
    ? product.sellingPrice
    : product.mrp != null && product.mrp > product.sellingPrice
      ? product.mrp
      : null

  const tags: string[] = []
  if (product.isBestseller) tags.push('Bestseller')
  if (product.isTodaysSpecial) tags.push("Today's special")
  if (product.isPopular) tags.push('Popular')
  if (product.promo) tags.push(product.promo.label)
  else if (product.discountPercent > 0 && !hasOffer) tags.push(`${product.discountPercent}% off`)

  return {
    key: dishKey('product', product.id),
    type: 'product',
    id: product.id,
    name: product.name,
    imageUrl: product.imageUrl,
    price,
    strikePrice: strike,
    description: product.description,
    foodType: product.foodType,
    tags,
    section,
    inStock: product.inStock,
    cartItem: { type: 'product', id: product.id, name: product.name, imageUrl: product.imageUrl, unitPrice: price },
  }
}

export function comboDish(combo: PublicCombo): Dish {
  // A combo without its own photo borrows its first item's, as the cart does.
  const imageUrl = combo.imageUrl ?? combo.items.find((i) => i.imageUrl)?.imageUrl ?? null
  const tags: string[] = []
  if (combo.savings > 0) tags.push(`Save ₹${combo.savings}`)
  if (combo.isPopular) tags.push('Popular')
  if (combo.coinsEarned) tags.push(`+${combo.coinsEarned} coins`)

  return {
    key: dishKey('combo', combo.id),
    type: 'combo',
    id: combo.id,
    name: combo.name,
    imageUrl,
    price: combo.comboPrice,
    strikePrice: combo.totalPrice > combo.comboPrice ? combo.totalPrice : null,
    description: combo.items
      .filter((i) => i.name)
      .map((i) => (i.quantity > 1 ? `${i.quantity}× ${i.name}` : i.name))
      .join(' + '),
    foodType: null,
    tags,
    section: 'Combos',
    inStock: true,
    cartItem: {
      type: 'combo',
      id: combo.id,
      name: combo.name,
      imageUrl,
      unitPrice: combo.comboPrice,
      coinsAccepted: combo.coinsAccepted,
    },
  }
}

/**
 * Every product with a photo, in menu order — what the full-screen viewer
 * swipes through. Combos open their own sheet instead.
 */
export function viewableDishes(menu: PublicMenuSection[]): Dish[] {
  return menu.flatMap((s) => s.products.map((p) => productDish(p, s.name))).filter((d) => d.imageUrl)
}
