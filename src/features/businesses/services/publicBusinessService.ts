/**
 * Live customer-facing business + spin API (document/phase/11). Replaces the
 * mock businessService for the QR-scanned profile; nearby/home listings stay on
 * mock data until their public endpoints land in Milestone 9.
 */
import { apiClient } from '@/services/apiClient'
import type { PublicBusinessResponse, SpinResult } from '../publicTypes'

export const publicBusinessService = {
  /** Public profile. Sends the token when present so the spin state is accurate. */
  async getProfile(slug: string): Promise<PublicBusinessResponse> {
    return apiClient.get<PublicBusinessResponse>(`businesses/${slug}`)
  },

  /** Spin the wheel — the backend decides the winning reward. */
  async spin(businessSlug: string): Promise<SpinResult> {
    return apiClient.post<SpinResult>('spinner/spin', { businessSlug })
  },
}
