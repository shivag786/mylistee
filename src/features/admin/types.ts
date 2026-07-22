import type { Plan } from '@/features/owner/types'

export type { Plan }

export interface AdminDashboard {
  stats: {
    totalCustomers: number
    activeCustomers: number
    totalBusinesses: number
    verifiedBusinesses: number
    pendingBusinesses: number
    activeOffers: number
    spinsToday: number
    visitsToday: number
    redemptionsToday: number
    activeSubscriptions: number
    revenueTotal: number
    revenueThisMonth: number
    pendingApprovals: number
  }
  growth: { date: string; customers: number; businesses: number }[]
  health: { database: string; cache: string; queue: string }
}

export type BusinessStatus = 'active' | 'pending' | 'suspended' | 'rejected'
export type CustomerStatus = 'active' | 'suspended' | 'blocked'

export interface AdminBusiness {
  id: string
  name: string
  slug: string
  ownerName: string | null
  ownerEmail: string | null
  ownerMobile: string | null
  ownerPin: string | null
  category: string | null
  logoUrl: string | null
  status: BusinessStatus
  verified: boolean
  featured: boolean
  averageRating: number
  totalReviews: number
  totalVisits: number
  totalSpins: number
  createdAt: string | null
}

export interface AdminCustomer {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  phone: string | null
  role: string
  status: CustomerStatus
  spins: number
  rewards: number
  createdAt: string | null
  lastLoginAt: string | null
}

export interface AdminOffer {
  id: string
  title: string
  type: string
  rewardValue: string | null
  status: string
  businessName: string | null
  businessSlug: string | null
  startsAt: string | null
  endsAt: string | null
  createdAt: string | null
}

export interface AdminReview {
  id: string
  rating: number
  comment: string | null
  status: string
  customerName: string | null
  businessName: string | null
  businessSlug: string | null
  createdAt: string | null
}

export interface AuditLog {
  id: string
  action: string
  description: string | null
  actorName: string
  subjectType: string | null
  subjectId: number | null
  meta: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: string | null
}

export interface FeatureFlag {
  id: number
  key: string
  name: string
  description: string | null
  enabled: boolean
}

export interface CmsPage {
  id: string
  slug: string
  title: string
  body: string | null
  status: string
  updatedAt: string | null
}

export interface PlatformSettings {
  brandName: string
  supportEmail: string
  supportPhone: string
  currency: string
  timezone: string
  defaultLanguage: string
  maintenanceMode: boolean
  maintenanceMessage: string
}

export interface FraudSignals {
  summary: { excessiveSpins: number; sharedIps: number; highRisk: number }
  excessiveSpins: { name: string; email: string; spins: number; risk: 'high' | 'medium' }[]
  sharedIps: { ip: string; accounts: number; spins: number; risk: 'high' | 'medium' }[]
}

export interface ListFilters {
  search?: string
  status?: string
  page?: number
  perPage?: number
}

// ---- Master categories (Phase 7.1) ----

export interface AdminCategory {
  id: string
  name: string
  slug: string
  icon: string | null
  imageUrl: string | null
  description: string | null
  altText: string | null
  position: number
  status: string
  showOnHomepage: boolean
  showInSearch: boolean
  businessCount: number
  createdAt: string | null
  updatedAt: string | null
}

/** Fields the admin form edits; `image` is the freshly cropped file, if any. */
export interface CategoryInput {
  name: string
  description?: string
  altText?: string
  icon?: string
  status?: string
  showOnHomepage?: boolean
  showInSearch?: boolean
  image?: File | null
}

export interface CategoryRequestItem {
  id: string
  name: string
  sampleImageUrl: string | null
  status: 'pending' | 'approved' | 'rejected'
  reviewNote: string | null
  requestedBy: string | null
  businessName: string | null
  reviewedAt: string | null
  createdAt: string | null
}
