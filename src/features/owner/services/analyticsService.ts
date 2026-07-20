/**
 * Business analytics API (Milestone 12). Goes through the shared apiClient
 * (service-layer rule, document/phase/04). Backend is the source of truth for
 * every aggregate — nothing is computed on the client.
 */
import { apiClient } from '@/services/apiClient'
import type { AnalyticsData } from '../types'

export const analyticsService = {
  async get(days: number): Promise<AnalyticsData> {
    return apiClient.get<AnalyticsData>(`business/analytics?days=${days}`)
  },
}
