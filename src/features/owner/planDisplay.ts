/**
 * Presentation helpers for subscription plans (Milestone 13). Feature keys come
 * from the backend `plans.features` array; labels live here so the API stays the
 * source of truth for *what* a plan includes and the UI owns *how* it reads.
 */
export const FEATURE_LABELS: Record<string, string> = {
  basic_analytics: 'Basic analytics',
  analytics: 'Full analytics dashboard',
  advanced_analytics: 'Advanced analytics',
  reviews: 'Customer reviews',
  email_support: 'Email support',
  push_notifications: 'Push notifications',
  scheduled_campaigns: 'Scheduled campaigns',
  customer_segmentation: 'Customer segmentation',
  loyalty: 'Loyalty program',
  priority_support: 'Priority support',
  multi_branch: 'Multi-branch',
  white_label: 'White-label branding',
  store_mode: 'Store mode — your QR/link shows only your shop',
  api_access: 'API access',
  dedicated_support: 'Dedicated account manager',
}

export function featureLabel(key: string): string {
  return FEATURE_LABELS[key] ?? key.replace(/_/g, ' ')
}

export function formatPrice(amount: number, currency = 'INR'): string {
  if (amount === 0) return 'Free'
  const symbol = currency === 'INR' ? '₹' : `${currency} `
  return `${symbol}${amount.toLocaleString('en-IN')}`
}

export function intervalSuffix(interval: string): string {
  if (interval === 'year') return '/yr'
  if (interval === 'lifetime') return ''
  return '/mo'
}

/** e.g. formatLimit(null, 'offers') → "Unlimited offers"; formatLimit(3, 'offers') → "3 offers". */
export function formatLimit(n: number | null, unit: string): string {
  return n === null ? `Unlimited ${unit}` : `${n} ${unit}`
}

/** A module a plan can include (mirrors backend config/plan_modules.php). */
export interface PlanModuleMeta {
  id: string
  label: string
  description: string
  group: string
}

export const PLAN_MODULES: PlanModuleMeta[] = [
  { id: 'ordering', label: 'Online ordering', description: 'Add to cart and order. Off = menu shows as a catalogue.', group: 'Orders & payments' },
  { id: 'delivery', label: 'Home delivery', description: 'Customers can order for delivery', group: 'Orders & payments' },
  { id: 'pay_counter', label: 'Pay at counter', description: 'Cash / pay at the shop', group: 'Orders & payments' },
  { id: 'pay_online', label: 'Pay online', description: 'UPI / card through Razorpay', group: 'Orders & payments' },
  { id: 'tables', label: 'Tables & dine-in', description: 'Dining tables with table QR', group: 'Orders & payments' },
  { id: 'combos', label: 'Combos', description: 'Combo deals', group: 'Sell more' },
  { id: 'grow_sales', label: 'Grow sales', description: 'Promotions and timed discounts', group: 'Sell more' },
  { id: 'rewards', label: 'Rewards & coupons', description: 'Bill discount, come-back and loyalty-step coupons, codes', group: 'Bring customers back' },
  { id: 'loyalty', label: 'Loyalty coins', description: 'Coins customers earn and spend at the shop', group: 'Bring customers back' },
  { id: 'spin_rewards', label: 'Spin rewards', description: 'Spin-and-win offers', group: 'Bring customers back' },
  { id: 'redeem', label: 'Redeem', description: 'Redeem reward PINs at the counter', group: 'Bring customers back' },
  { id: 'notifications', label: 'Notify customers', description: 'Push offers to followers and customers', group: 'Bring customers back' },
  { id: 'customers', label: 'Customers', description: "The shop's own customer list", group: 'Know your customers' },
  { id: 'reviews', label: 'Review replies', description: 'Reply to and hide reviews', group: 'Know your customers' },
  { id: 'analytics', label: 'Analytics', description: 'Sales and visit insights', group: 'Know your customers' },
  { id: 'reels', label: 'Reels', description: 'Short videos on the customer home page', group: 'Get seen' },
  { id: 'store_mode', label: 'Store mode', description: 'Link / QR visitors stay inside this shop', group: 'Get seen' },
]

/** Modules that lock reads too, so their page shows only the upgrade card. */
export const READ_LOCKED_MODULES = new Set(['analytics'])

export function planModuleLabel(id: string): string {
  return PLAN_MODULES.find((m) => m.id === id)?.label ?? id.replace(/_/g, ' ')
}

/** "3 days" / "1 day" */
export function daysLabel(n: number): string {
  return `${n} ${n === 1 ? 'day' : 'days'}`
}

/** "5d 4h left" until an ISO time; null once passed. */
export function timeLeft(iso: string | null, now = Date.now()): string | null {
  if (!iso) return null
  const ms = new Date(iso).getTime() - now
  if (ms <= 0) return null
  const h = Math.floor(ms / 3_600_000)
  const d = Math.floor(h / 24)
  if (d >= 1) return `${d}d ${h % 24}h left`
  const m = Math.floor((ms % 3_600_000) / 60_000)
  return h >= 1 ? `${h}h ${m}m left` : `${m}m left`
}

/** "3 months" / "1 month" */
export function monthsLabel(n: number): string {
  return `${n} ${n === 1 ? 'month' : 'months'}`
}

/** A plan's own length, if it has one: "30 days" / "3 months". */
export function durationLabel(plan: { durationDays?: number | null; durationMonths?: number | null }): string | null {
  if (plan.durationMonths) return monthsLabel(plan.durationMonths)
  if (plan.durationDays) return daysLabel(plan.durationDays)
  return null
}

/** How long a plan runs, for cards: " / 30 days", " / 3 months" or "/mo". */
export function planPeriod(plan: { durationDays?: number | null; durationMonths?: number | null; interval: string }): string {
  const length = durationLabel(plan)
  return length ? ` / ${length}` : intervalSuffix(plan.interval)
}
