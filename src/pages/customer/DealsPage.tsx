import { Tag } from 'lucide-react'
import { DealCard } from '@/features/deals/components/DealCard'
import { DealCardSkeleton } from '@/features/deals/components/DealCardSkeleton'
import { useDeals } from '@/features/deals/useDeals'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import { usePageTitle } from '@/hooks/usePageTitle'

/** All live product deals — the "See all" destination from the home row. */
export function DealsPage() {
  usePageTitle('Deals')
  const { data, isLoading, isError, refetch } = useDeals(30)

  return (
    <div className="space-y-5">
      <header>
        <h1 className="inline-flex items-center gap-2 text-title font-bold text-foreground">
          <Tag className="size-6 text-primary" aria-hidden />
          Today's Deals
        </h1>
        <p className="text-caption text-text-secondary">
          Live offers from shops near you — tap one to view and order.
        </p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <DealCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<Tag className="size-7" />}
          title="No live deals right now"
          description="Check back soon — shops run offers throughout the day."
        />
      ) : (
        <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {data.map((deal) => (
            <StaggerItem key={deal.id}>
              <DealCard deal={deal} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  )
}
