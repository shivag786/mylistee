/**
 * Customer order API (Phase 7.5).
 */
import { apiClient } from '@/services/apiClient'
import type { Order, PaymentMethodKey } from '@/features/owner/orderTypes'
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
  /** Pay online now, or cash at the counter. Omit ⇒ cash, as before. */
  paymentChoice?: PaymentMethodKey
}

/** Everything Razorpay Checkout needs, straight from the server. */
export interface OrderCheckoutSession {
  keyId: string
  orderId: string
  /** In paise, exactly as Razorpay wants it. */
  amount: number
  currency: string
  name: string
  description: string
  logo: string | null
  themeColor: string | null
  prefill?: { name?: string; email?: string; contact?: string }
}

export interface VerifyOrderPaymentPayload {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}

export const customerOrderService = {
  place: (payload: PlaceOrderPayload): Promise<Order> => apiClient.post<Order>('orders', payload),
  list: (): Promise<Order[]> => apiClient.get<Order[]>('orders'),

  /** Open Checkout for an order's online share. */
  startPayment: (orderId: string): Promise<OrderCheckoutSession> =>
    apiClient.post<OrderCheckoutSession>(`orders/${orderId}/payment`),

  /** Hand Checkout's signed response to the server, which alone decides it paid. */
  verifyPayment: (orderId: string, payload: VerifyOrderPaymentPayload): Promise<Order> =>
    apiClient.post<Order>(`orders/${orderId}/payment/verify`, payload),

  /** The customer closed the window: withdraw the unpaid order, return its coins. */
  releasePayment: (orderId: string): Promise<Order> =>
    apiClient.post<Order>(`orders/${orderId}/payment/release`),
}
