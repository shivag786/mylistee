import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/feedback/Skeleton'

/** Loading placeholder mirroring the compact ShopCard. */
export function ShopCardSkeleton() {
  return (
    <Card padding="none" className="h-full overflow-hidden">
      <Skeleton className="h-28 w-full rounded-none" />
      <div className="flex gap-2.5 p-3">
        <Skeleton className="size-9 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-4/5" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </Card>
  )
}
