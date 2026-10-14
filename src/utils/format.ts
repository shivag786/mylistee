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

export type ProximityTone = 'here' | 'walk' | 'near' | 'far'

/**
 * How close a shop feels, in words: "You're right here" (≤ 150 m), "Walking
 * distance" (≤ 1 km), "Nearby" (≤ 3 km), else just the distance. `eta` is a
 * rough walk time up to 1.5 km and a ride time beyond — enough to decide on,
 * not a route.
 */
export function describeProximity(meters: number): { label: string; eta: string; tone: ProximityTone } {
  const walk = meters <= 1500
  // ~5 km/h on foot, ~24 km/h through town by bike or auto.
  const minutes = Math.max(1, Math.round(meters / (walk ? 80 : 400)))
  const eta = `${minutes} min ${walk ? 'walk' : 'ride'}`
  if (meters <= 150) return { label: "You're right here", eta, tone: 'here' }
  if (meters <= 1000) return { label: 'Walking distance', eta, tone: 'walk' }
  if (meters <= 3000) return { label: 'Nearby', eta, tone: 'near' }
  return { label: formatDistance(meters), eta, tone: 'far' }
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

/** "21:30:00" → "9:30 PM", "09:00" → "9 AM". */
export function formatClockTime(value: string): string {
  const [h, m] = value.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return m ? `${hour}:${String(m).padStart(2, '0')} ${suffix}` : `${hour} ${suffix}`
}
