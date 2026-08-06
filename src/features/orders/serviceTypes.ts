/**
 * Service (fulfilment) modes — the additive layer over the Phase 7.5 order flow
 * so one order system fits every business category (Phase 7.6). Mirrors the
 * backend App\Enums\ServiceType. Shared by the customer checkout and the owner
 * settings/order screens.
 */
import { Store, Utensils, ShoppingBag, Bike, type LucideIcon } from 'lucide-react'

export type ServiceType = 'pickup' | 'dine_in' | 'takeaway' | 'delivery'

export const SERVICE_TYPES: ServiceType[] = ['pickup', 'dine_in', 'takeaway', 'delivery']

interface ServiceMeta {
  label: string
  /** Short helper shown under the mode in the picker. */
  hint: string
  icon: LucideIcon
}

export const SERVICE_META: Record<ServiceType, ServiceMeta> = {
  pickup: { label: 'Pickup', hint: 'Collect at the counter', icon: Store },
  dine_in: { label: 'Dine-in', hint: 'Served at your table', icon: Utensils },
  takeaway: { label: 'Takeaway', hint: 'Packed to go', icon: ShoppingBag },
  delivery: { label: 'Delivery', hint: 'Delivered to you', icon: Bike },
}

export function serviceLabel(type: ServiceType): string {
  return SERVICE_META[type]?.label ?? type
}

/** Badge tone per mode — reuses the shared Badge tones. */
export const SERVICE_TONE: Record<ServiceType, 'info' | 'success' | 'warning' | 'primary' | 'neutral'> = {
  pickup: 'neutral',
  dine_in: 'info',
  takeaway: 'warning',
  delivery: 'primary',
}
