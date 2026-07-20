import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { businessService, type NearbyParams } from '../services/businessService'

/** Nearby businesses for the customer home / discovery screens. */
export function useNearbyBusinesses(params: NearbyParams = {}) {
  return useQuery({
    queryKey: queryKeys.businesses.nearby(params),
    queryFn: () => businessService.getNearby(params),
  })
}
