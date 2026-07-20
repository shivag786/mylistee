/**
 * Formatting helpers. Defaults to the Indian locale (₹, en-IN) since the
 * product launches in India (document/phase/01 §Image Guidelines).
 */

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

/** ₹1,250 */
export function formatCurrency(amount: number): string {
  return inr.format(amount)
}

/** "2.4 km" / "800 m" */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

/** "17 Jul 2026" */
export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/** Friendly relative expiry, e.g. "Expires today", "Expires in 3 days". */
export function formatExpiry(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000)
  if (days < 0) return 'Expired'
  if (days === 0) return 'Expires today'
  if (days === 1) return 'Expires tomorrow'
  return `Expires in ${days} days`
}

/** Short relative time, e.g. "just now", "5m ago", "3h ago", "2d ago". */
export function formatRelative(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const seconds = Math.round((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}

/** First letters for avatar fallbacks, e.g. "Ravi Kumar" -> "RK". */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
