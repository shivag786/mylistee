import type { LatLng } from './addressLookup'

/** Where to bring a home delivery and who to call. */
export interface DeliveryDraft {
  address: string
  phone: string
  point: LatLng | null
}

const STORAGE_KEY = 'listee:delivery'

/** Last ten digits, so "+91 98765 43210" becomes "9876543210". */
export function normalisePhone(raw: string): string {
  return raw.replace(/\D/g, '').slice(-10)
}

/** An Indian mobile number — what the server accepts. */
export function isValidPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone)
}

/** The last delivery details used on this device, so a repeat order is one tap. */
export function readSavedDelivery(fallbackPhone?: string | null): DeliveryDraft {
  const blank: DeliveryDraft = { address: '', phone: normalisePhone(fallbackPhone ?? ''), point: null }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return blank
    const saved = JSON.parse(raw) as Partial<DeliveryDraft>
    const point =
      saved.point && Number.isFinite(saved.point.lat) && Number.isFinite(saved.point.lng) ? saved.point : null
    return {
      address: typeof saved.address === 'string' ? saved.address : '',
      phone: typeof saved.phone === 'string' && saved.phone ? saved.phone : blank.phone,
      point,
    }
  } catch {
    return blank
  }
}

export function saveDelivery(draft: DeliveryDraft): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  } catch {
    // Storage blocked — they type it again next time.
  }
}
