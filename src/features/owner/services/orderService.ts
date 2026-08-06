/**
 * Owner order-queue API (Phase 7.5). Service-layer rule: UI never calls the API
 * directly.
 */
import { apiClient } from '@/services/apiClient'
import type { Order, OrderStatusKey, PaymentMethodKey } from '../orderTypes'

export const ownerOrderService = {
  list: (params?: { status?: string }): Promise<Order[]> =>
    apiClient.get<Order[]>('business/orders', { query: { status: params?.status || undefined } }),

  setStatus: (
    id: string,
    status: Exclude<OrderStatusKey, 'placed'>,
    paymentMethod?: PaymentMethodKey,
  ): Promise<Order> =>
    apiClient.patch<Order>(`business/orders/${id}/status`, {
      status,
      payment_method: paymentMethod,
    }),
}
