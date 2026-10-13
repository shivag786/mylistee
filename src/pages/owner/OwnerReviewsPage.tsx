import { useState } from 'react'
import { Star, MessageSquare, Copy, Share2, QrCode, Eye, EyeOff, Phone, Link2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { SkeletonList } from '@/components/feedback/skeletons'
import {
  useOwnerBusiness,
  useOwnerReviews,
  useReplyToReview,
  useSetReviewHidden,
} from '@/features/owner/hooks/useOwner'
import type { OwnerReview } from '@/features/owner/services/ownerService'
import { ROUTES } from '@/constants/routes'
import { generateQrDataUrl, downloadDataUrl } from '@/utils/qr'
import { toast } from '@/utils/toast'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'

export function OwnerReviewsPage() {
  const { data, isLoading, isError, refetch } = useOwnerReviews()
  const hiddenCount = data?.filter((r) => r.isHidden).length ?? 0

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-title font-bold text-foreground">Reviews</h1>
        {data && data.length > 0 && (
          <p className="text-caption text-text-secondary">
            {data.length} {data.length === 1 ? 'review' : 'reviews'}
            {hiddenCount > 0 && ` · ${hiddenCount} hidden from your page`}
          </p>
        )}
      </header>

      <ReviewLinkCard />

      {isLoading ? (
        <SkeletonList rows={4} />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="size-7" />}
          title="No reviews yet"
          description="Share your review link with customers — their reviews will appear here."
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

/** The shop's shareable review link: copy, send on WhatsApp, or print as a QR. */
function ReviewLinkCard() {
  const { data: business } = useOwnerBusiness()
  if (!business) return null

  const url = `${window.location.origin}${ROUTES.reviewLink(business.slug)}`
  const message = `Thank you for visiting ${business.name}! We'd love to hear how it went — please leave us a quick review: ${url}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Review link copied')
    } catch {
      toast.error('Could not copy. Long-press the link to copy it.')
    }
  }

  async function downloadQr() {
    try {
      const dataUrl = await generateQrDataUrl(url)
      downloadDataUrl(dataUrl, `${business!.slug}-review-qr.png`)
    } catch {
      toast.error('Could not create the QR code.')
    }
  }

  return (
    <Card className="space-y-3" padding="lg">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <Link2 className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-body font-semibold text-foreground">Your review link</h2>
          <p className="text-caption text-text-secondary">
            Send it to customers after a visit. They only need their mobile number — no app or sign-up.
          </p>
        </div>
      </div>

      <p className="break-all rounded-lg bg-surface-muted px-3 py-2 text-caption text-foreground">{url}</p>

      <div className="grid grid-cols-3 gap-2">
        <Button size="sm" variant="outline" leftIcon={<Copy className="size-4" />} onClick={() => void copy()}>
          Copy
        </Button>
        <Button asChild size="sm" variant="outline">
          <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
            <Share2 className="size-4" aria-hidden />
            WhatsApp
          </a>
        </Button>
        <Button size="sm" variant="outline" leftIcon={<QrCode className="size-4" />} onClick={() => void downloadQr()}>
          QR
        </Button>
      </div>
    </Card>
  )
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn('size-3.5', n <= value ? 'fill-star text-star' : 'text-border-strong')} aria-hidden />
      ))}
    </span>
  )
}

function ReviewItem({ review }: { review: OwnerReview }) {
  const reply = useReplyToReview()
  const setHidden = useSetReviewHidden()
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

  function toggleHidden() {
    const hidden = !review.isHidden
    setHidden.mutate(
      { id: review.id, hidden },
      {
        onSuccess: () => toast.success(hidden ? 'Hidden from your page' : 'Shown on your page again'),
        onError: () => toast.error('Could not update this review.'),
      },
    )
  }

  const offPage = review.isHidden || review.isRemovedByAdmin

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className={cn('min-w-0 space-y-0.5', offPage && 'opacity-60')}>
          <p className="flex flex-wrap items-center gap-2 text-body font-semibold text-foreground">
            {review.customerName ?? 'Customer'}
            {review.source === 'link' && <Badge tone="info">Review link</Badge>}
            {review.isRemovedByAdmin ? (
              <Badge tone="danger">Removed by admin</Badge>
            ) : (
              review.isHidden && <Badge tone="neutral">Hidden</Badge>
            )}
          </p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-text-secondary">
            {review.rating !== null && <Stars value={review.rating} />}
            {review.createdAt && <span>{formatDate(review.createdAt)}</span>}
            {review.phone && (
              <a href={`tel:+91${review.phone}`} className="inline-flex items-center gap-1 text-primary">
                <Phone className="size-3.5" aria-hidden />
                {review.phone}
              </a>
            )}
          </p>
        </div>
        {!review.isRemovedByAdmin && (
          <Button
            size="sm"
            variant="ghost"
            leftIcon={review.isHidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            isLoading={setHidden.isPending}
            onClick={toggleHidden}
            className="shrink-0"
          >
            {review.isHidden ? 'Show' : 'Hide'}
          </Button>
        )}
      </div>

      <div className={cn('space-y-2', offPage && 'opacity-60')}>
        {review.comment && <p className="text-body text-text-secondary">{review.comment}</p>}

        {review.items.length > 0 && (
          <ul className="space-y-1 rounded-lg bg-surface-muted p-2.5">
            {review.items.map((item) => (
              <li key={`${item.type}:${item.name}`} className="flex items-center justify-between gap-3 text-caption">
                <span className="truncate text-foreground">{item.name}</span>
                <Stars value={item.rating} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {review.isHidden && !review.isRemovedByAdmin && (
        <p className="text-small text-text-muted">
          Customers don't see this review on your page. It still counts toward your rating.
        </p>
      )}

      {!review.isRemovedByAdmin &&
        (!editing && review.reply ? (
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
        ))}
    </Card>
  )
}
