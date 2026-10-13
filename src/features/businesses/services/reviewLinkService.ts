/**
 * A shop's public review link (/review/:slug). No account: the reviewer gives a
 * mobile number plus any of an overall star, a text review and per-item stars.
 */
import { apiClient } from '@/services/apiClient'
import type { Review } from './reviewService'

export type ReviewItemType = 'product' | 'combo'

export interface ReviewLinkItem {
  type: ReviewItemType
  id: string
  name: string
  imageUrl: string | null
  price: number
  /** Crossed-out MRP, when there's a saving. */
  strikePrice: number | null
  foodType: 'veg' | 'non_veg' | 'egg' | null
  /** "Bestseller", "Today's special", "Combo", … */
  highlight: string | null
  inStock: boolean
}

export interface ReviewLinkShop {
  name: string
  slug: string
  logoUrl: string | null
  items: ReviewLinkItem[]
}

export interface ReviewLinkInput {
  phone: string
  name?: string
  rating?: number
  comment?: string
  items?: { type: ReviewItemType; id: string; rating: number }[]
  /** Honeypot — always empty from a real visitor. */
  website?: string
}

export const reviewLinkService = {
  get: (slug: string): Promise<ReviewLinkShop> =>
    apiClient.get<ReviewLinkShop>(`review-link/${slug}`, { auth: false }),
  submit: (slug: string, input: ReviewLinkInput): Promise<Review> =>
    apiClient.post<Review>(`review-link/${slug}`, input, { auth: false }),
}
