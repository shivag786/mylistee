/**
 * Public deals feed API. Service-layer rule: UI never calls the API directly
 * (document/phase/04).
 */
import { apiClient } from '@/services/apiClient'
import type { Deal } from './types'

export const dealService = {
  /** Ranked for the viewer: followed shops, then nearby (lat/lng), max two per shop. */
  list: (params: { limit?: number; type?: string; lat?: number; lng?: number } = {}): Promise<Deal[]> =>
    apiClient.get<Deal[]>('deals', {
      query: { limit: params.limit ?? 12, type: params.type || undefined, lat: params.lat, lng: params.lng },
    }),
}
