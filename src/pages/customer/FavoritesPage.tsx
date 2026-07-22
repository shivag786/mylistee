import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import { ROUTES } from '@/constants/routes'
import { MESSAGES } from '@/constants/messages'
import { useFavorites } from '@/features/businesses/hooks/useFavorites'
import { ShopCard } from '@/features/businesses/components/ShopCard'

export function FavoritesPage() {
  const navigate = useNavigate()
  const { data: businesses, isLoading, isError, refetch } = useFavorites()

  return (
    <div className="space-y-4">
      <h1 className="text-title font-bold text-foreground">Favorites</h1>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner size={28} label="Loading favorites" />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !businesses || businesses.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-7" />}
          title={MESSAGES.empty.favorites.title}
          description={MESSAGES.empty.favorites.description}
          actionLabel={MESSAGES.empty.favorites.action}
          onAction={() => navigate(ROUTES.nearby)}
        />
      ) : (
        <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {businesses.map((business) => (
            <StaggerItem key={business.id}>
              <ShopCard business={business} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  )
}
