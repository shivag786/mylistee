/** Owner-panel insight pages: subscriptions, vendor health, QR scans. */
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/apiClient'

export interface PageInfo {
  page: number
  lastPage: number
  total: number
}

export interface SubscriptionRow {
  id: string
  shop: string | null
  shopId: string | null
  owner: string | null
  phone: string | null
  plan: string | null
  price: number
  interval: string
  status: string
  autoRenew: boolean
  startsAt: string | null
  endsAt: string | null
  daysLeft: number | null
}

export interface SubscriptionsData {
  summary: { active: number; expiringWeek: number; expiredMonth: number; freeShops: number }
  items: SubscriptionRow[]
  meta: PageInfo
}

export interface HealthRow {
  id: string
  name: string
  slug: string
  city: string | null
  category: string | null
  owner: string | null
  phone: string | null
  score: number
  issues: { key: string; label: string }[]
}

export interface HealthData {
  total: number
  issues: { key: string; label: string; count: number }[]
  items: HealthRow[]
  meta: PageInfo
}

export interface QrScansData {
  days: number
  totalScans: number
  uniqueCustomers: number
  shopsScanned: number
  shopsNotScanned: number
  allTimeScans: number
  series: { date: string; scans: number }[]
  topShops: { id: string; name: string; city: string | null; category: string | null; scans: number; customers: number }[]
  byCategory: { category: string; scans: number }[]
  byCity: { city: string; scans: number }[]
}

type Q = Record<string, string | number | undefined>
const clean = (q: Q) => Object.fromEntries(Object.entries(q).filter(([, v]) => v !== undefined && v !== '')) as Record<string, string | number>

export const useAdminSubscriptions = (q: { status: string; search?: string; page: number }) =>
  useQuery({
    queryKey: ['admin', 'subscriptions', q] as const,
    queryFn: () => apiClient.get<SubscriptionsData>('admin/subscriptions', { query: clean(q) }),
    placeholderData: keepPreviousData,
  })

export const useVendorHealth = (q: { issue?: string; search?: string; page: number }) =>
  useQuery({
    queryKey: ['admin', 'vendor-health', q] as const,
    queryFn: () => apiClient.get<HealthData>('admin/vendor-health', { query: clean(q) }),
    placeholderData: keepPreviousData,
  })

export const useQrScans = (days: number) =>
  useQuery({
    queryKey: ['admin', 'qr-scans', days] as const,
    queryFn: () => apiClient.get<QrScansData>('admin/qr-scans', { query: { days } }),
    placeholderData: keepPreviousData,
  })

/** "9876543210" → a wa.me link with a ready message. */
export function whatsappLink(phone: string | null, text: string): string | null {
  const digits = (phone ?? '').replace(/\D/g, '')
  if (digits.length < 10) return null
  const full = digits.length === 10 ? `91${digits}` : digits
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`
}
