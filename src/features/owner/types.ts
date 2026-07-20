import type { BusinessStatus } from '@/constants/statuses'

export interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
}

export interface GalleryImage {
  id: string
  url: string | null
  sortOrder: number
}

export interface BusinessQr {
  id: string
  type: string
  url: string
  downloadCount: number
  scanCount: number
}

/** Full business profile owned by the signed-in business owner. */
export interface OwnerBusiness {
  id: string
  name: string
  slug: string
  ownerName: string | null
  description: string | null
  category: Category | null
  logoUrl: string | null
  coverUrl: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  openingTime: string | null
  closingTime: string | null
  isOpen: boolean
  phone: string | null
  email: string | null
  website: string | null
  facebook: string | null
  instagram: string | null
  whatsapp: string | null
  gst: string | null
  status: BusinessStatus
  verified: boolean
  featured: boolean
  averageRating: number
  totalReviews: number
  gallery: GalleryImage[]
  qr: BusinessQr | null
  createdAt: string | null
}

export interface DashboardMetrics {
  todayVisitors: number
  todaySpins: number
  todayRewards: number
  todayRedemptions: number
  totalCustomers: number
  repeatCustomers: number
  totalVisits: number
  totalSpins: number
  totalRewards: number
}

export interface OnboardingItem {
  key: string
  label: string
  done: boolean
}

export interface DashboardPlan {
  key: string
  name: string
  maxActiveOffers: number | null
}

export interface DashboardData {
  business: OwnerBusiness
  metrics: DashboardMetrics
  onboarding: OnboardingItem[]
  plan: DashboardPlan
}

/** Subscription plan (Milestone 13). Limits: null = unlimited. */
export interface Plan {
  id: string
  key: string
  name: string
  description: string | null
  price: number
  currency: string
  interval: string
  limits: {
    maxActiveOffers: number | null
    maxOfferDays: number | null
    maxQrCodes: number | null
    maxGalleryImages: number | null
  }
  features: string[]
  badge: string | null
  isDefault: boolean
  isFree: boolean
  sortOrder: number
}

export interface Subscription {
  id: string
  status: 'active' | 'cancelled' | 'expired'
  plan?: Plan
  price: number
  currency: string
  interval: string
  startsAt: string | null
  endsAt: string | null
  cancelledAt: string | null
  autoRenew: boolean
}

export interface PlanUsageItem {
  used: number
  limit: number | null
}

export interface SubscriptionState {
  plan: Plan | null
  subscription: Subscription | null
  usage: {
    activeOffers: PlanUsageItem
    galleryImages: PlanUsageItem
    qrCodes: PlanUsageItem
  }
}

export interface Invoice {
  id: string
  number: string
  planName: string
  amount: number
  currency: string
  status: 'paid' | 'pending' | 'failed' | 'refunded'
  periodStart: string | null
  periodEnd: string | null
  issuedAt: string | null
  paidAt: string | null
}

/** A metric value with its previous-period comparison (Milestone 12). */
export interface MetricTrend {
  value: number
  previous: number
  changePct: number | null
}

export interface AnalyticsSeriesPoint {
  date: string
  visits: number
  spins: number
  rewards: number
  redemptions: number
}

export interface AnalyticsTopOffer {
  uuid: string
  title: string
  type: string
  rewards: number
  redemptions: number
  redemptionRate: number
}

/** Metric keys that are trended over time / shown as headline tiles. */
export type AnalyticsMetricKey = 'visits' | 'spins' | 'rewards' | 'redemptions'

export interface AnalyticsData {
  range: { days: number; from: string; to: string }
  summary: {
    visits: MetricTrend
    spins: MetricTrend
    rewards: MetricTrend
    redemptions: MetricTrend
    uniqueCustomers: number
    repeatCustomerRate: number
    spinConversionRate: number
    redemptionRate: number
  }
  series: AnalyticsSeriesPoint[]
  topOffers: AnalyticsTopOffer[]
}

export type OfferType =
  | 'percentage'
  | 'flat'
  | 'bogo'
  | 'combo'
  | 'free_item'
  | 'cashback'
  | 'wallet_reward'
  | 'festival'
  | 'mystery'

export type OfferStatus = 'active' | 'scheduled' | 'expired' | 'sold_out' | 'archived'

export interface Offer {
  id: string
  title: string
  description: string | null
  type: OfferType
  typeLabel: string
  rewardValue: string | null
  imageUrl: string | null
  startsAt: string
  endsAt: string
  totalQuantity: number | null
  remainingQuantity: number | null
  weight: number
  priority: number
  status: OfferStatus
  isArchived: boolean
  isLive: boolean
  premiumOnly: boolean
  visibility: string
  createdAt: string | null
}

/** Shape produced by the offer create/edit form. */
export interface OfferFormValues {
  title: string
  type: OfferType
  rewardValue?: string
  description?: string
  startsAt: string
  endsAt: string
  totalQuantity?: string
  image?: File | null
}

/** Shape produced by the registration/profile form (before FormData encoding). */
export interface BusinessFormValues {
  name: string
  category: string
  description?: string
  phone?: string
  email?: string
  website?: string
  address?: string
  latitude?: string
  longitude?: string
  openingTime?: string
  closingTime?: string
  facebook?: string
  instagram?: string
  whatsapp?: string
  gst?: string
  logo?: File | null
  cover?: File | null
}
