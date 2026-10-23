import { env, isGeocodingConfigured } from '@/config/env'

export interface LatLng {
  lat: number
  lng: number
}

export interface PlaceResult extends LatLng {
  /** A full, human address ("12, MG Road, Bengaluru 560001"). */
  address: string
}

/**
 * Coordinates ⇄ street addresses for home delivery.
 *
 * Google's Geocoding API when a key is configured (best for Indian addresses),
 * otherwise OpenStreetMap's Nominatim — free and keyless, which is what keeps
 * the map picker working before anyone sets up Google billing. Every function
 * returns null rather than throwing: a failed lookup just leaves the customer
 * to type the address themselves.
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org'

interface GoogleGeocode {
  status: string
  results?: Array<{ formatted_address?: string; geometry?: { location?: { lat: number; lng: number } } }>
}

interface NominatimPlace {
  lat: string
  lon: string
  display_name?: string
}

/** Shorten Nominatim's very long names: drop the country and duplicate parts. */
function tidy(name: string): string {
  const parts = name.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.at(-1)?.toLowerCase() === 'india') parts.pop()
  return [...new Set(parts)].join(', ')
}

/** The street address at a point. */
export async function addressAt(point: LatLng, signal?: AbortSignal): Promise<string | null> {
  try {
    if (isGeocodingConfigured) {
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
      url.searchParams.set('latlng', `${point.lat},${point.lng}`)
      url.searchParams.set('key', env.googleMapsApiKey)
      const res = await fetch(url, { signal })
      if (res.ok) {
        const body = (await res.json()) as GoogleGeocode
        const address = body.status === 'OK' ? body.results?.[0]?.formatted_address : undefined
        if (address) return address.replace(/, India$/, '')
      }
      // A key without Geocoding enabled answers REQUEST_DENIED — fall through to OSM.
    }

    const url = new URL(`${NOMINATIM}/reverse`)
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('lat', String(point.lat))
    url.searchParams.set('lon', String(point.lng))
    url.searchParams.set('zoom', '18')
    url.searchParams.set('addressdetails', '0')
    const res = await fetch(url, { signal, headers: { 'Accept-Language': 'en' } })
    if (!res.ok) return null
    const body = (await res.json()) as NominatimPlace
    return body.display_name ? tidy(body.display_name) : null
  } catch {
    return null
  }
}

/** Places matching a typed search, nearest-first when a point to bias towards is given. */
export async function searchPlaces(query: string, near?: LatLng | null, signal?: AbortSignal): Promise<PlaceResult[]> {
  const q = query.trim()
  if (q.length < 3) return []
  try {
    const url = new URL(`${NOMINATIM}/search`)
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('q', q)
    url.searchParams.set('limit', '5')
    url.searchParams.set('countrycodes', 'in')
    if (near) {
      // A ~50 km box around the customer, preferred but not enforced.
      const d = 0.45
      url.searchParams.set('viewbox', `${near.lng - d},${near.lat + d},${near.lng + d},${near.lat - d}`)
    }
    const res = await fetch(url, { signal, headers: { 'Accept-Language': 'en' } })
    if (!res.ok) return []
    const body = (await res.json()) as NominatimPlace[]
    return body
      .map((p) => ({ lat: Number(p.lat), lng: Number(p.lon), address: tidy(p.display_name ?? '') }))
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && p.address)
  } catch {
    return []
  }
}

/** The device's position, or a reason it could not be had. */
export function currentPosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Location isn’t available on this device.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? 'Location permission is off. Allow it in your browser, or pick on the map.'
              : 'Couldn’t get your location. Try again, or pick on the map.',
          ),
        ),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    )
  })
}

/** A link that opens directions to the point in Google Maps (works on every phone). */
export function directionsUrl(point: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}`
}
