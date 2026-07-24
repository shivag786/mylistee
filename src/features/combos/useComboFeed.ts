import { useQuery } from '@tanstack/react-query'
import { comboFeedService } from './comboFeedService'
import type { ComboDeal } from './types'

/** Home "Meal combos" row — active combos across shops (auto-hides when empty). */
export function useComboFeed(limit = 12) {
  return useQuery<ComboDeal[]>({
    queryKey: ['combos', 'feed', limit],
    queryFn: () => comboFeedService.list(limit),
    staleTime: 1000 * 60 * 3,
  })
}
