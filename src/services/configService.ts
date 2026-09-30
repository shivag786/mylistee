/** Public app config (GET /config) — feature flags + the order-alert sound. */
import { apiClient } from '@/services/apiClient'

export interface AppConfig {
  flags: {
    homeCategoryFilter: boolean
    /**
     * Whether this app behaves as an installable PWA at all. Off means no
     * install banner, no service worker, and no manifest — see PwaController.
     */
    pwa: boolean
  }
  /** Admin-set new-order alert sound for owners (null = built-in ding). */
  orderSoundUrl: string | null
  /** Which owner-menu modules are enabled (admin-controlled). Missing key ⇒ on. */
  ownerModules: Record<string, boolean>
  /**
   * Whether a live payment gateway is configured on the server — a boolean only,
   * never a key. False in local development without Razorpay credentials, where
   * a paid upgrade falls back to the pre-gateway simulated switch instead of
   * opening Checkout.
   */
  payments: {
    razorpay: boolean
    /** Convenience fee on the online share of an order, in percent. */
    convenienceFeePercent?: number
  }
  /**
   * Which ways in the customer login page offers. The server keeps at least one
   * on. Absent on an older API, which only had Google.
   */
  auth?: { google: boolean; mobile: boolean }
}

export const configService = {
  get: () => apiClient.get<AppConfig>('config'),
}
