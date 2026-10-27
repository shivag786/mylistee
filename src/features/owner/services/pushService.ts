/** "Notify customers" — the shop's push notifications to its followers and customers. */
import { apiClient } from '@/services/apiClient'

export type PushAudience = 'everyone' | 'followers' | 'customers' | 'lapsed'

export interface PushSummary {
  /** Why sending is off right now (module off, plan, quiet hours, …); null = can send. */
  blockedReason: string | null
  /** Customers reachable this month; `limit` null = unlimited. */
  reach: { limit: number | null; used: number; remaining: number | null }
  sends: { limit: number | null; used: number }
  /** Notifications one customer can get from the shop a month; null = no cap. */
  perCustomer?: { limit: number | null }
  /** Whether the customer list shows email / phone in full or masked (set by the plan). */
  customerDetails?: 'full' | 'masked'
  audiences: { key: PushAudience; label: string; count: number; reachable: number }[]
  recent: {
    id: string
    title: string
    body: string | null
    audience: string
    recipients: number
    reachable: number
    sentAt: string | null
  }[]
}

export interface PushInput {
  audience: PushAudience
  title: string
  body?: string
  /** In-app path opened on tap, e.g. "/b/shop?item=…". */
  link?: string
  /** Send to at most this many (newest first). */
  limit?: number
  /** Only these customers (ids from the customer list). */
  customerIds?: string[]
}

export interface PushCustomer {
  id: string
  name: string
  /** Masked unless the plan shows full details. */
  email: string | null
  phone: string | null
  /** Has notifications on, on a phone. */
  onPhone: boolean
  sentThisMonth: number
  /** Already got all the notifications the plan allows this month. */
  capped: boolean
}

export interface PushCustomerPage {
  customers: PushCustomer[]
  page: number
  lastPage: number
  total: number
}

export const pushService = {
  summary: (): Promise<PushSummary> => apiClient.get<PushSummary>('business/push'),
  customers: (audience: PushAudience, search: string, page: number): Promise<PushCustomerPage> =>
    apiClient.get<PushCustomerPage>('business/push/customers', { query: { audience, search: search || undefined, page } }),
  send: (input: PushInput): Promise<{ id: string; recipients: number; reachable: number }> =>
    apiClient.post('business/push', input),
}
