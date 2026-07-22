import type { LucideIcon } from 'lucide-react'
import { Search, Sparkles, Star, MapPin, RefreshCw } from 'lucide-react'
import type { UseQueryResult } from '@tanstack/react-query'
import { MESSAGES } from '@/constants/messages'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useNearbyBusinesses } from '@/features/businesses/hooks/useNearbyBusinesses'
import {
  useRecommendedBusinesses,
  useNewBusinesses,
} from '@/features/businesses/hooks/useDiscoveryRows'
import { ShopCard } from '@/features/businesses/components/ShopCard'
import { ShopCardSkeleton } from '@/features/businesses/components/ShopCardSkeleton'
import { AnimatedSearchBar } from '@/features/businesses/components/AnimatedSearchBar'
import { HorizontalScroller } from '@/components/navigation/HorizontalScroller'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import type { Business } from '@/features/businesses/types'

export function HomePage() {
  const { user } = useAuth()
  const recommended = useRecommendedBusinesses()
  const fresh = useNewBusinesses()
  const nearby = useNearbyBusinesses()

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

      <AnimatedSearchBar />

      <ShopRow title="Recommended" icon={Star} query={recommended} />
      <ShopRow title="New on Listee" icon={Sparkles} query={fresh} />

      {/* Nearby — grid of compact cards */}
      <section>
        <SectionHeading icon={MapPin} title="Nearby you">
          {nearby.isFetching && !nearby.isLoading && (
            <RefreshCw className="size-4 animate-spin text-text-muted" aria-hidden />
          )}
        </SectionHeading>

        {nearby.isLoading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ShopCardSkeleton key={i} />
            ))}
          </div>
        ) : nearby.isError ? (
          <ErrorState variant="offline" onRetry={() => nearby.refetch()} />
        ) : !nearby.data || nearby.data.length === 0 ? (
          <EmptyState
            icon={<Search className="size-7" />}
            title={MESSAGES.empty.nearby.title}
            description={MESSAGES.empty.nearby.description}
            actionLabel={MESSAGES.empty.nearby.action}
            onAction={() => nearby.refetch()}
          />
        ) : (
          <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {nearby.data.map((business) => (
              <StaggerItem key={business.id}>
                <ShopCard business={business} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>
    </div>
  )
}

function SectionHeading({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="inline-flex items-center gap-1.5 text-subtitle font-semibold text-foreground">
        <Icon className="size-5 text-primary" aria-hidden />
        {title}
      </h2>
      {children}
    </div>
  )
}

/** A horizontal card row. Hides itself entirely when there's nothing to show. */
function ShopRow({
  title,
  icon,
  query,
}: {
  title: string
  icon: LucideIcon
  query: UseQueryResult<Business[]>
}) {
  const { data, isLoading } = query

  // Auto-hide empty rows (e.g. no verified shops / no new shops yet).
  if (!isLoading && (!data || data.length === 0)) return null

  return (
    <section>
      <SectionHeading icon={icon} title={title} />
      <HorizontalScroller>
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-40 shrink-0 sm:w-44">
                <ShopCardSkeleton />
              </div>
            ))
          : data!.map((business) => (
              <div key={business.id} className="w-40 shrink-0 snap-start sm:w-44">
                <ShopCard business={business} />
              </div>
            ))}
      </HorizontalScroller>
    </section>
  )
}
