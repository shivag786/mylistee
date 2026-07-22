import { useNearbyBusinesses } from '@/features/businesses/hooks/useNearbyBusinesses'
import { ShopCard } from '@/features/businesses/components/ShopCard'
import { ShopCardSkeleton } from '@/features/businesses/components/ShopCardSkeleton'

export function NearbyPage() {
  const { data, isLoading } = useNearbyBusinesses()

  return (
    <div className="space-y-4">
      <h1 className="text-title font-bold text-foreground">Nearby you</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <ShopCardSkeleton key={i} />)
          : data?.map((business) => <ShopCard key={business.id} business={business} />)}
      </div>
    </div>
  )
}
