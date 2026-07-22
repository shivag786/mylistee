/** Product catalogue types (Phase 7.2). */

export type FoodType = 'veg' | 'non_veg' | 'egg'

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
  foodType: FoodType | null
  availableFrom: string | null
  availableTo: string | null
  prepMinutes: number | null
  isTodaysSpecial: boolean
  isBestseller: boolean
  isRecommended: boolean
  inStock: boolean
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
  isVisible?: boolean
  image?: File | null
}

export type ProductToggleField =
  | 'is_visible'
  | 'in_stock'
  | 'is_todays_special'
  | 'is_bestseller'
  | 'is_recommended'
