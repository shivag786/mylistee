import { createContext } from 'react'
import type { Coords, LocationStatus } from '@/features/businesses/hooks/useUserLocation'

export interface LocationValue {
  coords: Coords | null
  status: LocationStatus
  /** Place name once geocoded, e.g. "Andheri West". Null without a Maps key. */
  label: string | null
  request: () => void
}

/**
 * Kept apart from the provider component so each module exports only one kind
 * of thing — react-refresh cannot fast-refresh a file that mixes them.
 */
export const LocationContext = createContext<LocationValue | null>(null)
