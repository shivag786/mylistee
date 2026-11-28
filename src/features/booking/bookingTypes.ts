/** Table booking: floor plan, the shop's rules, slots and bookings. */
export type AreaKind = 'indoor' | 'rooftop' | 'garden' | 'hall' | 'private' | 'terrace'
export type TableShape = 'round' | 'square' | 'rect' | 'booth' | 'couple'
export type BookingStatus = 'pending' | 'confirmed' | 'declined' | 'cancelled' | 'seated' | 'completed' | 'no_show'
export type Occasion = 'birthday' | 'anniversary' | 'date' | 'family' | 'office' | 'other'
export type AdvanceMode = 'none' | 'per_guest' | 'fixed' | 'addons'

export interface FloorTable {
  /** null for a table added in the editor and not saved yet. */
  id: string | null
  /** Editor-only key while unsaved. */
  key?: string
  label: string
  seats: number
  shape: TableShape
  x: number | null
  y: number | null
  rotation: number
  tags: string[]
  bookable: boolean
  active?: boolean
}

export interface FloorArea {
  id: string | null
  key?: string
  name: string
  kind: AreaKind | 'unplaced'
  width: number
  height: number
  active: boolean
  tables: FloorTable[]
}

export interface BookingAddon {
  name: string
  price: number
  emoji?: string | null
}

export interface BookingSettings {
  enabled: boolean
  autoConfirm: boolean
  slotMinutes: number
  durationMinutes: number
  minNoticeMinutes: number
  maxDaysAhead: number
  maxGuests: number
  advanceMode: AdvanceMode
  advanceAmount: number
  cancelHours: number
  holdMinutes: number
  openTime: string | null
  closeTime: string | null
  addons: BookingAddon[]
  note: string | null
  /** The payment gateway is connected (an advance can be collected online). */
  onlinePayment: boolean
}

export interface BookingPage {
  business: { slug: string; name: string; phone: string | null }
  settings: BookingSettings
  areas: FloorArea[]
}

export interface Slot {
  time: string
  startsAt: string
  /** Table ids still free at this time. */
  free: string[]
}

export interface Availability {
  date: string
  slots: Slot[]
  closedReason: string | null
}

export interface Booking {
  id: string
  code: string
  status: BookingStatus
  name: string
  phone?: string
  guests: number
  date: string
  time: string
  startsAt: string
  endsAt: string
  area?: string
  areaKind?: AreaKind
  tables: { id: string; label: string; seats: number }[]
  occasion?: Occasion
  occasionNote?: string
  addons: { name: string; price: number; qty: number; emoji?: string | null }[]
  addonsTotal: number
  request?: string
  advanceAmount: number
  advanceStatus: 'none' | 'due' | 'paid' | 'refunded' | 'kept'
  source: 'app' | 'web' | 'phone' | 'walkin'
  reason?: string
  createdAt?: string
  business?: { slug: string; name: string; phone: string | null }
  freeCancelUntil: string
}

export interface RazorpaySession {
  keyId: string
  orderId: string
  amount: number
  currency: string
  name: string
  description: string
  logo: string | null
  themeColor: string | null
  prefill: { name?: string; email?: string; contact?: string }
}

export const OCCASIONS: { value: Occasion; label: string; emoji: string }[] = [
  { value: 'birthday', label: 'Birthday', emoji: '🎂' },
  { value: 'anniversary', label: 'Anniversary', emoji: '💍' },
  { value: 'date', label: 'Date night', emoji: '🌹' },
  { value: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
  { value: 'office', label: 'Office', emoji: '💼' },
  { value: 'other', label: 'Just dining', emoji: '🍽️' },
]

export const TABLE_TAGS: { value: string; label: string; emoji: string }[] = [
  { value: 'window', label: 'Window', emoji: '🪟' },
  { value: 'view', label: 'City view', emoji: '🌆' },
  { value: 'couple', label: 'Couple', emoji: '❤️' },
  { value: 'candle-light', label: 'Candle-light', emoji: '🕯️' },
  { value: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
  { value: 'party', label: 'Party', emoji: '🎉' },
  { value: 'sofa', label: 'Sofa', emoji: '🛋️' },
  { value: 'quiet', label: 'Quiet corner', emoji: '🤫' },
  { value: 'private', label: 'Private', emoji: '🔒' },
]

export const AREA_KINDS: { value: AreaKind; label: string; emoji: string }[] = [
  { value: 'indoor', label: 'Café / dining floor', emoji: '☕' },
  { value: 'rooftop', label: 'Rooftop', emoji: '🌃' },
  { value: 'garden', label: 'Garden / lawn', emoji: '🌳' },
  { value: 'hall', label: 'Hall / banquet', emoji: '🎊' },
  { value: 'private', label: 'Private room', emoji: '🚪' },
  { value: 'terrace', label: 'Terrace / balcony', emoji: '⛱️' },
]

export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Waiting for shop',
  confirmed: 'Confirmed',
  declined: 'Declined',
  cancelled: 'Cancelled',
  seated: 'Seated',
  completed: 'Completed',
  no_show: 'No-show',
}
