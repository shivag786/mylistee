/**
 * Promotion engine API — "Grow Sales" (Phase 7.2b, 07A). No image upload, so
 * plain JSON. Service-layer rule: UI never calls the API directly.
 */
import { apiClient } from '@/services/apiClient'
import type { Promotion, PromotionFormValues } from '../promotionTypes'

/** Drop undefined/null/'' so the backend applies its own defaults. */
function clean(values: Partial<PromotionFormValues>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null || value === '') continue
    out[key] = value
  }
  return out
}

export const promotionService = {
  list: (params?: { product?: string; status?: string }): Promise<Promotion[]> =>
    apiClient.get<Promotion[]>('business/promotions', {
      query: { product: params?.product || undefined, status: params?.status || undefined },
    }),

  create: (values: PromotionFormValues): Promise<Promotion> =>
    apiClient.post<Promotion>('business/promotions', clean(values)),

  update: (id: string, values: Partial<PromotionFormValues>): Promise<Promotion> =>
    apiClient.put<Promotion>(`business/promotions/${id}`, clean(values)),

  setStatus: (id: string, action: 'pause' | 'resume'): Promise<Promotion> =>
    apiClient.patch<Promotion>(`business/promotions/${id}/status`, { action }),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`business/promotions/${id}`).then(() => undefined),
}
