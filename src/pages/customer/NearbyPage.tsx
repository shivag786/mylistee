import { useNearbyBusinesses } from '@/features/businesses/hooks/useNearbyBusinesses'
import { BusinessCard } from '@/features/businesses/components/BusinessCard'
import { BusinessCardSkeleton } from '@/features/businesses/components/BusinessCardSkeleton'

export function NearbyPage() {
  const { data, isLoading } = useNearbyBusinesses()

  return (
    <div className="space-y-4">
      <h1 className="text-title font-bold text-foreground">Nearby you</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <BusinessCardSkeleton key={i} />)
          : data?.map((business) => <BusinessCard key={business.id} business={business} />)}
      </div>
    </div>
  )
}
