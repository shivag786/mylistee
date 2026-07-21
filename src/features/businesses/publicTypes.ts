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
