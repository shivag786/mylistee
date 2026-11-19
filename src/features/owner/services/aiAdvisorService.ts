/**
 * AI Sales Manager (kind "sales") and AI Customer Growth Advisor (kind
 * "growth"). Ideas are only suggestions: approving creates the real offer /
 * combo / coupon (and, for growth, schedules the push notification).
 */
import { apiClient } from '@/services/apiClient'

export type AdvisorKind = 'sales' | 'growth'

export interface AdvisorProduct {
  id: number
  productId: string
  name: string
  price: number
}

export interface AdvisorOffer {
  kind: 'percent' | 'flat'
  value: number
  minOrder: number | null
  validityDays: number
}

export interface AdvisorDetails {
  // sales
  productIds?: number[]
  quantities?: Record<string, number>
  value?: number | null
  minOrder?: number | null
  days?: string[]
  timeFrom?: string | null
  timeTo?: string | null
  validityDays?: number
  buyQty?: number | null
  getQty?: number | null
  itemsTotal?: number
  expectedImpact?: string
  // growth
  pushTitle?: string
  segment?: 'everyone' | 'followers' | 'customers' | 'lapsed'
  sendTime?: string | null
  offer?: AdvisorOffer | null
  expectedResult?: string
  adjustments?: string[]
}

export interface AdvisorSuggestion {
  id: string
  kind: AdvisorKind
  type: string
  title: string
  message: string | null
  reasoning: string | null
  status: 'pending' | 'approved' | 'dismissed' | 'expired'
  products: AdvisorProduct[]
  details: AdvisorDetails
  result: {
    summary?: string
    coupon?: string
    combo?: string
    promotions?: string[]
    push?: { status: 'sent' | 'scheduled' | 'failed'; recipients?: number; error?: string; note?: string }
  } | null
  sendAt: string | null
  sentAt: string | null
  createdAt: string | null
  decidedAt: string | null
}

export type AdvisorStats = Record<string, unknown> & {
  windowDays?: number
  orders?: number
  revenue?: number
  aov?: number
  uniqueCustomers?: number
  newCustomers?: number
  repeatCustomers?: number
  repeatRatePercent?: number
  lapsedCustomers?: number
  followers?: number
  peakHours?: number[]
  slowHours?: number[]
  topItems?: { id: number; name: string; qty: number; revenue: number }[]
  topPairs?: { a: string; b: string; orders: number }[]
  rating?: { average: number; count: number }
}

export interface AdvisorState {
  kind: AdvisorKind
  available: boolean
  inPlan: boolean
  refreshesLeft: number
  generatedAt: string | null
  stats: AdvisorStats | null
  suggestions: AdvisorSuggestion[]
  history: AdvisorSuggestion[]
}

export type AdvisorEdits = Partial<{
  title: string
  message: string | null
  pushTitle: string
  value: number
  minOrder: number | null
  validityDays: number
  segment: AdvisorDetails['segment']
  sendTime: string | null
  sendNow: boolean
  offer: { type: 'percent' | 'flat'; value: number; minOrder?: number | null; validityDays?: number } | null
}>

export const aiAdvisorService = {
  get: (kind: AdvisorKind) => apiClient.get<AdvisorState>('business/ai/advisor', { query: { kind } }),
  refresh: (kind: AdvisorKind) =>
    apiClient.post<{ suggestions: AdvisorSuggestion[]; refreshesLeft: number }>('business/ai/advisor/refresh', { kind }, { timeoutMs: 120_000 }),
  approve: (id: string, edits: AdvisorEdits) =>
    apiClient.post<AdvisorSuggestion>(`business/ai/advisor/${id}/approve`, edits, { timeoutMs: 60_000 }),
  dismiss: (id: string) => apiClient.post<AdvisorSuggestion>(`business/ai/advisor/${id}/dismiss`),
}
