/** Product catalogue types (Phase 7.2). */

export type FoodType = 'veg' | 'non_veg' | 'egg'

/** A size ("Large") or an add-on ("Extra cheese") with its price. */
export interface ProductOption {
  /** Server-minted; absent on a row the owner just added. */
  id?: string
  name: string
  price: number
  /** Sizes only: a type such as "Steam" / "Fried", and a quantity such as "6 pcs". */
  type?: string | null
  qty?: string | null
}

/** The product's own discount: `percent` off, or a `flat` ₹ amount off. */
export interface ProductDiscount {
  type: 'percent' | 'flat'
  value: number
}

export interface ProductImage {
  id: string
  url: string | null
  position: number
}

export interface Product {
  id: string
  name: string
  description: string | null
  ingredients: string | null
  imageUrl: string | null
  gallery: ProductImage[]
  categoryId: string | null
  categoryName: string | null
  mrp: number | null
  sellingPrice: number
  discountPercent: number
  /** Sizes; `sellingPrice` is after the product's discount. */
  variants: (ProductOption & { id: string; sellingPrice: number })[]
  addons: (ProductOption & { id: string })[]
  discount: ProductDiscount | null
  foodType: FoodType | null
  availableFrom: string | null
  availableTo: string | null
  prepMinutes: number | null
  isTodaysSpecial: boolean
  isBestseller: boolean
  isRecommended: boolean
  inStock: boolean
  /** Units left; null when the shop doesn't count this product's stock. */
  stockQty: number | null
  isVisible: boolean
  position: number
  createdAt: string | null
  /** Effective unit price after the best active promotion (7.2b). */
  effectivePrice?: number
  activeOffer?: { id: string; name: string; type: string } | null
}

export interface ProductCategory {
  id: string
  name: string
  position: number
  productCount?: number
}

/** Form payload for create/update. `image` is a freshly cropped file. */
export interface ProductFormValues {
  name: string
  categoryId?: string | null
  categoryName?: string | null
  description?: string
  ingredients?: string
  mrp?: number | null
  sellingPrice: number
  foodType?: FoodType | null
  availableFrom?: string
  availableTo?: string
  prepMinutes?: number | null
  isTodaysSpecial?: boolean
  isBestseller?: boolean
  isRecommended?: boolean
  inStock?: boolean
  /** null = stop counting stock. */
  stockQty?: number | null
  isVisible?: boolean
  image?: File | null
  variants?: ProductOption[]
  addons?: ProductOption[]
  discount?: ProductDiscount | null
}

export type ProductToggleField =
  | 'is_visible'
  | 'in_stock'
  | 'is_todays_special'
  | 'is_bestseller'
  | 'is_recommended'
