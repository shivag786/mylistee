import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/apiClient'
import type { Banner, BannerFeed, BannerPlacement } from './types'

const EMPTY: BannerFeed = { home_top: [], home_after_combos: [] }

/** Live homepage banners grouped by placement (public). */
export function useBanners() {
  return useQuery({
    queryKey: ['banners', 'feed'] as const,
    queryFn: () => apiClient.get<BannerFeed>('banners'),
    staleTime: 1000 * 60 * 5,
  })
}

/** Convenience: the live banners for one placement, or []. */
export function useBannerSlot(placement: BannerPlacement): Banner[] {
  const { data } = useBanners()
  return (data ?? EMPTY)[placement] ?? []
}
