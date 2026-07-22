/** Promotion engine types (Phase 7.2b, 07A). */

export type PromotionTypeKey =
  | 'percentage'
  | 'flat'
  | 'happy_hour'
  | 'flash_sale'
  | 'weekend'
  | 'festival'
  | 'bogo'
  | 'quantity_discount'

export type PromotionStatusKey = 'draft' | 'scheduled' | 'running' | 'paused' | 'expired'

export interface Promotion {
  id: string
  name: string
  type: PromotionTypeKey
  typeLabel: string | null
  status: PromotionStatusKey
  productId: string | null
  productName: string | null
  discountType: 'percentage' | 'flat' | null
  value: number | null
  buyQty: number | null
  getQty: number | null
  minQty: number | null
  startsAt: string | null
  endsAt: string | null
  dailyStartTime: string | null
  dailyEndTime: string | null
  autoStart: boolean
  autoStop: boolean
  priority: number
  isActiveNow: boolean
  createdAt: string | null
}

export interface PromotionFormValues {
  promotion_type: PromotionTypeKey
  name: string
  product_id?: string | null
  discount_type?: 'percentage' | 'flat' | null
  value?: number | null
  buy_qty?: number | null
  get_qty?: number | null
  min_qty?: number | null
  starts_at?: string | null
  ends_at?: string | null
  daily_start_time?: string | null
  daily_end_time?: string | null
  auto_start?: boolean
  auto_stop?: boolean
  priority?: number | null
}

export const PROMOTION_TYPES: { value: PromotionTypeKey; label: string; hint: string }[] = [
  { value: 'percentage', label: 'Percentage off', hint: 'e.g. 20% off' },
  { value: 'flat', label: 'Flat discount', hint: 'e.g. ₹50 off' },
  { value: 'happy_hour', label: 'Happy hour', hint: 'Discount within a daily time window' },
  { value: 'flash_sale', label: 'Flash sale', hint: 'Short, time-boxed discount' },
  { value: 'weekend', label: 'Weekend offer', hint: 'Discount over a date range' },
  { value: 'festival', label: 'Festival offer', hint: 'Seasonal discount' },
  { value: 'bogo', label: 'Buy X get Y', hint: 'e.g. Buy 1 get 1' },
  { value: 'quantity_discount', label: 'Quantity discount', hint: 'Discount above a min quantity' },
]

export const PROMOTION_STATUS_TONE: Record<
  PromotionStatusKey,
  'success' | 'info' | 'warning' | 'neutral' | 'danger'
> = {
  running: 'success',
  scheduled: 'info',
  paused: 'warning',
  draft: 'neutral',
  expired: 'danger',
}
