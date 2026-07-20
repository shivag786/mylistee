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
