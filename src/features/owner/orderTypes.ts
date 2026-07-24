/** Order types (Phase 7.5). */

export type OrderStatusKey = 'placed' | 'confirmed' | 'paid' | 'completed' | 'cancelled'

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
  subtotal: number
  coinsUsed: number
  coinDiscount: number
  total: number
  coinsEarned: number
  note: string | null
  items: OrderItemLine[]
  itemCount?: number
  businessName?: string
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
