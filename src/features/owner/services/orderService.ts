/**
 * Owner order-queue API (Phase 7.5). Service-layer rule: UI never calls the API
 * directly.
 */
import { apiClient } from '@/services/apiClient'
import type { Order, OrderEditInput, OrderStatusKey, PaymentMethodKey } from '../orderTypes'

export const ownerOrderService = {
  list: (params?: { status?: string }): Promise<Order[]> =>
    apiClient.get<Order[]>('business/orders', { query: { status: params?.status || undefined } }),

  edit: (id: string, input: OrderEditInput): Promise<Order> => apiClient.patch<Order>(`business/orders/${id}`, input),

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
