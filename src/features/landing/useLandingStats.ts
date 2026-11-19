/** Live shop, city and category numbers for the landing page (GET /landing/stats). */
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/apiClient'

export interface LandingStats {
  shops: number
  cities: { name: string; shops: number }[]
  cityCount: number
  categories: { name: string; shops: number }[]
  customers: number
  orders: number
}

export function useLandingStats() {
  return useQuery<LandingStats>({
    queryKey: ['landing', 'stats'],
    queryFn: () => apiClient.get<LandingStats>('landing/stats', { auth: false }),
    staleTime: 10 * 60_000,
  })
}
