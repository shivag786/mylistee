import type { ShopPerks } from '@/features/rewards/types'
/** Customer-facing (public) business profile + spin types — mirror the Laravel
 * PublicBusinessResource / RewardResource. */
import type { ServiceType } from '@/features/orders/serviceTypes'

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
  promo?: { name: string; type: string; typeLabel: string; label: string; endsAt?: string | null } | null
  foodType: 'veg' | 'non_veg' | 'egg' | null
  /** Sizes to pick one of; `sellingPrice` is after the product's discount. */
  variants?: { id: string; name: string; price: number; sellingPrice: number }[]
  /** Extras to add any of, priced on top. */
  addons?: { id: string; name: string; price: number }[]
  isTodaysSpecial: boolean
  isBestseller: boolean
  isRecommended: boolean
  /** Units ordered in the recent window (null when never ordered). */
  orderCount?: number | null
  /** True once it clears the "most ordered" threshold — drives the Popular badge. */
  isPopular?: boolean
  inStock: boolean
  /** Units left when the shop counts stock; null otherwise. */
  stockQty?: number | null
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
  /** The item's own price, for "bought separately". */
  sellingPrice?: number | null
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
  /** Units ordered in the recent window (null when never ordered). */
  orderCount?: number | null
  /** True once it clears the "most ordered" threshold — drives the Popular badge. */
  isPopular?: boolean
  items: PublicComboItem[]
  isActiveNow: boolean
  /** When the combo stops showing (ISO); null = runs until turned off. */
  endsAt?: string | null
}

/** A business's fulfilment config for the checkout picker (Phase 7.6). */
/**
 * What checkout may offer at a shop. The server has already applied the
 * gateway's availability to the shop's own choice, so the client never has to
 * re-derive the rule -- and can never offer something the server would refuse.
 */
export interface PublicPaymentOptions {
  onlineAvailable: boolean
  codAvailable: boolean
  paymentMode: 'full' | 'partial'
  partialPercent: number
  /** Convenience fee on the online share, in percent. */
  feePercent: number
}

export interface PublicServiceConfig {
  modes: ServiceType[]
  defaultMode: ServiceType
  deliveryFee: number
  /** Absent on an API from before online payment -- treat as cash only. */
  payment?: PublicPaymentOptions
}

/** A dine-in table the customer can pick (Phase 7.6). */
export interface PublicTable {
  id: string
  label: string
  capacity: number | null
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
  /** Owner closed the shop until this time (ISO); null = not closed. */
  closedUntil?: string | null
  closedNote?: string | null
  /** Open, but not taking new orders right now. */
  ordersPaused?: boolean
  /** Premium: arriving by link/QR keeps the customer inside this shop. */
  storeMode?: boolean
  phone: string | null
  website: string | null
  facebook: string | null
  instagram: string | null
  whatsapp: string | null
  averageRating: number
  totalReviews: number
  /** How many customers follow this shop. Visible to everyone, signed in or not. */
  followersCount: number
  /** Whether the current viewer follows it. Always false when signed out. */
  isFollowing: boolean
  gallery: PublicGalleryImage[]
  offers: PublicOffer[]
  menu: PublicMenuSection[]
  combos: PublicCombo[]
  service: PublicServiceConfig
  tables: PublicTable[]
}

export interface SpinState {
  available: boolean
  requiresLogin: boolean
  alreadySpunToday: boolean | null
}

export interface PublicBusinessResponse {
  business: PublicBusiness
  spin: SpinState
  /** Bill discount, come-back, loyalty progress and coupons. Absent on an older API. */
  perks?: ShopPerks
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
