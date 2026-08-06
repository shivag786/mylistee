/** Public app config (GET /config) — feature flags + the order-alert sound. */
import { apiClient } from '@/services/apiClient'

export interface AppConfig {
  flags: { homeCategoryFilter: boolean }
  /** Admin-set new-order alert sound for owners (null = built-in ding). */
  orderSoundUrl: string | null
  /** Which owner-menu modules are enabled (admin-controlled). Missing key ⇒ on. */
  ownerModules: Record<string, boolean>
}

export const configService = {
  get: () => apiClient.get<AppConfig>('config'),
}
