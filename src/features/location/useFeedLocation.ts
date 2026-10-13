import { useAuth } from '@/features/auth/hooks/useAuth'
import { useAppLocation } from './useAppLocation'

/**
 * What the ranked home feeds (deals, combos) need to know about the viewer:
 * where they are, rounded to ~100 m so small GPS jitter doesn't refetch, and
 * who they are, since shops they follow rank first.
 */
export function useFeedLocation(): { lat?: number; lng?: number; viewer: string } {
  const { coords } = useAppLocation()
  const { user } = useAuth()
  const round = (v: number) => Math.round(v * 1000) / 1000

  return {
    lat: coords ? round(coords.lat) : undefined,
    lng: coords ? round(coords.lng) : undefined,
    viewer: user?.id ?? 'guest',
  }
}
