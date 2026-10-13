/**
 * Public combos feed API. Service-layer rule: UI never calls the API directly.
 */
import { apiClient } from '@/services/apiClient'
import type { ComboDeal } from './types'

export const comboFeedService = {
  /** Ranked for the viewer: followed shops, then nearby (lat/lng), max two per shop. */
  list: (params: { limit?: number; lat?: number; lng?: number } = {}): Promise<ComboDeal[]> =>
    apiClient.get<ComboDeal[]>('combos', { query: { limit: params.limit ?? 12, lat: params.lat, lng: params.lng } }),
}
