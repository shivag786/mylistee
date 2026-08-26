import { useEffect, useState, type ReactNode } from 'react'
import { useUserLocation } from '@/features/businesses/hooks/useUserLocation'
import { LocationContext } from './locationContext'
import { reverseGeocode } from './geocodeService'

const LABEL_KEY = 'listee:placeLabel'

/**
 * One shared location for the whole customer app.
 *
 * This has to be a provider rather than a hook used in several places:
 * useUserLocation owns permission state, so two independent instances would
 * each prompt and could disagree about whether we have a fix.
 */
export function LocationProvider({ children }: { children: ReactNode }) {
  const { coords, status, request } = useUserLocation()

  // Seeded from storage so the header shows the last known area immediately
  // rather than flashing "Current location" while the geocode round-trips.
  const [label, setLabel] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LABEL_KEY)
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (!coords) return

    const controller = new AbortController()
    reverseGeocode(coords, controller.signal)
      .then((place) => {
        if (!place) return
        setLabel(place)
        try {
          localStorage.setItem(LABEL_KEY, place)
        } catch {
          // Storage blocked — the label just won't survive a reload.
        }
      })
      .catch(() => {
        // Aborted, offline, or the provider refused — keep the generic label.
      })

    return () => controller.abort()
  }, [coords])

  return (
    <LocationContext.Provider value={{ coords, status, label, request }}>
      {children}
    </LocationContext.Provider>
  )
}
