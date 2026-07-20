import { apiClient } from '@/services/apiClient'

export interface HealthStatus {
  status: string
  service: string
  environment: string
  database: string
  time: string
  version: string
}

/** Confirms the frontend can reach the Laravel API (Milestone 1 handshake). */
export const healthService = {
  check(): Promise<HealthStatus> {
    return apiClient.get<HealthStatus>('health', { auth: false })
  },
}
