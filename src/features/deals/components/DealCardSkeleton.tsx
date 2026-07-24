import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/feedback/Skeleton'

/** Loading placeholder mirroring the DealCard. */
export function DealCardSkeleton() {
  return (
    <Card padding="none" className="h-full overflow-hidden">
      <Skeleton className="h-28 w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </Card>
  )
}
