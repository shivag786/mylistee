/**
 * Public deals feed API. Service-layer rule: UI never calls the API directly
 * (document/phase/04).
 */
import { apiClient } from '@/services/apiClient'
import type { Deal } from './types'

export const dealService = {
  list: (params: { limit?: number; type?: string } = {}): Promise<Deal[]> =>
    apiClient.get<Deal[]>('deals', {
      query: { limit: params.limit ?? 12, type: params.type || undefined },
    }),
}
