import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { cn } from '@/utils/cn'
import { useSubmitReview } from '../hooks/useReviews'

interface ReviewPromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slug: string
  /** The fulfilled order being reviewed — reviews are a verified purchase. */
  orderId: string
  businessName: string
  /** Pre-selected rating (e.g. the star the customer tapped on the nudge). */
  initialRating?: number
  /** Called after a successful submit — caller refreshes anything that shows "reviewed". */
  onSubmitted?: () => void
}

/**
 * A focused "rate this shop" dialog reused by the post-order review nudge and the
 * orders page. Submits a business review via the shared review service.
 */
export function ReviewPromptDialog({
  open,
  onOpenChange,
  slug,
  orderId,
  businessName,
  initialRating = 0,
  onSubmitted,
}: ReviewPromptDialogProps) {
  const submit = useSubmitReview(slug)
  const [rating, setRating] = useState(initialRating)
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (open) {
      setRating(initialRating)
      setComment('')
    }
  }, [open, initialRating])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating < 1) return
    try {
      await submit.mutateAsync({ orderId, rating, comment: comment.trim() || undefined })
      toast.success('Thanks for your review!')
      onSubmitted?.()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not post your review.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How was {businessName}?</DialogTitle>
          <DialogDescription>Your rating helps other customers.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <StarInput value={rating} onChange={setRating} />
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience (optional)"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-body text-foreground outline-none placeholder:text-text-muted focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submit.isPending}>
              Not now
            </Button>
            <Button type="submit" isLoading={submit.isPending} disabled={rating < 1}>
              Post review
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center justify-center gap-1.5">
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
              'size-9 transition-colors',
              n <= (hover || value) ? 'fill-gold text-gold' : 'text-border-strong',
            )}
            aria-hidden
          />
        </button>
      ))}
    </div>
  )
}
