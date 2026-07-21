import { useState } from 'react'
import { Star, MessageSquare } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/feedback/Spinner'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import { useReviews, useSubmitReview } from '../hooks/useReviews'

/** Reviews list + write-a-review form on a business profile (phase/02 §Reviews). */
export function ReviewsSection({ slug }: { slug: string }) {
  const { isAuthenticated } = useAuth()
  const { data: reviews, isLoading } = useReviews(slug)
  const submit = useSubmitReview(slug)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating < 1) return
    try {
      await submit.mutateAsync({ rating, comment: comment.trim() || undefined })
      toast.success('Thanks for your review!')
      setRating(0)
      setComment('')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not post your review.')
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-body-lg font-semibold text-foreground">
        <MessageSquare className="size-5" aria-hidden /> Reviews
      </h2>

      {isAuthenticated && (
        <Card className="space-y-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            <StarInput value={rating} onChange={setRating} />
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience (optional)"
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-body text-foreground outline-none placeholder:text-text-muted focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            />
            <Button type="submit" size="md" isLoading={submit.isPending} disabled={rating < 1}>
              Post review
            </Button>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner size={24} />
        </div>
      ) : !reviews || reviews.length === 0 ? (
        <p className="py-4 text-center text-caption text-text-secondary">
          No reviews yet. Be the first to share your experience!
        </p>
      ) : (
        <div className="space-y-2">
          {reviews.map((review) => (
            <Card key={review.id} padding="md" className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-body font-medium text-foreground">
                  {review.customerName ?? 'Customer'}
                  {review.isMine && <span className="ml-1 text-small text-text-muted">(you)</span>}
                </span>
                <Stars value={review.rating} />
              </div>
              {review.comment && <p className="text-caption text-text-secondary">{review.comment}</p>}
              {review.createdAt && (
                <p className="text-small text-text-muted">{formatDate(review.createdAt)}</p>
              )}
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

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
        >
          <Star
            className={cn(
              'size-7 transition-colors',
              n <= (hover || value) ? 'fill-gold text-gold' : 'text-border-strong',
            )}
            aria-hidden
          />
        </button>
      ))}
    </div>
  )
}
