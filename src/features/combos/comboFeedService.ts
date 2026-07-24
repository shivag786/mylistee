/**
 * Public combos feed API. Service-layer rule: UI never calls the API directly.
 */
import { apiClient } from '@/services/apiClient'
import type { ComboDeal } from './types'

export const comboFeedService = {
  list: (limit = 12): Promise<ComboDeal[]> =>
    apiClient.get<ComboDeal[]>('combos', { query: { limit } }),
}
