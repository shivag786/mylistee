import { useQuery } from '@tanstack/react-query'
import { useFeedLocation } from '@/features/location/useFeedLocation'
import { dealService } from './dealService'
import type { Deal } from './types'

/** Home "Today's Deals" row — product promotions running right now, ranked for this viewer. */
export function useDeals(limit = 12) {
  const { lat, lng, viewer } = useFeedLocation()
  return useQuery<Deal[]>({
    queryKey: ['deals', { limit, lat, lng, viewer }],
    queryFn: () => dealService.list({ limit, lat, lng }),
  })
}

/** Festival-only deals — the home "Festival specials" row (auto-hides when empty). */
export function useFestivalDeals(limit = 12) {
  const { lat, lng, viewer } = useFeedLocation()
  return useQuery<Deal[]>({
    queryKey: ['deals', { limit, type: 'festival', lat, lng, viewer }],
    queryFn: () => dealService.list({ limit, type: 'festival', lat, lng }),
  })
}
