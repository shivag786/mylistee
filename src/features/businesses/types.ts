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
  status: BusinessStatus
}
