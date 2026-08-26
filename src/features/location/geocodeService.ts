import { env, isGeocodingConfigured } from '@/config/env'
import type { Coords } from '@/features/businesses/hooks/useUserLocation'

/**
 * Turn coordinates into a short place label for the header ("Andheri West").
 *
 * Deliberately the ONLY place that knows about a geocoding provider — the
 * location context just asks for a label. Without a key this returns null and
 * the header falls back to a generic "Current location", so the feature works
 * before anyone sets up Google Cloud billing.
 */

/** Narrow shape of the Google Geocoding response — only what we read. */
interface GeocodeResponse {
  status: string
  results?: Array<{
    address_components?: Array<{
      long_name: string
      short_name: string
      types: string[]
    }>
    formatted_address?: string
  }>
}

/**
 * Most specific first. Google returns a broad set of components; a neighbourhood
 * ("Andheri West") is far more useful in a header than a full postal address.
 */
const LABEL_TYPES = [
  'sublocality_level_1',
  'sublocality',
  'neighborhood',
  'locality',
  'administrative_area_level_2',
  'administrative_area_level_1',
]

export async function reverseGeocode(coords: Coords, signal?: AbortSignal): Promise<string | null> {
  if (!isGeocodingConfigured) return null

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('latlng', `${coords.lat},${coords.lng}`)
  url.searchParams.set('key', env.googleMapsApiKey)
  // result_type keeps the response to place-level results rather than a street
  // address, which is both smaller and closer to what we want to display.
  url.searchParams.set('result_type', 'sublocality|locality|administrative_area_level_2')

  const response = await fetch(url, { signal })
  if (!response.ok) return null

  const body = (await response.json()) as GeocodeResponse
  // REQUEST_DENIED (bad/unrestricted key), OVER_QUERY_LIMIT (billing) and
  // ZERO_RESULTS all arrive as HTTP 200 — the label just stays generic.
  if (body.status !== 'OK' || !body.results?.length) return null

  const components = body.results[0].address_components ?? []
  for (const type of LABEL_TYPES) {
    const match = components.find((c) => c.types.includes(type))
    if (match) return match.long_name
  }

  return body.results[0].formatted_address?.split(',')[0] ?? null
}
