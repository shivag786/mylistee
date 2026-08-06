/**
 * Owner service-mode + dining-table API (Phase 7.6). Service-layer rule: UI never
 * calls the API directly. Covers which fulfilment modes the shop offers, its
 * delivery fee, and CRUD for dine-in tables (each with a derived scan URL).
 */
import { apiClient } from '@/services/apiClient'
import type { ServiceType } from '@/features/orders/serviceTypes'

export interface ServiceSettings {
  modes: ServiceType[]
  defaultMode: ServiceType
  deliveryFee: number
}

export interface ServiceSettingsInput {
  modes: ServiceType[]
  defaultMode: ServiceType
  deliveryFee: number
}

export interface OwnerTable {
  id: string
  label: string
  capacity: number | null
  sortOrder: number
  scanCount: number
  status: 'active' | 'inactive'
  /** The URL its QR encodes: {profile}?table={uuid}. */
  qrUrl: string | null
}

export interface TableInput {
  label: string
  capacity?: number | null
  status?: 'active' | 'inactive'
}

export const serviceSettingsService = {
  getSettings: (): Promise<ServiceSettings> => apiClient.get<ServiceSettings>('business/service-settings'),

  updateSettings: (input: ServiceSettingsInput): Promise<ServiceSettings> =>
    apiClient.put<ServiceSettings>('business/service-settings', input),

  listTables: (): Promise<OwnerTable[]> => apiClient.get<OwnerTable[]>('business/tables'),

  createTable: (input: TableInput): Promise<OwnerTable> =>
    apiClient.post<OwnerTable>('business/tables', input),

  updateTable: (id: string, input: TableInput): Promise<OwnerTable> =>
    apiClient.put<OwnerTable>(`business/tables/${id}`, input),

  deleteTable: (id: string): Promise<void> => apiClient.delete(`business/tables/${id}`).then(() => undefined),
}
