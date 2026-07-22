import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { businessService } from '../services/businessService'

/** Admin-verified shops, top-rated first — the home "Recommended" row. */
export function useRecommendedBusinesses() {
  return useQuery({
    queryKey: queryKeys.businesses.recommended,
    queryFn: () => businessService.list({ verified: 1, sort: 'rating', perPage: 12 }),
    staleTime: 1000 * 60 * 5,
  })
}

/** Shops onboarded in the last 14 days — the home "New shops" row. */
export function useNewBusinesses() {
  return useQuery({
    queryKey: queryKeys.businesses.new,
    queryFn: () => businessService.list({ new: 1, sort: 'newest', perPage: 12 }),
    staleTime: 1000 * 60 * 5,
  })
}
