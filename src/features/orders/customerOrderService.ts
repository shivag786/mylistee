/**
 * Customer order API (Phase 7.5).
 */
import { apiClient } from '@/services/apiClient'
import type { Order } from '@/features/owner/orderTypes'

export interface PlaceOrderPayload {
  business: string
  items: { type: 'product' | 'combo'; id: string; quantity: number }[]
  coinsToUse?: number
  note?: string
}

export const customerOrderService = {
  place: (payload: PlaceOrderPayload): Promise<Order> => apiClient.post<Order>('orders', payload),
  list: (): Promise<Order[]> => apiClient.get<Order[]>('orders'),
}
