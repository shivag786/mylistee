import { useQuery } from '@tanstack/react-query'
import { dealService } from './dealService'
import type { Deal } from './types'

/** Home "Today's Deals" row — product promotions running right now. */
export function useDeals(limit = 12) {
  return useQuery<Deal[]>({
    queryKey: ['deals', { limit }],
    queryFn: () => dealService.list({ limit }),
    staleTime: 1000 * 60 * 3,
  })
}

/** Festival-only deals — the home "Festival specials" row (auto-hides when empty). */
export function useFestivalDeals(limit = 12) {
  return useQuery<Deal[]>({
    queryKey: ['deals', { limit, type: 'festival' }],
    queryFn: () => dealService.list({ limit, type: 'festival' }),
    staleTime: 1000 * 60 * 3,
  })
}
