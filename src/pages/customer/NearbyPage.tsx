import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Zap, MapPin, LocateFixed, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useNearbyBusinesses } from '@/features/businesses/hooks/useNearbyBusinesses'
import { useUserLocation } from '@/features/businesses/hooks/useUserLocation'
import { ShopCard } from '@/features/businesses/components/ShopCard'
import { ShopCardSkeleton } from '@/features/businesses/components/ShopCardSkeleton'

export function NearbyPage() {
  const [searchParams] = useSearchParams()
  const spinOnly = searchParams.get('spin') === '1'
  const { coords, status, request } = useUserLocation()

  // With coordinates the service switches to sort=nearest and the API returns
  // each shop's distance, which ShopCard already renders.
  const { data, isLoading } = useNearbyBusinesses(coords ? { lat: coords.lat, lng: coords.lng } : {})

  // "Spin waiting" entry point (home) → only shops that currently have a spin.
  const shops = useMemo(() => {
    const list = data ?? []
    return spinOnly ? list.filter((b) => b.spinAvailable) : list
  }, [data, spinOnly])

  return (
    <div className="space-y-4">
      <h1 className="text-title font-bold text-foreground">{spinOnly ? 'Spin & win nearby' : 'Nearby you'}</h1>

      <LocationBar status={status} onRequest={request} />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ShopCardSkeleton key={i} />
          ))}
        </div>
      ) : shops.length === 0 ? (
        <EmptyState
          icon={<Zap className="size-7" />}
          title={spinOnly ? 'No spins available right now' : 'No shops nearby'}
          description={spinOnly ? 'Check back soon — new spin rewards appear here.' : undefined}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {shops.map((business) => (
            <ShopCard key={business.id} business={business} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Location control for the nearby list. Nothing is requested until the visitor
 * asks — an unprompted permission dialog on page load is hostile, and a denied
 * prompt cannot be re-asked without the visitor changing browser settings.
 */
function LocationBar({ status, onRequest }: { status: string; onRequest: () => void }) {
  if (status === 'ready') {
    return (
      <p className="flex items-center gap-1.5 text-caption text-text-secondary">
        <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
        Sorted by distance from you
        <button
          type="button"
          onClick={onRequest}
          className="font-medium text-primary underline underline-offset-2"
        >
          Update
        </button>
      </p>
    )
  }

  if (status === 'locating') {
    return (
      <p className="flex items-center gap-1.5 text-caption text-text-secondary">
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
        Finding your location…
      </p>
    )
  }

  if (status === 'denied') {
    return (
      <p className="flex items-center gap-1.5 text-caption text-text-secondary">
        <MapPin className="size-4 shrink-0 text-text-muted" aria-hidden />
        Location is blocked — allow it in your browser settings to sort by distance.
      </p>
    )
  }

  if (status === 'unavailable') {
    return (
      <p className="flex items-center gap-1.5 text-caption text-text-secondary">
        <MapPin className="size-4 shrink-0 text-text-muted" aria-hidden />
        We couldn&apos;t get your location.
        <button
          type="button"
          onClick={onRequest}
          className="font-medium text-primary underline underline-offset-2"
        >
          Try again
        </button>
      </p>
    )
  }

  return (
    <Button variant="outline" size="sm" leftIcon={<LocateFixed className="size-4" />} onClick={onRequest}>
      Use my location
    </Button>
  )
}
