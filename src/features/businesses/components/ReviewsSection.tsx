import { Star, MessageSquare, BadgeCheck } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/feedback/Spinner'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import { useReviews } from '../hooks/useReviews'

/**
 * Reviews list on a business profile (phase/02 §Reviews). Read-only: reviews are
 * a verified purchase, left from the customer's order history after an order is
 * fulfilled — never free-form here.
 */
export function ReviewsSection({ slug }: { slug: string }) {
  const { data: reviews, isLoading } = useReviews(slug)

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-body-lg font-semibold text-foreground">
        <MessageSquare className="size-5" aria-hidden /> Reviews
      </h2>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner size={24} />
        </div>
      ) : !reviews || reviews.length === 0 ? (
        <p className="py-4 text-center text-caption text-text-secondary">
          No reviews yet. Order here and share your experience afterwards!
        </p>
      ) : (
        <div className="space-y-2">
          {reviews.map((review) => (
            <Card key={review.id} padding="md" className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-body font-medium text-foreground">
                  <BadgeCheck className="size-3.5 fill-success text-white" aria-label="Verified order" />
                  {review.customerName ?? 'Customer'}
                  {review.isMine && <span className="ml-1 text-small text-text-muted">(you)</span>}
                </span>
                <Stars value={review.rating} />
              </div>
              {review.comment && <p className="text-caption text-text-secondary">{review.comment}</p>}
              {review.createdAt && <p className="text-small text-text-muted">{formatDate(review.createdAt)}</p>}
              {review.reply && (
                <div className="mt-1 rounded-lg bg-surface-muted p-2.5">
                  <p className="text-small font-semibold text-foreground">Owner replied</p>
                  <p className="text-caption text-text-secondary">{review.reply}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn('size-4', n <= value ? 'fill-gold text-gold' : 'text-border-strong')}
          aria-hidden
        />
      ))}
    </span>
  )
}
