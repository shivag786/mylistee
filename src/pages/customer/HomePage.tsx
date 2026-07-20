import { Link } from 'react-router-dom'
import { Search, Sparkles, RefreshCw } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { MESSAGES } from '@/constants/messages'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useNearbyBusinesses } from '@/features/businesses/hooks/useNearbyBusinesses'
import { BusinessCard } from '@/features/businesses/components/BusinessCard'
import { BusinessCardSkeleton } from '@/features/businesses/components/BusinessCardSkeleton'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'

export function HomePage() {
  const { user } = useAuth()
  const { data, isLoading, isError, refetch, isFetching } = useNearbyBusinesses()

  return (
    <div className="space-y-6">
      {/* Greeting hero */}
      <section className="rounded-cover bg-gradient-to-br from-primary to-secondary px-5 py-6 text-white shadow-premium">
        <p className="inline-flex items-center gap-1.5 text-caption font-medium opacity-90">
          <Sparkles className="size-4" aria-hidden />
          Every visit rewards you
        </p>
        <h1 className="mt-1 text-title font-bold">
          {user ? `Hi ${user.name.split(' ')[0]}` : 'Rewards around you'}
        </h1>
        <p className="mt-1 text-body opacity-90">
          Discover local shops, spin, and win offers near you.
        </p>
      </section>

      {/* Search entry */}
      <Link
        to={ROUTES.search}
        className="flex h-13 items-center gap-2 rounded-input border border-border bg-surface px-4 text-text-muted shadow-soft"
      >
        <Search className="size-5" aria-hidden />
        <span className="text-body">Search shops, cafés, offers…</span>
      </Link>

      {/* Nearby */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-subtitle font-semibold text-foreground">Nearby you</h2>
          {isFetching && !isLoading && (
            <RefreshCw className="size-4 animate-spin text-text-muted" aria-hidden />
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <BusinessCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState variant="offline" onRetry={() => refetch()} />
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={<Search className="size-7" />}
            title={MESSAGES.empty.nearby.title}
            description={MESSAGES.empty.nearby.description}
            actionLabel={MESSAGES.empty.nearby.action}
            onAction={() => refetch()}
          />
        ) : (
          <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((business) => (
              <StaggerItem key={business.id}>
                <BusinessCard business={business} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>
    </div>
  )
}
