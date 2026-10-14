import { Fragment, useMemo, useState, type ReactNode } from 'react'
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
  Clock,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
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
import { useComboFeed } from '@/features/combos/useComboFeed'
import { useAppConfig } from '@/features/system/hooks/useAppConfig'
import { useAppConfig as useBrandConfig } from '@/hooks/useAppConfig'
import { useAppLocation } from '@/features/location/useAppLocation'
import { PermissionsPrompt } from '@/features/permissions/PermissionsPrompt'
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
import { useHomeSpotlight } from '@/features/home/useHomeSpotlight'
import { HeroCarousel3D } from '@/features/home/HeroCarousel3D'
import { StoryRail } from '@/features/home/StoryRail'
import { HowItWorks } from '@/features/home/HowItWorks'
import { ReelsRow } from '@/features/reels/ReelsRow'
import { visibleSections, type HomeSectionId } from '@/features/home/homeSections'
import { ComboCard } from '@/features/businesses/components/dish/ComboCard'
import { ComboSheet } from '@/features/businesses/components/dish/ComboSheet'
import { FeedShopTags } from '@/features/businesses/components/FeedShopTags'
import { Button } from '@/components/ui/button'
import { fadeInUp } from '@/animations'
import { cn } from '@/utils/cn'
import type { Business, BusinessCategory } from '@/features/businesses/types'
import type { Deal } from '@/features/deals/types'
import type { ComboDeal } from '@/features/combos/types'

/** Greeting + subtitle that shift with the time of day. */
function timeContext() {
  const h = new Date().getHours()
  if (h < 12)
    return { greeting: 'Good morning', line: 'Breakfast spots and morning deals near you.' }
  if (h < 17) return { greeting: 'Good afternoon', line: 'Lunch deals and combos around you.' }
  if (h < 21)
    return { greeting: 'Good evening', line: 'Dinner, combos, and evening offers near you.' }
  return { greeting: 'Late night', line: 'Late-night bites and offers near you.' }
}

export function HomePage() {
  const { user, isAuthenticated } = useAuth()
  const coins = useCoinSummary(isAuthenticated)
  const appConfig = useAppConfig()
  // The typed public config that carries the home layout (same /config endpoint).
  const brandConfig = useBrandConfig()
  const categories = usePublicCategories()
  // Above-the-fold: fetched eagerly so there's immediate content under the hero.
  const deals = useDeals()
  // No `withContent` filter: it hides any shop without a live offer / visible
  // product / visible combo, which is every newly added shop.
  // Coordinates come from the header chip, so the row re-sorts by distance as
  // soon as a location is set.
  const { coords, city } = useAppLocation()
  const nearby = useNearbyBusinesses({
    // City narrows the list; coordinates order what is left by distance.
    ...(city ? { city } : {}),
    ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
  })
  const topBanners = useBannerSlot('home_top')
  const afterCombosBanners = useBannerSlot('home_after_combos')
  const spotlight = useHomeSpotlight()
  // "Open now" chip: narrows the nearby grid to shops open at this moment.
  const [openOnly, setOpenOnly] = useState(false)
  const shops = openOnly ? (nearby.data ?? []).filter((b) => b.isOpen) : nearby.data
  const coinValue = brandConfig.data?.coins?.value ?? 1

  function toggleOpenOnly() {
    const next = !openOnly
    setOpenOnly(next)
    if (next) document.getElementById('nearby-shops')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Admin-controlled: hide the whole category quick-filter row when the flag is off.
  const showCategoryChips = appConfig.data?.flags.homeCategoryFilter ?? true
  const { greeting, line } = timeContext()

  // Shops with a spin available right now (from the nearby grid).
  const spinCount = useMemo(() => {
    const ids = new Set<string>()
    for (const b of nearby.data ?? []) if (b.spinAvailable) ids.add(b.id)
    return ids.size
  }, [nearby.data])

  const heroHeader = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-caption font-medium opacity-90">
            <Sparkles className="size-4" aria-hidden />
            Menus, offers & rewards near you
          </p>
          <h1 className="mt-1 text-subtitle font-bold tracking-tight sm:text-title">
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
            {coins.data.total > 0 && <span className="font-normal opacity-80">· ₹{coins.data.total * coinValue}</span>}
          </Link>
        )}
      </div>
      <p className="mt-1 text-body opacity-90">{line}</p>
    </>
  )

  // Admin-arranged order (Settings → Home layout); sections can be switched
  // off or limited to a part of the day.
  const sections: Record<HomeSectionId, (title?: string | null) => ReactNode> = {
    // Hero: dishes on a 3D ring when there are enough photos, else the plain greeting.
    hero: () =>
      spotlight.data && spotlight.data.hero.length >= 3 ? (
        <HeroCarousel3D dishes={spotlight.data.hero} header={heroHeader} />
      ) : (
        <section className="rounded-cover bg-gradient-to-br from-gradient-from to-gradient-to px-5 py-6 text-white shadow-premium">
          {heroHeader}
        </section>
      ),
    // Followed shops and shops with something new today
    stories: () => spotlight.data && <StoryRail stories={spotlight.data.stories} />,
    banners_top: () => topBanners.length > 0 && <BannerCarousel banners={topBanners} />,
    search: () => <AnimatedSearchBar />,
    rewards: () => (
      <>
        {isAuthenticated && <CoinsProgressCard />}
        <SpinPrompt count={spinCount} />
      </>
    ),
    categories: () => (
      <CategoryChips query={categories} showCategories={showCategoryChips} openOnly={openOnly} onToggleOpen={toggleOpenOnly} />
    ),
    // Eager: usually right under the hero.
    deals: (title) => (
      <DealRow title={title ?? "Today's Deals"} icon={Tag} query={deals} seeAllTo={ROUTES.deals} />
    ),
    // Below the fold — each mounts (and fetches) only when scrolled near.
    reels: (title) => (
      <LazySection minHeight={300}>
        <ReelsRow title={title ?? undefined} />
      </LazySection>
    ),
    combos: (title) => (
      <LazySection minHeight={220}>
        <CombosSection title={title} />
      </LazySection>
    ),
    banners_after_combos: () =>
      afterCombosBanners.length > 0 && <BannerCarousel banners={afterCombosBanners} />,
    festival: (title) => (
      <LazySection minHeight={180}>
        <FestivalSection title={title} />
      </LazySection>
    ),
    recommended: (title) => (
      <LazySection minHeight={220}>
        <RecommendedSection title={title} />
      </LazySection>
    ),
    new: (title) => (
      <LazySection minHeight={220}>
        <NewSection title={title} />
      </LazySection>
    ),
    nearby: (title) => (
      <section id="nearby-shops" className="scroll-mt-20">
        <SectionHeading icon={MapPin} title={openOnly ? 'Open now near you' : (title ?? 'Nearby you')}>
          {nearby.isFetching && !nearby.isLoading && (
            <RefreshCw className="size-4 animate-spin text-text-muted" aria-hidden />
          )}
        </SectionHeading>

        {nearby.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <ShopCardSkeleton key={i} />
            ))}
          </div>
        ) : nearby.isError ? (
          <ErrorState variant="offline" onRetry={() => nearby.refetch()} />
        ) : openOnly && shops?.length === 0 && (nearby.data?.length ?? 0) > 0 ? (
          <EmptyState
            icon={<Clock className="size-7" />}
            title="No shops open right now"
            description="Check back later, or see every shop near you."
            actionLabel="Show all shops"
            onAction={() => setOpenOnly(false)}
          />
        ) : !nearby.data || nearby.data.length === 0 ? (
          <EmptyState
            icon={<Search className="size-7" />}
            title={MESSAGES.empty.nearby.title}
            description={MESSAGES.empty.nearby.description}
            actionLabel={MESSAGES.empty.nearby.action}
            onAction={() => nearby.refetch()}
          />
        ) : (
          <Stagger className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {(shops ?? []).map((business) => (
              <StaggerItem key={business.id}>
                <ShopCard business={business} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>
    ),
  }
  const layout = visibleSections(brandConfig.data?.homeLayout)

  return (
    <div className="space-y-7 lg:space-y-9">
      {/* Asks for location and notifications on a first visit. Above the fold:
          location is what makes the rows below it worth reading. */}
      <PermissionsPrompt />

      {/* First-visit explainer: no hero section → it leads the page. */}
      {!layout.some((s) => s.id === 'hero') && <HowItWorks isAuthenticated={isAuthenticated} />}
      {layout.map((section) => (
        <Fragment key={section.id}>
          {sections[section.id](section.title?.trim() || null)}
          {section.id === 'hero' && <HowItWorks isAuthenticated={isAuthenticated} />}
        </Fragment>
      ))}

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
  children?: ReactNode
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className="mb-3 flex items-center justify-between"
      variants={reduce ? undefined : fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-20px' }}
    >
      <h2 className="inline-flex items-center gap-2 text-body-lg font-bold tracking-tight text-foreground sm:text-subtitle">
        <motion.span
          className="grid size-7 place-items-center rounded-full bg-primary-soft"
          initial={reduce ? false : { rotate: -30, scale: 0.6 }}
          whileInView={{ rotate: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 300, damping: 14 }}
        >
          <Icon className="size-4 text-primary" aria-hidden />
        </motion.span>
        {title}
      </h2>
      {children}
    </motion.div>
  )
}

/** Nudge card → shops that currently have a spin to award. Hides when none. */
function SpinPrompt({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <Card
      padding="md"
      interactive
      className="relative overflow-hidden bg-gradient-to-br from-premium/15 to-primary/10"
    >
      <Link
        to={`${ROUTES.nearby}?spin=1`}
        className="absolute inset-0"
        aria-label="Shops with a spin available"
      />
      <div className="flex items-center gap-3">
        <MiniWheel />
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

/** A small spin wheel that keeps turning — the spin prompt's eye-catcher. */
function MiniWheel() {
  const colors = ['var(--primary)', 'var(--gold)', 'var(--success)', 'var(--info)']
  const slices = 8
  return (
    <span className="relative grid size-12 shrink-0 place-items-center" aria-hidden>
      <svg
        viewBox="-50 -50 100 100"
        className="size-12 drop-shadow motion-safe:animate-[spin_5s_linear_infinite]"
      >
        {Array.from({ length: slices }).map((_, i) => {
          const a0 = (i / slices) * Math.PI * 2
          const a1 = ((i + 1) / slices) * Math.PI * 2
          const d = `M0 0 L${Math.cos(a0) * 48} ${Math.sin(a0) * 48} A48 48 0 0 1 ${Math.cos(a1) * 48} ${Math.sin(a1) * 48} Z`
          return (
            <path key={i} d={d} fill={colors[i % colors.length]} stroke="white" strokeWidth="1.5" />
          )
        })}
        <circle r="10" fill="white" />
      </svg>
      <Zap className="absolute size-3.5 fill-gold text-gold" />
      <span className="absolute -top-1 left-1/2 size-0 -translate-x-1/2 border-x-[5px] border-t-[8px] border-x-transparent border-t-foreground" />
    </span>
  )
}

/**
 * Quick filters: "Open now" first (filters the nearby grid in place), then the
 * category chips that open Search pre-filtered.
 */
function CategoryChips({
  query,
  showCategories,
  openOnly,
  onToggleOpen,
}: {
  query: UseQueryResult<BusinessCategory[]>
  showCategories: boolean
  openOnly: boolean
  onToggleOpen: () => void
}) {
  const { data } = query
  const chips = showCategories ? (data ?? []).filter((c) => c.showOnHomepage) : []

  return (
    <HorizontalScroller>
      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        onClick={onToggleOpen}
        aria-pressed={openOnly}
        className={cn(
          'inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-4 py-2 text-caption font-semibold shadow-soft transition-colors',
          openOnly ? 'border-success bg-success text-white' : 'border-success/40 bg-success-soft text-success',
        )}
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full rounded-full bg-current opacity-60 motion-safe:animate-ping" />
          <span className="relative inline-flex size-2 rounded-full bg-current" />
        </span>
        Open now
      </motion.button>
      {chips.map((category, i) => (
        <MotionLink
          key={category.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: Math.min(i, 8) * 0.04 }}
          whileTap={{ scale: 0.92 }}
          to={`${ROUTES.search}?q=${encodeURIComponent(category.name)}`}
          className="shrink-0 snap-start rounded-full border border-border bg-surface px-4 py-2 text-caption font-medium text-foreground shadow-soft transition-colors hover:border-primary hover:text-primary"
        >
          {category.name}
        </MotionLink>
      ))}
    </HorizontalScroller>
  )
}

const MotionLink = motion.create(Link)

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
function ComboRow({ title, query }: { title: string; query: UseQueryResult<ComboDeal[]> }) {
  const { data, isLoading } = query
  const [openId, setOpenId] = useState<string | null>(null)
  const open = data?.find((c) => c.id === openId) ?? null

  if (!isLoading && (!data || data.length === 0)) return null

  return (
    <section>
      <SectionHeading icon={Layers} title={title} />
      <HorizontalScroller>
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-72 shrink-0">
                <DealCardSkeleton />
              </div>
            ))
          : data!.map((combo) => (
              <div key={combo.id} className="w-72 shrink-0 snap-start">
                <HomeComboCard combo={combo} onOpen={() => setOpenId(combo.id)} />
              </div>
            ))}
      </HorizontalScroller>
      <ComboSheet
        combo={open}
        onOpenChange={(o) => !o && setOpenId(null)}
        subtitle={open && <ComboShopLine combo={open} />}
        action={
          open && (
            <Button asChild>
              <Link to={ROUTES.businessProfile(open.business.slug)}>Order at shop</Link>
            </Button>
          )
        }
      />
    </section>
  )
}

/** The combo's shop, with distance / followed tags. */
function ComboShopLine({ combo }: { combo: ComboDeal }) {
  return (
    <span className="mt-0.5 block space-y-0.5">
      <span className="block truncate text-caption text-text-secondary">{combo.business.name}</span>
      <FeedShopTags isFollowed={combo.business.isFollowed} distanceMeters={combo.business.distanceMeters} />
    </span>
  )
}

/** The shop-page combo card, labelled with its shop; tapping opens the combo sheet. */
function HomeComboCard({ combo, onOpen }: { combo: ComboDeal; onOpen: () => void }) {
  const shopUrl = ROUTES.businessProfile(combo.business.slug)
  return (
    <ComboCard
      combo={combo}
      tint
      className="h-full"
      onOpen={onOpen}
      subtitle={<ComboShopLine combo={combo} />}
      control={
        <Button asChild size="sm">
          <Link to={shopUrl}>Order</Link>
        </Button>
      }
    />
  )
}

/**
 * Self-contained below-the-fold sections. Each owns its query hook, so when
 * wrapped in <LazySection> the fetch only fires once the section is scrolled
 * near — nothing is loaded for sections the user never reaches.
 */
function FestivalSection({ title }: { title?: string | null }) {
  return (
    <DealRow title={title ?? 'Festival specials'} icon={PartyPopper} query={useFestivalDeals()} />
  )
}

function CombosSection({ title }: { title?: string | null }) {
  return <ComboRow title={title ?? 'Combos near you'} query={useComboFeed()} />
}

function RecommendedSection({ title }: { title?: string | null }) {
  return <ShopRow title={title ?? 'Recommended'} icon={Star} query={useRecommendedBusinesses()} />
}

function NewSection({ title }: { title?: string | null }) {
  return <ShopRow title={title ?? 'New on Listee'} icon={Sparkles} query={useNewBusinesses()} />
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
              <div key={i} className="w-44 shrink-0 sm:w-52 lg:w-56">
                <ShopCardSkeleton />
              </div>
            ))
          : data!.map((business) => (
              <div key={business.id} className="w-44 shrink-0 snap-start sm:w-52 lg:w-56">
                <ShopCard business={business} />
              </div>
            ))}
      </HorizontalScroller>
    </section>
  )
}
