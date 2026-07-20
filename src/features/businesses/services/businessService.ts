/**
 * Customer business discovery — now live against the Laravel API
 * (document/phase/11 GET /businesses). Home / Nearby / Search all read through
 * here via the service layer.
 */
import { apiClient } from '@/services/apiClient'
import type { Business } from '../types'

export type NearbyParams = {
  lat?: number
  lng?: number
  category?: string
  search?: string
  sort?: 'newest' | 'rating' | 'name' | 'nearest'
}

export const businessService = {
  async getNearby(params: NearbyParams = {}): Promise<Business[]> {
    const sort = params.sort ?? (params.lat && params.lng ? 'nearest' : 'newest')
    return apiClient.get<Business[]>('businesses', {
      query: { ...params, sort },
    })
  },

  async search(term: string): Promise<Business[]> {
    return apiClient.get<Business[]>('businesses', { query: { search: term, sort: 'rating' } })
  },
}
