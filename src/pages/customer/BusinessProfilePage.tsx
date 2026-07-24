import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Star,
  MapPin,
  Clock,
  Lock,
  Sparkles,
  Store,
  Phone,
  MessageCircle,
  Navigation,
  Gift,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/feedback/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog'
import { cart, useCart, type CartItem } from '@/features/orders/cartStore'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { usePublicBusiness, useSpin } from '@/features/businesses/hooks/usePublicBusiness'
import { MenuList } from '@/features/businesses/components/MenuList'
import { BusinessInfo } from '@/features/businesses/components/BusinessInfo'
import { ReviewsSection } from '@/features/businesses/components/ReviewsSection'
import { SpinnerWheel } from '@/features/spinner/components/SpinnerWheel'
import { RewardModal } from '@/features/spinner/components/RewardModal'
import { LoyaltyRewardsSection } from '@/features/wallet/components/LoyaltyRewardsSection'
import { ROUTES } from '@/constants/routes'
import { MESSAGES } from '@/constants/messages'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import type { WonReward } from '@/features/businesses/publicTypes'

export function BusinessProfilePage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const focusItem = searchParams.get('item') ?? undefined
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { data, isLoading, isError, refetch } = usePublicBusiness(slug)
  const spin = useSpin(slug)

  usePageTitle(data?.business?.name)

  const [tab, setTab] = useState('menu')
  const [conflictItem, setConflictItem] = useState<Omit<CartItem, 'quantity'> | null>(null)
  const cartData = useCart()
  const [resultIndex, setResultIndex] = useState<number | null>(null)
  const [pendingReward, setPendingReward] = useState<WonReward | null>(null)
  const [pendingCoins, setPendingCoins] = useState(0)
  const [wonReward, setWonReward] = useState<WonReward | null>(null)
  const [wonCoins, setWonCoins] = useState(0)

  const business = data?.business
  const spinState = data?.spin

  // Highest discount across the menu, for a header "up to X% off" badge.
  const maxOff = useMemo(() => {
    if (!business) return 0
    let max = 0
    for (const section of business.menu) {
      for (const p of section.products) {
        const promo = p.effectivePrice != null && p.activeOffer
          ? Math.round(((p.sellingPrice - p.effectivePrice) / p.sellingPrice) * 100)
          : 0
        max = Math.max(max, p.discountPercent, promo)
      }
    }
    return max
  }, [business])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-cover" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    )
  }
  if (isError) return <ErrorState onRetry={() => void refetch()} />
  if (!data || !business || !spinState) {
    return (
      <EmptyState
        icon={<MapPin className="size-7" />}
        title="Business not found"
        description={MESSAGES.errors.qrInvalid}
      />
    )
  }

  const activeCombos = business.combos.filter((c) => c.isActiveNow)
  const canSpin = spinState.available && !spinState.alreadySpunToday && !spin.isPending && resultIndex === null

  function handleAdd(item: Omit<CartItem, 'quantity'>) {
    const res = cart.add({ slug, name: business!.name }, item)
    if (res === 'conflict') setConflictItem(item)
    else toast.success(`${item.name} added`)
  }
  const mapsUrl =
    business.latitude != null && business.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}`
      : business.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`
        : null

  async function handleSpin() {
    if (!isAuthenticated) {
      navigate(ROUTES.login, { state: { from: { pathname: ROUTES.businessProfile(slug) } } })
      return
    }
    try {
      const result = await spin.mutateAsync()
      const idx = business!.offers.findIndex((o) => o.id === result.offer.id)
      setPendingReward(result.reward)
      setPendingCoins(result.coinsEarned)
      setResultIndex(idx >= 0 ? idx : 0)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic)
    }
  }

  return (
    <div className="space-y-4">
      {/* Cover */}
      <div className="overflow-hidden rounded-cover bg-surface-muted shadow-soft">
        {business.coverUrl ? (
          <img src={business.coverUrl} alt={business.name} loading="lazy" className="h-44 w-full object-cover" />
        ) : (
          <div className="grid h-44 w-full place-items-center text-text-muted">
            <Store className="size-10" aria-hidden />
          </div>
        )}
      </div>

      {/* Identity (no logo — fits the name properly) */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-subtitle font-bold leading-tight text-foreground">{business.name}</h1>
          <Badge tone={business.isOpen ? 'success' : 'neutral'} className="shrink-0">
            {business.isOpen ? 'Open' : 'Closed'}
          </Badge>
        </div>

        {business.category && (
          <p className="text-caption font-medium text-text-secondary">{business.category}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-text-secondary">
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

        {/* Reward / promotion / offer badges */}
        <div className="flex flex-wrap gap-1.5">
          {spinState.available && (
            <Badge tone="premium" className="gap-1">
              <Gift className="size-3" aria-hidden /> Spin & win
            </Badge>
          )}
          {maxOff > 0 && <Badge tone="primary">Up to {maxOff}% off</Badge>}
          {activeCombos.length > 0 && <Badge tone="success">Combos</Badge>}
        </div>
      </div>

      {/* Sticky action buttons */}
      <div className="sticky top-16 z-20 -mx-4 flex gap-2 overflow-x-auto border-b border-border bg-background/95 px-4 py-2 backdrop-blur">
        {business.phone && (
          <ActionButton icon={<Phone className="size-4" />} label="Call" href={`tel:${business.phone}`} />
        )}
        {business.whatsapp && (
          <ActionButton
            icon={<MessageCircle className="size-4" />}
            label="WhatsApp"
            href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`}
          />
        )}
        {mapsUrl && <ActionButton icon={<Navigation className="size-4" />} label="Directions" href={mapsUrl} />}
        {spinState.available && (
          <button
            type="button"
            onClick={() => setTab('offers')}
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-caption font-semibold text-primary-foreground shadow-soft"
          >
            <Sparkles className="size-4" aria-hidden /> Spin
          </button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
        </TabsList>

        <TabsContent value="menu" className="mt-4">
          <MenuList
            menu={business.menu}
            combos={business.combos}
            businessSlug={slug}
            onAdd={handleAdd}
            focusProductId={focusItem}
          />
        </TabsContent>

        <TabsContent value="offers" className="mt-4 space-y-5">
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
                      setWonCoins(pendingCoins)
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

          {business.offers.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-body-lg font-semibold text-foreground">Rewards you can win</h3>
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

          {isAuthenticated && <LoyaltyRewardsSection slug={slug} />}
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <ReviewsSection slug={slug} />
        </TabsContent>

        <TabsContent value="gallery" className="mt-4">
          {business.gallery.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {business.gallery.map((image) => (
                <div key={image.id} className="aspect-square overflow-hidden rounded-xl bg-surface-muted">
                  {image.url && <img src={image.url} alt="" loading="lazy" className="size-full object-cover" />}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Store className="size-7" />} title="No photos yet" />
          )}
        </TabsContent>

        <TabsContent value="info" className="mt-4">
          <BusinessInfo business={business} />
        </TabsContent>
      </Tabs>

      <RewardModal
        reward={wonReward}
        coinsEarned={wonCoins}
        onClose={() => {
          setWonReward(null)
          setWonCoins(0)
        }}
      />

      <ConfirmationDialog
        open={conflictItem !== null}
        onOpenChange={(open) => !open && setConflictItem(null)}
        title="Start a new cart?"
        description={`Your cart from ${cartData?.businessName ?? 'another shop'} will be cleared — you can only order from one shop at a time.`}
        confirmLabel="Start new cart"
        onConfirm={() => {
          if (conflictItem) {
            cart.replace({ slug, name: business!.name }, conflictItem)
            toast.success(`${conflictItem.name} added`)
          }
          setConflictItem(null)
        }}
      />
    </div>
  )
}

function ActionButton({ icon, label, href }: { icon: ReactNode; label: string; href: string }) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noreferrer"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-caption font-medium text-foreground shadow-soft hover:bg-surface-muted"
    >
      <span className="text-text-secondary">{icon}</span>
      {label}
    </a>
  )
}
