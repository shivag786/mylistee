import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/feedback/Skeleton'

/** Loading placeholder mirroring BusinessCard's shape. */
export function BusinessCardSkeleton() {
  return (
    <Card padding="none" className="overflow-hidden">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <Skeleton className="mt-4 h-11 w-full rounded-button" />
      </div>
    </Card>
  )
}
