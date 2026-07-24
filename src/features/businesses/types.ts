import type { BusinessStatus } from '@/constants/statuses'

export interface Business {
  id: string
  slug: string
  name: string
  category: string | null
  coverImage: string | null
  logo: string | null
  rating: number
  reviewCount: number
  distanceMeters: number | null
  offerCount: number
  isOpen: boolean
  area: string | null
  isFavorite: boolean
  /** Admin-verified shop (Recommended row). */
  verified: boolean
  /** Active shop with a live offer — the spinner has something to award. */
  spinAvailable: boolean
  /** Onboarded within the last 14 days. */
  isNew: boolean
  status: BusinessStatus
}

/** Public business category (home chips / search filter). */
export interface BusinessCategory {
  id: string
  name: string
  slug: string
  icon: string | null
  imageUrl: string | null
  description: string | null
  showOnHomepage: boolean
  showInSearch: boolean
}
