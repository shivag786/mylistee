/** "Notify customers" — the shop's push notifications to its followers and customers. */
import { apiClient } from '@/services/apiClient'

export type PushAudience = 'everyone' | 'followers' | 'customers' | 'lapsed'

export interface PushSummary {
  /** Why sending is off right now (module off, plan, quiet hours, …); null = can send. */
  blockedReason: string | null
  /** Customers reachable this month; `limit` null = unlimited. */
  reach: { limit: number | null; used: number; remaining: number | null }
  sends: { limit: number | null; used: number }
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
}

export const pushService = {
  summary: (): Promise<PushSummary> => apiClient.get<PushSummary>('business/push'),
  send: (input: PushInput): Promise<{ id: string; recipients: number; reachable: number }> =>
    apiClient.post('business/push', input),
}
