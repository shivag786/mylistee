import { useQuery } from '@tanstack/react-query'
import { useFeedLocation } from '@/features/location/useFeedLocation'
import { comboFeedService } from './comboFeedService'
import type { ComboDeal } from './types'

/** Home "Meal combos" row — active combos across shops, ranked for this viewer (auto-hides when empty). */
export function useComboFeed(limit = 12) {
  const { lat, lng, viewer } = useFeedLocation()
  return useQuery<ComboDeal[]>({
    queryKey: ['combos', 'feed', { limit, lat, lng, viewer }],
    queryFn: () => comboFeedService.list({ limit, lat, lng }),
  })
}
