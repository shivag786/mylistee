import { useState } from 'react'
import { Star, MessageSquare } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { SkeletonList } from '@/components/feedback/skeletons'
import { useOwnerReviews, useReplyToReview } from '@/features/owner/hooks/useOwner'
import type { OwnerReview } from '@/features/owner/services/ownerService'
import { toast } from '@/utils/toast'
import { formatDate } from '@/utils/format'

export function OwnerReviewsPage() {
  const { data, isLoading, isError, refetch } = useOwnerReviews()

  return (
    <div className="space-y-4">
      <h1 className="text-title font-bold text-foreground">Reviews</h1>
      {isLoading ? (
        <SkeletonList rows={4} />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="size-7" />}
          title="No reviews yet"
          description="Customer reviews appear here once people rate your business."
        />
      ) : (
        <div className="space-y-3">
          {data.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  )
}

function ReviewItem({ review }: { review: OwnerReview }) {
  const reply = useReplyToReview()
  const [text, setText] = useState(review.reply ?? '')
  const [editing, setEditing] = useState(review.reply === null)

  async function save() {
    try {
      await reply.mutateAsync({ id: review.id, reply: text.trim() })
      toast.success('Reply saved')
      setEditing(false)
    } catch {
      toast.error('Could not save your reply.')
    }
  }

  return (
    <Card className="space-y-3">
      <div>
        <p className="text-body font-semibold text-foreground">
          {review.customerName ?? 'Customer'}
        </p>
        <span className="inline-flex items-center gap-1 text-caption text-text-secondary">
          <Star className="size-4 fill-gold text-gold" aria-hidden />
          {review.rating.toFixed(1)}
          {review.createdAt && <> · {formatDate(review.createdAt)}</>}
        </span>
      </div>

      {review.comment && <p className="text-body text-text-secondary">{review.comment}</p>}

      {!editing && review.reply ? (
        <div className="rounded-lg bg-surface-muted p-3">
          <p className="text-caption font-medium text-foreground">Your reply</p>
          <p className="text-caption text-text-secondary">{review.reply}</p>
          <Button variant="ghost" size="sm" className="mt-1" onClick={() => setEditing(true)}>
            Edit reply
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a public reply…"
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              isLoading={reply.isPending}
              disabled={!text.trim()}
              onClick={() => void save()}
            >
              Post reply
            </Button>
            {review.reply !== null && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setText(review.reply ?? '')
                  setEditing(false)
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
