/** Order types (Phase 7.5). */
import type { ServiceType } from '@/features/orders/serviceTypes'

export type OrderStatusKey =
  /** Paid online and waiting for the money. The shop never sees these. */
  | 'awaiting_payment'
  | 'placed'
  | 'confirmed'
  | 'paid'
  | 'completed'
  | 'cancelled'

export type PaymentMethodKey = 'cod' | 'online'

export interface OrderItemLine {
  /** The line's id, for changing it (shop side). */
  id?: number
  name: string
  itemType: 'product' | 'combo'
  unitPrice: number
  quantity: number
  lineTotal: number
  /** Add-ons picked with it; the size is already in `name`. */
  addons?: string[]
  /** GST rate on this line (%), when the shop bills GST. */
  taxRate?: number | null
}

/** The GST part of a bill. */
export interface OrderTax {
  mode: 'exclusive' | 'inclusive'
  taxable: number
  cgst: number
  sgst: number
  total: number
  serviceCharge: number
  serviceChargePercent: number
  roundOff: number
  /** Per GST rate: taxable value and tax, for the summary on the invoice. */
  rates?: { rate: number; taxable: number; tax: number }[]
}

/** Who issued the bill (single-order view only). */
export interface OrderSeller {
  name: string
  legalName: string
  gstin: string | null
  fssai: string | null
  address: string | null
  phone: string | null
  placeOfSupply: string | null
  sac: string
  footer: string | null
  isTaxInvoice: boolean
}

export interface Order {
  id: string
  token: string
  /** The order's number of the day at the shop (1, 2, 3...). */
  serial?: number | null
  status: OrderStatusKey
  serviceType: ServiceType
  serviceLabel: string
  /** How the order was paid (set when marked paid), else null. */
  paymentMethod: PaymentMethodKey | null
  paymentLabel: string | null
  tableLabel: string | null
  serviceAddress: string | null
  /** Home delivery: the number to call, and the map pin when one was set. */
  deliveryPhone?: string | null
  deliveryLocation?: { lat: number; lng: number } | null
  subtotal: number
  coinsUsed: number
  coinDiscount: number
  /** The shop's automatic bill discount. */
  billDiscount?: number
  couponDiscount?: number
  couponCode?: string | null
  deliveryFee: number
  /** Discount given at the counter. */
  manualDiscount?: number
  tax?: OrderTax | null
  /** Set once the bill is paid, on a shop with GST billing. */
  invoiceNo?: string | null
  seller?: OrderSeller
  total: number
  /** Shop-only: Listee's platform fee, the gateway's share, and what the shop keeps. */
  platformFee?: number
  gatewayFee?: number
  vendorEarning?: number | null
  /** What the customer picked at checkout. Null on orders from before online payment. */
  paymentChoice?: PaymentMethodKey | null
  /** The part of `total` taken online. */
  onlineAmount?: number
  /** Charged on top of the online share -- never part of `total`. */
  convenienceFee?: number
  paidOnline?: boolean
  /** What the shop still collects in person. */
  amountDue?: number
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

/** POS changes to an order still in play. */
export interface OrderEditInput {
  /** Table uuid, or null to clear. */
  table?: string | null
  /** Order line id -> new quantity (0 removes). */
  quantities?: Record<string, number>
  add?: { type: 'product' | 'combo'; id: string; quantity: number; variant?: string }[]
}

export const ORDER_STATUS_TONE: Record<OrderStatusKey, 'info' | 'warning' | 'success' | 'neutral' | 'danger'> = {
  awaiting_payment: 'neutral',
  placed: 'warning',
  confirmed: 'info',
  paid: 'success',
  completed: 'neutral',
  cancelled: 'danger',
}
