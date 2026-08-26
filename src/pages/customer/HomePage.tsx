import { useMemo } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Search,
  Sparkles,
  Star,
  MapPin,
  RefreshCw,
  Tag,
  Coins,
  PartyPopper,
  Layers,
  Zap,
  ChevronRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { UseQueryResult } from '@tanstack/react-query'
import { MESSAGES } from '@/constants/messages'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useNearbyBusinesses } from '@/features/businesses/hooks/useNearbyBusinesses'
import {
  useRecommendedBusinesses,
  useNewBusinesses,
} from '@/features/businesses/hooks/useDiscoveryRows'
import { usePublicCategories } from '@/features/businesses/hooks/useCategories'
import { ShopCard } from '@/features/businesses/components/ShopCard'
import { ShopCardSkeleton } from '@/features/businesses/components/ShopCardSkeleton'
import { AnimatedSearchBar } from '@/features/businesses/components/AnimatedSearchBar'
import { DealCard } from '@/features/deals/components/DealCard'
import { DealCardSkeleton } from '@/features/deals/components/DealCardSkeleton'
import { useDeals, useFestivalDeals } from '@/features/deals/useDeals'
import { ComboDealCard } from '@/features/combos/components/ComboDealCard'
import { useComboFeed } from '@/features/combos/useComboFeed'
import { useAppConfig } from '@/features/system/hooks/useAppConfig'
import { useAppLocation } from '@/features/location/useAppLocation'
import { useCoinSummary } from '@/features/wallet/hooks/useCoins'
import { CoinsProgressCard } from '@/features/wallet/components/CoinsProgressCard'
import { Card } from '@/components/ui/card'
import { HorizontalScroller } from '@/components/navigation/HorizontalScroller'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import { LazySection } from '@/components/motion/LazySection'
import { BannerCarousel } from '@/features/banners/BannerCarousel'
import { useBannerSlot } from '@/features/banners/useBanners'
import { LastOrderReviewNudge } from '@/features/orders/LastOrderReviewNudge'
import type { Business, BusinessCategory } from '@/features/businesses/types'
import type { Deal } from '@/features/deals/types'
import type { ComboDeal } from '@/features/combos/types'

/** Greeting + subtitle that shift with the time of day. */
function timeContext() {
  const h = new Date().getHours()
  if (h < 12) return { greeting: 'Good morning', line: 'Breakfast spots and morning deals near you.' }
  if (h < 17) return { greeting: 'Good afternoon', line: 'Lunch deals and combos around you.' }
  if (h < 21) return { greeting: 'Good evening', line: 'Dinner, combos, and evening offers near you.' }
  return { greeting: 'Late night', line: 'Late-night bites and offers near you.' }
}

export function HomePage() {
  const { user, isAuthenticated } = useAuth()
  const coins = useCoinSummary(isAuthenticated)
  const appConfig = useAppConfig()
  const categories = usePublicCategories()
  // Above-the-fold: fetched eagerly so there's immediate content under the hero.
  const deals = useDeals()
  // No `withContent` filter: it hides any shop without a live offer / visible
  // product / visible combo, which is every newly added shop.
  // Coordinates come from the header chip, so the row re-sorts by distance as
  // soon as a location is set.
  const { coords } = useAppLocation()
  const nearby = useNearbyBusinesses(coords ? { lat: coords.lat, lng: coords.lng } : {})
  const topBanners = useBannerSlot('home_top')
  const afterCombosBanners = useBannerSlot('home_after_combos')

  // Admin-controlled: hide the whole category quick-filter row when the flag is off.
  const showCategoryChips = appConfig.data?.flags.homeCategoryFilter ?? true
  const { greeting, line } = timeContext()

  // Shops with a spin available right now (from the nearby grid).
  const spinCount = useMemo(() => {
    const ids = new Set<string>()
    for (const b of nearby.data ?? []) if (b.spinAvailable) ids.add(b.id)
    return ids.size
  }, [nearby.data])

  return (
    <div className="space-y-6">
      {/* Greeting hero */}
      <section className="rounded-cover bg-gradient-to-br from-primary to-secondary px-5 py-6 text-white shadow-premium">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-caption font-medium opacity-90">
              <Sparkles className="size-4" aria-hidden />
              Every visit rewards you
            </p>
            <h1 className="mt-1 text-title font-bold">
              {user ? `${greeting}, ${user.name.split(' ')[0]}` : 'Rewards around you'}
            </h1>
          </div>

          {isAuthenticated && coins.data && (
            <Link
              to={ROUTES.wallet}
              aria-label={`${coins.data.total} coins — open wallet`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-caption font-semibold backdrop-blur transition-colors hover:bg-white/30"
            >
              <Coins className="size-4" aria-hidden />
              {coins.data.total}
            </Link>
          )}
        </div>
        <p className="mt-1 text-body opacity-90">{line}</p>
      </section>

      {/* Advertisement — top of home (admin-managed) */}
      {topBanners.length > 0 && <BannerCarousel banners={topBanners} />}

      <AnimatedSearchBar />

      {isAuthenticated && <CoinsProgressCard />}
      <SpinPrompt count={spinCount} />

      {showCategoryChips && <CategoryChips query={categories} />}

      {/* Above the fold — eager, immediate content under the hero. */}
      <DealRow title="Today's Deals" icon={Tag} query={deals} seeAllTo={ROUTES.deals} />

      {/* Below the fold — each mounts (and fetches) only when scrolled near.
          Item rows (combos, festival) lead; shop rows follow. */}
      <LazySection minHeight={220}>
        <CombosSection />
      </LazySection>

      {/* Advertisement — after combos (admin-managed) */}
      {afterCombosBanners.length > 0 && <BannerCarousel banners={afterCombosBanners} />}

      <LazySection minHeight={180}>
        <FestivalSection />
      </LazySection>
      <LazySection minHeight={220}>
        <RecommendedSection />
      </LazySection>
      <LazySection minHeight={220}>
        <NewSection />
      </LazySection>

      {/* Nearby — grid of compact cards */}
      <section>
        <SectionHeading icon={MapPin} title="Nearby you">
          {nearby.isFetching && !nearby.isLoading && (
            <RefreshCw className="size-4 animate-spin text-text-muted" aria-hidden />
          )}
        </SectionHeading>

        {nearby.isLoading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ShopCardSkeleton key={i} />
            ))}
          </div>
        ) : nearby.isError ? (
          <ErrorState variant="offline" onRetry={() => nearby.refetch()} />
        ) : !nearby.data || nearby.data.length === 0 ? (
          <EmptyState
            icon={<Search className="size-7" />}
            title={MESSAGES.empty.nearby.title}
            description={MESSAGES.empty.nearby.description}
            actionLabel={MESSAGES.empty.nearby.action}
            onAction={() => nearby.refetch()}
          />
        ) : (
          <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {nearby.data.map((business) => (
              <StaggerItem key={business.id}>
                <ShopCard business={business} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>

      {/* Gentle, one-time prompt to review the most recent completed order. */}
      <LastOrderReviewNudge />
    </div>
  )
}

function SectionHeading({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="inline-flex items-center gap-1.5 text-subtitle font-semibold text-foreground">
        <Icon className="size-5 text-primary" aria-hidden />
        {title}
      </h2>
      {children}
    </div>
  )
}

/** Nudge card → shops that currently have a spin to award. Hides when none. */
function SpinPrompt({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <Card padding="md" interactive className="relative overflow-hidden bg-gradient-to-br from-premium/15 to-primary/10">
      <Link to={`${ROUTES.nearby}?spin=1`} className="absolute inset-0" aria-label="Shops with a spin available" />
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-premium/20 text-premium">
          <Zap className="size-5 fill-current" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-caption font-semibold text-foreground">
            {count} {count === 1 ? 'shop has' : 'shops have'} a spin waiting
          </p>
          <p className="text-small text-text-muted">Tap to visit and win an offer.</p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-text-muted" aria-hidden />
      </div>
    </Card>
  )
}

/** Category quick-filter chips → open Search pre-filtered by that category. */
function CategoryChips({ query }: { query: UseQueryResult<BusinessCategory[]> }) {
  const { data } = query
  const chips = (data ?? []).filter((c) => c.showOnHomepage)
  if (chips.length === 0) return null

  return (
    <HorizontalScroller>
      {chips.map((category) => (
        <Link
          key={category.id}
          to={`${ROUTES.search}?q=${encodeURIComponent(category.name)}`}
          className="shrink-0 snap-start rounded-full border border-border bg-surface px-4 py-2 text-caption font-medium text-foreground shadow-soft transition-colors hover:border-primary hover:text-primary"
        >
          {category.name}
        </Link>
      ))}
    </HorizontalScroller>
  )
}

/** Product-deal row. Auto-hides when no offers are running. */
function DealRow({
  title,
  icon,
  query,
  seeAllTo,
}: {
  title: string
  icon: LucideIcon
  query: UseQueryResult<Deal[]>
  seeAllTo?: string
}) {
  const { data, isLoading } = query

  if (!isLoading && (!data || data.length === 0)) return null

  return (
    <section>
      <SectionHeading icon={icon} title={title}>
        {seeAllTo && (
          <Link to={seeAllTo} className="text-caption font-medium text-primary hover:underline">
            See all
          </Link>
        )}
      </SectionHeading>
      <HorizontalScroller>
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-40 shrink-0 sm:w-44">
                <DealCardSkeleton />
              </div>
            ))
          : data!.map((deal) => (
              <div key={deal.id} className="w-40 shrink-0 snap-start sm:w-44">
                <DealCard deal={deal} hideOfferBadge />
              </div>
            ))}
      </HorizontalScroller>
    </section>
  )
}

/** Meal-combos row. Auto-hides when no combos are active. */
function ComboRow({ query }: { query: UseQueryResult<ComboDeal[]> }) {
  const { data, isLoading } = query

  if (!isLoading && (!data || data.length === 0)) return null

  return (
    <section>
      <SectionHeading icon={Layers} title="Meal combos" />
      <HorizontalScroller>
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-40 shrink-0 sm:w-44">
                <DealCardSkeleton />
              </div>
            ))
          : data!.map((combo) => (
              <div key={combo.id} className="w-40 shrink-0 snap-start sm:w-44">
                <ComboDealCard combo={combo} />
              </div>
            ))}
      </HorizontalScroller>
    </section>
  )
}

/**
 * Self-contained below-the-fold sections. Each owns its query hook, so when
 * wrapped in <LazySection> the fetch only fires once the section is scrolled
 * near — nothing is loaded for sections the user never reaches.
 */
function FestivalSection() {
  return <DealRow title="Festival specials" icon={PartyPopper} query={useFestivalDeals()} />
}

function CombosSection() {
  return <ComboRow query={useComboFeed()} />
}

function RecommendedSection() {
  return <ShopRow title="Recommended" icon={Star} query={useRecommendedBusinesses()} />
}

function NewSection() {
  return <ShopRow title="New on Listee" icon={Sparkles} query={useNewBusinesses()} />
}

/** A horizontal card row. Hides itself entirely when there's nothing to show. */
function ShopRow({
  title,
  icon,
  query,
}: {
  title: string
  icon: LucideIcon
  query: UseQueryResult<Business[]>
}) {
  const { data, isLoading } = query

  // Auto-hide empty rows (e.g. no verified shops / no new shops yet).
  if (!isLoading && (!data || data.length === 0)) return null

  return (
    <section>
      <SectionHeading icon={icon} title={title} />
      <HorizontalScroller>
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-40 shrink-0 sm:w-44">
                <ShopCardSkeleton />
              </div>
            ))
          : data!.map((business) => (
              <div key={business.id} className="w-40 shrink-0 snap-start sm:w-44">
                <ShopCard business={business} />
              </div>
            ))}
      </HorizontalScroller>
    </section>
  )
}
