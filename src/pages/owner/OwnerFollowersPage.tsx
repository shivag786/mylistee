import { Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { SkeletonList } from '@/components/feedback/skeletons'
import { useOwnerFollowers } from '@/features/owner/hooks/useOwner'
import { formatDate } from '@/utils/format'

/** The customers who followed this shop, newest first. */
export function OwnerFollowersPage() {
  const { data, isLoading, isError, refetch } = useOwnerFollowers()

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-title font-bold text-foreground">Followers</h1>
        <p className="text-caption text-text-secondary">
          {data ? `${data.total} ${data.total === 1 ? 'person follows' : 'people follow'} your shop` : 'Customers who follow your shop'}
        </p>
      </header>

      {isLoading ? (
        <SkeletonList rows={5} />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !data || data.followers.length === 0 ? (
        <EmptyState
          icon={<Users className="size-7" />}
          title="No followers yet"
          description="Customers who follow your shop from its profile page will show up here."
        />
      ) : (
        <Card elevation="soft" padding="none">
          <ul className="divide-y divide-border">
            {data.followers.map((follower) => (
              <li key={follower.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={follower.name} src={follower.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{follower.name}</p>
                  {follower.followedAt && (
                    <p className="text-caption text-text-secondary">
                      Following since {formatDate(follower.followedAt)}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
