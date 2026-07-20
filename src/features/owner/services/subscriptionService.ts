/**
 * Subscription & billing API (Milestone 13). Service-layer rule: UI never calls
 * the API directly (document/phase/04). Backend is the source of truth for plan
 * limits — the client only displays and requests changes.
 */
import { apiClient } from '@/services/apiClient'
import type { Invoice, Plan, SubscriptionState } from '../types'

export const subscriptionService = {
  getState(): Promise<SubscriptionState> {
    return apiClient.get<SubscriptionState>('business/subscription')
  },

  listPlans(): Promise<Plan[]> {
    return apiClient.get<Plan[]>('plans', { auth: false })
  },

  subscribe(planKey: string): Promise<SubscriptionState> {
    return apiClient.post<SubscriptionState>('business/subscription', { planKey })
  },

  cancel(): Promise<SubscriptionState> {
    return apiClient.post<SubscriptionState>('business/subscription/cancel')
  },

  listInvoices(): Promise<Invoice[]> {
    return apiClient.get<Invoice[]>('business/invoices')
  },
}
