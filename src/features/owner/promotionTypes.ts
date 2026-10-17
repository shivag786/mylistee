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
  productImage: string | null
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

/** Over for good: expired, or past its end time even if the status lags. */
export function isPromotionOver(p: Pick<Promotion, 'status' | 'endsAt'>, now = Date.now()): boolean {
  return p.status === 'expired' || (p.endsAt != null && new Date(p.endsAt).getTime() < now)
}

/** Whether the offer runs at any point on the given local day. */
export function promotionRunsOn(p: Pick<Promotion, 'startsAt' | 'endsAt' | 'createdAt'>, day: Date): boolean {
  const start = new Date(day)
  start.setHours(0, 0, 0, 0)
  const end = new Date(day)
  end.setHours(23, 59, 59, 999)
  const from = new Date(p.startsAt ?? p.createdAt ?? 0).getTime()
  const to = p.endsAt ? new Date(p.endsAt).getTime() : Infinity
  return from <= end.getTime() && to >= start.getTime()
}

/** "20% off", "₹50 off", "Buy 1 get 1", "… above 3 units", "… · 16:00–19:00". */
export function promotionSummary(p: Promotion): string {
  if (p.type === 'bogo') return `Buy ${p.buyQty ?? 1} get ${p.getQty ?? 1}`
  const amount = p.discountType === 'flat' ? `₹${p.value ?? 0} off` : `${p.value ?? 0}% off`
  if (p.type === 'quantity_discount') return `${amount} above ${p.minQty ?? 2} units`
  if (p.type === 'happy_hour' && p.dailyStartTime && p.dailyEndTime) {
    return `${amount} · ${p.dailyStartTime.slice(0, 5)}–${p.dailyEndTime.slice(0, 5)}`
  }
  return amount
}
