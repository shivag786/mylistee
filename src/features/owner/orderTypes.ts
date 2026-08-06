/** Order types (Phase 7.5). */
import type { ServiceType } from '@/features/orders/serviceTypes'

export type OrderStatusKey = 'placed' | 'confirmed' | 'paid' | 'completed' | 'cancelled'

export type PaymentMethodKey = 'cod' | 'online'

export interface OrderItemLine {
  name: string
  itemType: 'product' | 'combo'
  unitPrice: number
  quantity: number
  lineTotal: number
}

export interface Order {
  id: string
  token: string
  status: OrderStatusKey
  serviceType: ServiceType
  serviceLabel: string
  /** How the order was paid (set when marked paid), else null. */
  paymentMethod: PaymentMethodKey | null
  paymentLabel: string | null
  tableLabel: string | null
  serviceAddress: string | null
  subtotal: number
  coinsUsed: number
  coinDiscount: number
  deliveryFee: number
  total: number
  coinsEarned: number
  note: string | null
  items: OrderItemLine[]
  itemCount?: number
  businessName?: string
  businessSlug?: string
  /** Whether the customer has already reviewed this shop (drives the review nudge). */
  reviewed?: boolean
  customerName?: string
  placedAt: string | null
  confirmedAt: string | null
  paidAt: string | null
  completedAt: string | null
  createdAt: string | null
}

export const ORDER_STATUS_TONE: Record<OrderStatusKey, 'info' | 'warning' | 'success' | 'neutral' | 'danger'> = {
  placed: 'warning',
  confirmed: 'info',
  paid: 'success',
  completed: 'neutral',
  cancelled: 'danger',
}
