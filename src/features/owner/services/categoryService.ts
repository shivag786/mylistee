import { apiClient } from '@/services/apiClient'
import type { Category } from '../types'

/** Public business categories (used by the registration/profile forms). */
export const categoryService = {
  async list(): Promise<Category[]> {
    return apiClient.get<Category[]>('categories', { auth: false })
  },
}
