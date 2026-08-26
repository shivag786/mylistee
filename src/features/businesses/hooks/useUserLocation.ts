import { useCallback, useEffect, useState } from 'react'

export interface Coords {
  lat: number
  lng: number
}

export type LocationStatus =
  | 'idle' // Never asked, and no usable cached fix.
  | 'locating' // Waiting on the device.
  | 'ready' // We have coordinates.
  | 'denied' // The user refused the permission prompt.
  | 'unavailable' // No geolocation support, or the device could not get a fix.

const STORAGE_KEY = 'listee:coords'

/** A cached fix older than this is refreshed rather than trusted. */
const MAX_AGE_MS = 1000 * 60 * 30

interface Stored extends Coords {
  at: number
}

function readCache(): Stored | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Stored>
    if (typeof parsed.lat !== 'number' || typeof parsed.lng !== 'number') return null
    return { lat: parsed.lat, lng: parsed.lng, at: typeof parsed.at === 'number' ? parsed.at : 0 }
  } catch {
    return null // Unparseable or storage blocked.
  }
}

function writeCache(coords: Coords): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...coords, at: Date.now() }))
  } catch {
    // Private mode — we simply lose the fix on reload.
  }
}

/**
 * The visitor's coordinates, for distance-sorted discovery.
 *
 * The backend already does the work: pass lat/lng and it returns each shop's
 * Haversine `distanceMeters` and accepts `sort=nearest`. This only sources the
 * position.
 *
 * The last fix is cached so a returning visitor gets distance-sorted results on
 * first paint instead of after a permission round-trip. When the browser says
 * permission is already granted we refresh silently; otherwise nothing happens
 * until the user asks, because an unprompted permission dialog on load is
 * hostile.
 */
export function useUserLocation() {
  const [coords, setCoords] = useState<Coords | null>(() => {
    const cached = readCache()
    return cached ? { lat: cached.lat, lng: cached.lng } : null
  })
  const [status, setStatus] = useState<LocationStatus>(() => (readCache() ? 'ready' : 'idle'))

  const locate = useCallback((silent = false) => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable')
      return
    }

    if (!silent) setStatus('locating')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = { lat: position.coords.latitude, lng: position.coords.longitude }
        setCoords(next)
        setStatus('ready')
        writeCache(next)
      },
      (error) => {
        // A silent refresh that fails leaves any cached fix in place — the user
        // never asked, so there is nothing to report.
        if (silent) return
        setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable')
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: MAX_AGE_MS },
    )
  }, [])

  // Refresh in the background when the permission is already granted, or when
  // the cached fix has gone stale.
  useEffect(() => {
    const cached = readCache()
    const stale = !cached || Date.now() - cached.at > MAX_AGE_MS

    if (!('permissions' in navigator)) {
      if (cached && stale) locate(true)
      return
    }

    let cancelled = false
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((result) => {
        if (cancelled) return
        if (result.state === 'granted' && stale) locate(true)
        if (result.state === 'denied' && !cached) setStatus('denied')
      })
      .catch(() => {
        // Permissions API unsupported for this name — fall back to the cache.
        if (!cancelled && cached && stale) locate(true)
      })

    return () => {
      cancelled = true
    }
  }, [locate])

  return {
    coords,
    status,
    /** Prompt for the position (or retry after a failure). */
    request: useCallback(() => locate(false), [locate]),
  }
}
