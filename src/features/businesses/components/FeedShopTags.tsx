import { Heart, Navigation } from 'lucide-react'
import { formatDistance } from '@/utils/format'

/**
 * Why a card ranked where it did: "Following" and/or how far the shop is.
 * Renders nothing when neither is known.
 */
export function FeedShopTags({ isFollowed, distanceMeters }: { isFollowed?: boolean; distanceMeters?: number | null }) {
  if (!isFollowed && distanceMeters == null) return null
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-small font-medium">
      {isFollowed && (
        <span className="inline-flex items-center gap-0.5 text-primary">
          <Heart className="size-3 fill-current" aria-hidden /> Following
        </span>
      )}
      {distanceMeters != null && (
        <span className="inline-flex items-center gap-0.5 text-text-secondary">
          <Navigation className="size-3" aria-hidden /> {formatDistance(distanceMeters)}
        </span>
      )}
    </span>
  )
}
