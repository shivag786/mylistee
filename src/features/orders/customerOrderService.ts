/**
 * Customer order API (Phase 7.5).
 */
import { apiClient } from '@/services/apiClient'
import type { Order } from '@/features/owner/orderTypes'
import type { ServiceType } from './serviceTypes'

export interface PlaceOrderPayload {
  business: string
  items: { type: 'product' | 'combo'; id: string; quantity: number }[]
  coinsToUse?: number
  note?: string
  /** How the order is served (Phase 7.6). Omit ⇒ backend uses the shop's default. */
  serviceType?: ServiceType
  /** Table uuid for a dine-in order (optional — "order to the waiter" leaves it out). */
  table?: string
  /** Delivery address (required when serviceType is 'delivery'). */
  serviceAddress?: string
}

export const customerOrderService = {
  place: (payload: PlaceOrderPayload): Promise<Order> => apiClient.post<Order>('orders', payload),
  list: (): Promise<Order[]> => apiClient.get<Order[]>('orders'),
}
