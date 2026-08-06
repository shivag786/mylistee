import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useNearbyBusinesses } from '@/features/businesses/hooks/useNearbyBusinesses'
import { ShopCard } from '@/features/businesses/components/ShopCard'
import { ShopCardSkeleton } from '@/features/businesses/components/ShopCardSkeleton'

export function NearbyPage() {
  const [searchParams] = useSearchParams()
  const spinOnly = searchParams.get('spin') === '1'
  const { data, isLoading } = useNearbyBusinesses()

  // "Spin waiting" entry point (home) → only shops that currently have a spin.
  const shops = useMemo(() => {
    const list = data ?? []
    return spinOnly ? list.filter((b) => b.spinAvailable) : list
  }, [data, spinOnly])

  return (
    <div className="space-y-4">
      <h1 className="text-title font-bold text-foreground">{spinOnly ? 'Spin & win nearby' : 'Nearby you'}</h1>

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
