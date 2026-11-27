/**
 * AI menu scan: photos / PDF of a printed menu → dishes for the owner to check
 * → products. Nothing is saved until `importItems` runs with the edited list.
 */
import { apiClient } from '@/services/apiClient'
import type { FoodType } from '../productTypes'

export interface ScannedVariant {
  name: string
  price: number
}

export interface ScannedItem {
  name: string
  category: string | null
  price: number | null
  description: string | null
  foodType: FoodType | null
  variants: ScannedVariant[]
  /** A dish with this name is already on the menu. */
  exists: boolean
}

export interface MenuScanStatus {
  available: boolean
  used: number
  limit: number
  maxFiles: number
}

export interface MenuScanResult {
  items: ScannedItem[]
  used: number
  limit: number
}

export interface MenuImportResult {
  created: number
  skipped: number
  /** Which dishes were already on the menu (same name in the same section). */
  skippedNames?: string[]
  failed: { name: string; reason: string }[]
  limitReached: boolean
}

export const menuScanService = {
  status: (): Promise<MenuScanStatus> => apiClient.get<MenuScanStatus>('business/menu-scan'),

  scan: (files: File[]): Promise<MenuScanResult> => {
    const form = new FormData()
    files.forEach((file) => form.append('files[]', file))
    // Reading several pages can take a while on the free AI tier.
    return apiClient.post<MenuScanResult>('business/menu-scan', form, { timeoutMs: 150_000 })
  },

  importItems: (items: Omit<ScannedItem, 'exists'>[], skipExisting: boolean): Promise<MenuImportResult> =>
    apiClient.post<MenuImportResult>('business/menu-scan/import', { items, skipExisting }, { timeoutMs: 60_000 }),
}
