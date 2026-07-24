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
  categoryId: string | null
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  facebook: string | null
  instagram: string | null
  whatsapp: string | null
  gst: string | null
  openingTime: string | null
  closingTime: string | null
  logoUrl: string | null
  coverUrl: string | null
  status: BusinessStatus
  verified: boolean
  featured: boolean
  averageRating: number
  totalReviews: number
  totalVisits: number
  totalSpins: number
  createdAt: string | null
}

/** Editable business fields for the admin edit form. */
export interface BusinessUpdateInput {
  name: string
  categoryId?: string | null
  description?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  facebook?: string | null
  instagram?: string | null
  whatsapp?: string | null
  gst?: string | null
  openingTime?: string | null
  closingTime?: string | null
  status?: string
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

// ---- Business Import Engine (SPEC-011) ----

/** Normalized, unsaved preview returned by the importer. */
export interface ImportPreview {
  source: string
  sourceLabel: string
  sourceUrl: string
  placeId: string | null
  name: string | null
  phone: string | null
  website: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  categories: string[]
  category: string | null
  openingHours: { weekdayDescriptions?: string[] } & Record<string, unknown>
  rating: number | null
  reviewCount: number | null
  businessStatus: string | null
  primaryImageUrl: string | null
  secondaryImageUrl: string | null
}

export interface ImportPreviewResult {
  preview: ImportPreview
  /** An existing business this import matches, or null. */
  duplicate: AdminBusiness | null
}

/** Admin-confirmed field values written on import. */
export interface ImportApplyFields {
  name?: string | null
  phone?: string | null
  website?: string | null
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  category?: string | null
  openingTime?: string | null
  closingTime?: string | null
  rating?: number | null
  reviewCount?: number | null
  businessStatus?: string | null
  primaryImageUrl?: string | null
  secondaryImageUrl?: string | null
}

export interface ImportApplyInput {
  source?: string
  url: string
  placeId?: string | null
  mode: 'create' | 'update' | 'ignore'
  businessId?: string | null
  fields?: ImportApplyFields
}

export interface ImportApplyResult {
  business: AdminBusiness | null
  mode: string
  updatedFields: string[]
  updatedCount: number
}

export interface ImportLog {
  id: string
  source: string
  sourceUrl: string | null
  placeId: string | null
  status: string
  updatedFields: string[]
  message: string | null
  importedBy: string
  businessId: string | null
  businessName: string | null
  ipAddress: string | null
  createdAt: string | null
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
