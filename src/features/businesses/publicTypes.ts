/** Customer-facing (public) business profile + spin types — mirror the Laravel
 * PublicBusinessResource / RewardResource. */

export interface PublicOffer {
  id: string
  title: string
  description: string | null
  type: string
  typeLabel: string
  rewardValue: string | null
  imageUrl: string | null
}

export interface PublicGalleryImage {
  id: string
  url: string | null
  sortOrder: number
}

export interface PublicProduct {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  mrp: number | null
  sellingPrice: number
  discountPercent: number
  effectivePrice?: number
  activeOffer?: { id: string; name: string; type: string } | null
  /** Any active promotion (all types) with its type + short label. */
  promo?: { name: string; type: string; typeLabel: string; label: string } | null
  foodType: 'veg' | 'non_veg' | 'egg' | null
  isTodaysSpecial: boolean
  isBestseller: boolean
  isRecommended: boolean
  inStock: boolean
}

export interface PublicMenuSection {
  id: string
  name: string
  products: PublicProduct[]
}

export interface PublicComboItem {
  productId: string | null
  name: string | null
  imageUrl: string | null
  quantity: number
}

export interface PublicCombo {
  id: string
  name: string
  imageUrl: string | null
  comboPrice: number
  totalPrice: number
  savings: number
  coinsEarned: number | null
  /** Max Listee coins a customer may spend on this combo (0 = none). */
  coinsAccepted: number
  items: PublicComboItem[]
  isActiveNow: boolean
}

export interface PublicBusiness {
  id: string
  name: string
  slug: string
  description: string | null
  category: string | null
  logoUrl: string | null
  coverUrl: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  openingTime: string | null
  closingTime: string | null
  isOpen: boolean
  phone: string | null
  website: string | null
  facebook: string | null
  instagram: string | null
  whatsapp: string | null
  averageRating: number
  totalReviews: number
  gallery: PublicGalleryImage[]
  offers: PublicOffer[]
  menu: PublicMenuSection[]
  combos: PublicCombo[]
}

export interface SpinState {
  available: boolean
  requiresLogin: boolean
  alreadySpunToday: boolean | null
}

export interface PublicBusinessResponse {
  business: PublicBusiness
  spin: SpinState
}

export interface WonReward {
  id: string
  code: string
  title: string
  rewardValue: string | null
  type: string | null
  status: 'active' | 'redeemed' | 'expired'
  wonAt: string | null
  expiresAt: string | null
  redeemedAt: string | null
  business: { id: string | null; name: string | null; slug: string | null; logoUrl: string | null }
}

export interface SpinResult {
  reward: WonReward
  offer: PublicOffer
  coinsEarned: number
}
