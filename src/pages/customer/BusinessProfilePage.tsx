import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Star, MapPin, Clock, Lock, Sparkles, Store } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/feedback/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { usePublicBusiness, useSpin } from '@/features/businesses/hooks/usePublicBusiness'
import { SpinnerWheel } from '@/features/spinner/components/SpinnerWheel'
import { RewardModal } from '@/features/spinner/components/RewardModal'
import { ReviewsSection } from '@/features/businesses/components/ReviewsSection'
import { ROUTES } from '@/constants/routes'
import { MESSAGES } from '@/constants/messages'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import type { WonReward } from '@/features/businesses/publicTypes'

export function BusinessProfilePage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { data, isLoading, isError, refetch } = usePublicBusiness(slug)
  const spin = useSpin(slug)

  // Dynamic title improves shareability/SEO for the QR-opened profile page.
  usePageTitle(data?.business?.name)

  const [resultIndex, setResultIndex] = useState<number | null>(null)
  const [pendingReward, setPendingReward] = useState<WonReward | null>(null)
  const [wonReward, setWonReward] = useState<WonReward | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-cover" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    )
  }

  if (isError) {
    return <ErrorState onRetry={() => void refetch()} />
  }

  if (!data) {
    return (
      <EmptyState
        icon={<MapPin className="size-7" />}
        title="Business not found"
        description={MESSAGES.errors.qrInvalid}
      />
    )
  }

  const { business, spin: spinState } = data
  const canSpin = spinState.available && !spinState.alreadySpunToday && !spin.isPending && resultIndex === null

  async function handleSpin() {
    if (!isAuthenticated) {
      navigate(ROUTES.login, { state: { from: { pathname: ROUTES.businessProfile(slug) } } })
      return
    }
    try {
      const result = await spin.mutateAsync()
      const idx = business.offers.findIndex((o) => o.id === result.offer.id)
      setPendingReward(result.reward)
      setResultIndex(idx >= 0 ? idx : 0)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic)
    }
  }

  return (
    <div className="space-y-5">
      {/* Cover + identity */}
      <div className="overflow-hidden rounded-cover bg-surface-muted shadow-soft">
        {business.coverUrl ? (
          <img src={business.coverUrl} alt={business.name} loading="lazy" className="h-48 w-full object-cover" />
        ) : (
          <div className="grid h-48 w-full place-items-center text-text-muted">
            <Store className="size-10" aria-hidden />
          </div>
        )}
      </div>
      <div className="flex items-start gap-4">
        <div className="-mt-10 size-20 shrink-0 overflow-hidden rounded-image border-4 border-surface bg-surface-muted shadow-soft">
          {business.logoUrl ? (
            <img src={business.logoUrl} alt="" className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center text-text-muted">
              <Store className="size-7" aria-hidden />
            </div>
          )}
        </div>
        <div className="pt-1">
          <div className="flex items-center gap-2">
            <h1 className="text-title font-bold text-foreground">{business.name}</h1>
            <Badge tone={business.isOpen ? 'success' : 'neutral'}>
              {business.isOpen ? 'Open' : 'Closed'}
            </Badge>
          </div>
          {business.category && <p className="text-caption text-text-secondary">{business.category}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-3 text-caption text-text-secondary">
            {business.totalReviews > 0 && (
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <Star className="size-4 fill-gold text-gold" aria-hidden />
                {business.averageRating.toFixed(1)} ({business.totalReviews})
              </span>
            )}
            {business.openingTime && business.closingTime && (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-4" aria-hidden />
                {business.openingTime.slice(0, 5)}–{business.closingTime.slice(0, 5)}
              </span>
            )}
          </div>
        </div>
      </div>

      {business.description && (
        <p className="text-body text-text-secondary">{business.description}</p>
      )}

      {/* Spinner */}
      <Card className="flex flex-col items-center gap-4 bg-gradient-to-br from-primary-soft to-gold-soft text-center">
        {!spinState.available ? (
          <>
            <div className="grid size-16 place-items-center rounded-full bg-surface shadow-soft">
              <Sparkles className="size-7 text-text-secondary" aria-hidden />
            </div>
            <p className="text-body-lg font-semibold text-foreground">No rewards right now</p>
            <p className="text-caption text-text-secondary">Check back soon — this shop hasn't set up offers yet.</p>
          </>
        ) : (
          <>
            <SpinnerWheel
              offers={business.offers}
              resultIndex={resultIndex}
              spinning={pendingReward !== null}
              onRest={() => {
                if (pendingReward) {
                  setWonReward(pendingReward)
                  setPendingReward(null)
                }
              }}
            />

            {spinState.alreadySpunToday ? (
              <p className="text-caption font-medium text-text-secondary">{MESSAGES.errors.spinLimit}</p>
            ) : !isAuthenticated ? (
              <Button size="lg" fullWidth leftIcon={<Lock className="size-5" />} onClick={() => void handleSpin()}>
                {MESSAGES.cta.signInGoogle} to spin
              </Button>
            ) : (
              <Button
                size="lg"
                fullWidth
                isLoading={spin.isPending}
                disabled={!canSpin}
                leftIcon={<Sparkles className="size-5" />}
                onClick={() => void handleSpin()}
              >
                {MESSAGES.cta.spinNow}
              </Button>
            )}
          </>
        )}
      </Card>

      {/* Offers on show */}
      {business.offers.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-body-lg font-semibold text-foreground">Rewards you can win</h2>
          <div className="space-y-2">
            {business.offers.map((offer) => (
              <Card key={offer.id} className="flex items-center gap-3" padding="md">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-premium-soft text-premium-foreground">
                  <Sparkles className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-body font-medium text-foreground">{offer.title}</p>
                  <p className="text-caption text-text-secondary">
                    {offer.typeLabel}
                    {offer.rewardValue ? ` · ${offer.rewardValue}` : ''}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Gallery */}
      {business.gallery.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-body-lg font-semibold text-foreground">Gallery</h2>
          <div className="grid grid-cols-3 gap-2">
            {business.gallery.map((image) => (
              <div key={image.id} className="aspect-square overflow-hidden rounded-xl bg-surface-muted">
                {image.url && <img src={image.url} alt="" loading="lazy" className="size-full object-cover" />}
              </div>
            ))}
          </div>
        </section>
      )}

      <ReviewsSection slug={slug} />

      <RewardModal reward={wonReward} onClose={() => setWonReward(null)} />
    </div>
  )
}
