import { useEffect, useState, type ReactNode } from 'react'
import { useUserLocation } from '@/features/businesses/hooks/useUserLocation'
import { LocationContext } from './locationContext'
import { reverseGeocode, reverseGeocodeCity } from './geocodeService'

const LABEL_KEY = 'listee:placeLabel'
const CITY_KEY = 'listee:city'

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

  // Seeded the same way, and for a stronger reason: the shop list is filtered
  // by city, so a cold start without it would fetch the wrong list and then
  // refetch once the geocode came back.
  const [city, setCity] = useState<string | null>(() => {
    try {
      return localStorage.getItem(CITY_KEY)
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

  useEffect(() => {
    if (!coords) return

    const controller = new AbortController()
    reverseGeocodeCity(coords, controller.signal)
      .then((next) => {
        if (!next) return
        setCity(next)
        try {
          localStorage.setItem(CITY_KEY, next)
        } catch {
          // Storage blocked — the city just won't survive a reload.
        }
      })
      .catch(() => {
        // Aborted, offline, or no Maps key — the list falls back to unfiltered.
      })

    return () => controller.abort()
  }, [coords])

  return (
    <LocationContext.Provider value={{ coords, status, label, city, request }}>
      {children}
    </LocationContext.Provider>
  )
}
