import { apiClient } from '@/services/apiClient'

/** Public customer-app config — feature toggles the Super Admin controls. */
export interface AppConfig {
  flags: {
    homeCategoryFilter: boolean
  }
}

export const configService = {
  get(): Promise<AppConfig> {
    return apiClient.get<AppConfig>('config', { auth: false })
  },
}
