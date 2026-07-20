/** Customer favorites (document/phase/11 §Favorites). */
import { apiClient } from '@/services/apiClient'
import type { Business } from '../types'

export const favoriteService = {
  async list(): Promise<Business[]> {
    return apiClient.get<Business[]>('favorites')
  },
  async add(slug: string): Promise<void> {
    await apiClient.post('favorites', { businessSlug: slug })
  },
  async remove(slug: string): Promise<void> {
    await apiClient.delete(`favorites/${slug}`)
  },
}
