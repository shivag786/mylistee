import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { businessService } from '../services/businessService'
import { useAppLocation } from '@/features/location/useAppLocation'

/** Admin-verified shops, top-rated first — the home "Recommended" row. */
export function useRecommendedBusinesses() {
  const { city } = useAppLocation()
  return useQuery({
    queryKey: queryKeys.businesses.recommended(city),
    queryFn: () =>
      businessService.list({
        ...(city ? { city } : {}),
        verified: 1,
        withContent: 1,
        sort: 'rating',
        perPage: 12,
      }),
  })
}

/**
 * Shops onboarded in the last 14 days — the home "New shops" row.
 *
 * Deliberately WITHOUT `withContent`: that filter requires a live offer, a
 * visible product or a visible combo, and a shop that was just added has none
 * of those yet. It was keeping brand-new shops off the one row that exists to
 * show them.
 */
export function useNewBusinesses() {
  const { city } = useAppLocation()
  return useQuery({
    queryKey: queryKeys.businesses.new(city),
    queryFn: () =>
      businessService.list({ ...(city ? { city } : {}), new: 1, sort: 'newest', perPage: 12 }),
  })
}
