import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  BadgePercent,
  Check,
  Coins,
  Heart,
  Link2,
  MapPin,
  Megaphone,
  QrCode,
  ReceiptIndianRupee,
  Repeat,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Tag,
  TrendingUp,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { HorizontalScroller } from '@/components/navigation/HorizontalScroller'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import { BannerCarousel } from '@/features/banners/BannerCarousel'
import { useBannerSlot } from '@/features/banners/useBanners'
import { usePublicCategories } from '@/features/businesses/hooks/useCategories'
import { useNearbyBusinesses } from '@/features/businesses/hooks/useNearbyBusinesses'
import { ShopCard } from '@/features/businesses/components/ShopCard'
import { ShopCardSkeleton } from '@/features/businesses/components/ShopCardSkeleton'
import { DealCard } from '@/features/deals/components/DealCard'
import { DealCardSkeleton } from '@/features/deals/components/DealCardSkeleton'
import { useDeals } from '@/features/deals/useDeals'
import { useAppLocation } from '@/features/location/useAppLocation'
import { usePlans } from '@/features/owner/hooks/useOwner'
import { featureLabel, formatPrice, planPeriod } from '@/features/owner/planDisplay'
import { fadeInUp } from '@/animations'
import { cn } from '@/utils/cn'
import type { LandingFaq, LandingItem, ResolvedLanding } from './landingContent'

const CUSTOMER_ICONS: LucideIcon[] = [Tag, Coins, Sparkles, QrCode, MapPin, Heart]
const VENDOR_ICONS: LucideIcon[] = [Store, Link2, BadgePercent, Repeat, ReceiptIndianRupee, Megaphone, TrendingUp, Star]

/** Section ids double as in-page anchors (#pricing, #faqs …) for the header links. */
export function LandingSection({
  id,
  title,
  subtitle,
  action,
  tone = 'plain',
  children,
}: {
  id: string
  title?: string
  subtitle?: string | null
  action?: ReactNode
  tone?: 'plain' | 'muted'
  children: ReactNode
}) {
  const reduce = useReducedMotion()
  return (
    <section id={id} aria-labelledby={title ? `${id}-title` : undefined} className={cn('scroll-mt-20 py-12 sm:py-16', tone === 'muted' && 'bg-surface-muted/60')}>
      <div className="app-container">
        {title && (
          <motion.div
            className="mb-7 flex flex-wrap items-end justify-between gap-3"
            variants={reduce ? undefined : fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
          >
            <div className="max-w-2xl">
              <h2 id={`${id}-title`} className="text-title font-bold tracking-tight text-foreground sm:text-heading">
                {title}
              </h2>
              {subtitle && <p className="mt-2 text-body text-text-secondary">{subtitle}</p>}
            </div>
            {action}
          </motion.div>
        )}
        {children}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- Hero

export function HeroSection({ hero }: { hero: ResolvedLanding['hero'] }) {
  const reduce = useReducedMotion()
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-gradient-to-br from-gradient-from to-gradient-to text-secondary-foreground"
    >
      {/* Soft colour blobs behind the copy. */}
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-accent/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 right-0 size-96 rounded-full bg-primary/40 blur-3xl" />

      <div className="app-container relative grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:py-24">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-small font-semibold ring-1 ring-white/20">
            <Sparkles className="size-3.5 text-accent" aria-hidden />
            {hero.badge}
          </span>
          <h1 className="mt-4 text-[2rem] font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            {hero.title}
          </h1>
          <p className="mt-4 max-w-xl text-body-lg text-white/80">{hero.subtitle}</p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent hover:brightness-95">
              <Link to={ROUTES.ownerSignup}>
                <Store className="size-5" aria-hidden /> {hero.vendorCta}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
              <Link to={ROUTES.explore}>
                <MapPin className="size-5" aria-hidden /> {hero.customerCta}
              </Link>
            </Button>
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-small text-white/75">
            {['Sign up with your mobile number', 'Set up from your phone', 'Your own shop link and QR'].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-accent" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* The two ways in, side by side. */}
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1"
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <AudienceCard
            icon={Store}
            eyebrow="For shop owners"
            title="Put your shop online and get more customers"
            points={['Online shop and menu', 'Offers, combos and rewards', 'Orders, billing and reviews']}
            cta="Register your shop"
            to={ROUTES.ownerSignup}
            highlight
          />
          <AudienceCard
            icon={UserRound}
            eyebrow="For customers"
            title="Find shops near you and save on every visit"
            points={['Today’s discounts nearby', 'Coins and rewards', 'Order at the table or pick up']}
            cta="Sign up free"
            to={ROUTES.login}
          />
        </motion.div>
      </div>
    </section>
  )
}

function AudienceCard({
  icon: Icon,
  eyebrow,
  title,
  points,
  cta,
  to,
  highlight,
}: {
  icon: LucideIcon
  eyebrow: string
  title: string
  points: string[]
  cta: string
  to: string
  highlight?: boolean
}) {
  return (
    <Link
      to={to}
      className={cn(
        'group block rounded-3xl p-5 text-foreground shadow-floating transition-transform hover:-translate-y-0.5',
        highlight ? 'bg-surface ring-2 ring-accent' : 'bg-surface/95',
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn('grid size-11 place-items-center rounded-2xl', highlight ? 'bg-accent/25 text-secondary' : 'bg-primary-soft text-primary')}>
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-small font-semibold uppercase tracking-wide text-text-muted">{eyebrow}</p>
          <p className="text-body font-bold leading-snug">{title}</p>
        </div>
      </div>
      <ul className="mt-3 space-y-1.5 text-caption text-text-secondary">
        {points.map((p) => (
          <li key={p} className="flex items-center gap-2">
            <Check className="size-4 shrink-0 text-success" aria-hidden /> {p}
          </li>
        ))}
      </ul>
      <span className="mt-4 inline-flex items-center gap-1 text-caption font-bold text-primary">
        {cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  )
}

// ---------------------------------------------------------------- Live data

export function BannersSection() {
  const banners = useBannerSlot('home_top')
  if (banners.length === 0) return null
  return (
    <section id="banners" className="app-container pt-8 sm:pt-10">
      <BannerCarousel banners={banners} />
    </section>
  )
}

export function CategoriesSection({ title, subtitle }: { title: string; subtitle: string | null }) {
  const { data } = usePublicCategories()
  const categories = (data ?? []).filter((c) => c.showOnHomepage)
  if (categories.length === 0) return null

  return (
    <LandingSection id="categories" title={title} subtitle={subtitle}>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {categories.slice(0, 12).map((c) => (
          <Link
            key={c.id}
            to={`${ROUTES.search}?q=${encodeURIComponent(c.name)}`}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-surface p-3 text-center shadow-soft transition-colors hover:border-primary/40"
          >
            <span className="grid size-14 place-items-center overflow-hidden rounded-2xl bg-primary-soft text-2xl">
              {c.imageUrl ? (
                <img src={c.imageUrl} alt="" className="size-full object-cover" loading="lazy" />
              ) : (
                (c.icon ?? <ShoppingBag className="size-6 text-primary" aria-hidden />)
              )}
            </span>
            <span className="line-clamp-2 text-caption font-semibold text-foreground group-hover:text-primary">{c.name}</span>
          </Link>
        ))}
      </div>
    </LandingSection>
  )
}

export function OffersSection({ title, subtitle }: { title: string; subtitle: string | null }) {
  const deals = useDeals(12)
  if (!deals.isLoading && (deals.data ?? []).length === 0) return null

  return (
    <LandingSection
      id="offers"
      title={title}
      subtitle={subtitle}
      tone="muted"
      action={<SeeAll to={ROUTES.deals} label="All offers" />}
    >
      <HorizontalScroller>
        {deals.isLoading
          ? Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="w-44 shrink-0 sm:w-52">
                <DealCardSkeleton />
              </div>
            ))
          : (deals.data ?? []).map((deal) => (
              <div key={deal.id} className="w-44 shrink-0 sm:w-52">
                <DealCard deal={deal} />
              </div>
            ))}
      </HorizontalScroller>
    </LandingSection>
  )
}

export function NearbySection({ title, subtitle }: { title: string; subtitle: string | null }) {
  const { coords, city } = useAppLocation()
  const nearby = useNearbyBusinesses({
    ...(city ? { city } : {}),
    ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
  })
  const shops = (nearby.data ?? []).slice(0, 8)
  if (!nearby.isLoading && shops.length === 0) return null

  return (
    <LandingSection id="nearby" title={title} subtitle={subtitle} action={<SeeAll to={ROUTES.nearby} label="All shops" />}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {nearby.isLoading
          ? Array.from({ length: 4 }, (_, i) => <ShopCardSkeleton key={i} />)
          : shops.map((b) => <ShopCard key={b.id} business={b} />)}
      </div>
    </LandingSection>
  )
}

function SeeAll({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-caption font-bold text-primary hover:underline">
      {label} <ArrowRight className="size-4" aria-hidden />
    </Link>
  )
}

// ---------------------------------------------------------------- Benefits

export function BenefitsSection({
  id,
  title,
  subtitle,
  items,
  audience,
  tone,
}: {
  id: string
  title: string
  subtitle: string | null
  items: LandingItem[]
  audience: 'customer' | 'vendor'
  tone?: 'plain' | 'muted'
}) {
  const icons = audience === 'vendor' ? VENDOR_ICONS : CUSTOMER_ICONS
  return (
    <LandingSection
      id={id}
      title={title}
      subtitle={subtitle}
      tone={tone}
      action={
        <Button asChild size="md" variant={audience === 'vendor' ? 'primary' : 'outline'}>
          <Link to={audience === 'vendor' ? ROUTES.ownerSignup : ROUTES.login}>
            {audience === 'vendor' ? 'Register your shop' : 'Sign up free'}
          </Link>
        </Button>
      }
    >
      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item, i) => {
          const Icon = icons[i % icons.length]
          return (
            <StaggerItem key={`${item.title}-${i}`}>
              <Card padding="md" className="h-full">
                <span
                  className={cn(
                    'grid size-11 place-items-center rounded-2xl',
                    audience === 'vendor' ? 'bg-accent/25 text-secondary dark:text-accent' : 'bg-primary-soft text-primary',
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-3 text-body font-bold text-foreground">{item.title}</h3>
                {item.text && <p className="mt-1 text-caption text-text-secondary">{item.text}</p>}
              </Card>
            </StaggerItem>
          )
        })}
      </Stagger>
    </LandingSection>
  )
}

// ---------------------------------------------------------------- How it works

const CUSTOMER_STEPS = [
  { title: 'Find a shop', text: 'Browse shops near you, their menus and today’s offers.' },
  { title: 'Order or visit', text: 'Scan the QR at the shop or order ahead — eat in or pick up.' },
  { title: 'Save and earn', text: 'Offers apply on their own, and you earn rewards for next time.' },
]
const VENDOR_STEPS = [
  { title: 'Register', text: 'Sign up with your mobile number and add your shop’s details.' },
  { title: 'Add products and offers', text: 'Upload your menu or products and create your first offer.' },
  { title: 'Share your link and QR', text: 'Send your link on WhatsApp and put the QR on your counter.' },
]

export function HowItWorksSection({ title, subtitle }: { title: string; subtitle: string | null }) {
  return (
    <LandingSection id="how-it-works" title={title} subtitle={subtitle} tone="muted">
      <div className="grid gap-5 lg:grid-cols-2">
        <StepsCard icon={UserRound} heading="For customers" steps={CUSTOMER_STEPS} cta="Explore shops" to={ROUTES.explore} />
        <StepsCard icon={Store} heading="For shop owners" steps={VENDOR_STEPS} cta="Register your shop" to={ROUTES.ownerSignup} primary />
      </div>
    </LandingSection>
  )
}

function StepsCard({
  icon: Icon,
  heading,
  steps,
  cta,
  to,
  primary,
}: {
  icon: LucideIcon
  heading: string
  steps: { title: string; text: string }[]
  cta: string
  to: string
  primary?: boolean
}) {
  return (
    <Card padding="lg" className="flex flex-col">
      <h3 className="inline-flex items-center gap-2 text-subtitle font-bold text-foreground">
        <Icon className="size-5 text-primary" aria-hidden /> {heading}
      </h3>
      <ol className="mt-5 flex-1 space-y-4">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-caption font-bold text-primary-foreground">
              {i + 1}
            </span>
            <div>
              <p className="text-body font-semibold text-foreground">{s.title}</p>
              <p className="text-caption text-text-secondary">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <Button asChild size="md" variant={primary ? 'primary' : 'outline'} className="mt-6 self-start">
        <Link to={to}>
          {cta} <ArrowRight className="size-4" aria-hidden />
        </Link>
      </Button>
    </Card>
  )
}

// ---------------------------------------------------------------- Personal link

export function PersonalLinkSection({ title, subtitle }: { title: string; subtitle: string | null }) {
  return (
    <LandingSection id="personal-link">
      <div className="grid overflow-hidden rounded-[2rem] bg-gradient-to-br from-gradient-from to-gradient-to text-secondary-foreground lg:grid-cols-[1.2fr_1fr]">
        <div className="p-7 sm:p-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-small font-semibold ring-1 ring-white/20">
            <Link2 className="size-3.5 text-accent" aria-hidden /> Personal link
          </span>
          <h2 id="personal-link-title" className="mt-4 text-title font-extrabold tracking-tight sm:text-heading">
            {title}
          </h2>
          {subtitle && <p className="mt-3 max-w-xl text-body text-white/80">{subtitle}</p>}
          <ul className="mt-5 space-y-2 text-caption text-white/85">
            {[
              'One link for WhatsApp, Instagram, Google and your visiting card',
              'A QR for your counter and tables that opens straight to your shop',
              'Your products, offers, rewards and reviews — and nothing else',
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden /> {t}
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-7 bg-accent text-accent-foreground hover:bg-accent hover:brightness-95">
            <Link to={ROUTES.ownerSignup}>
              Get your shop link <ArrowRight className="size-5" aria-hidden />
            </Link>
          </Button>
        </div>

        <div className="flex flex-col justify-center gap-3 bg-black/15 p-7 sm:p-10">
          {[
            ['Free', 'No trial, no pack — every shop gets it'],
            ['Never expires', 'It stays on until you switch it off'],
            ['One tap', 'Switch it on from your business app'],
          ].map(([head, line]) => (
            <div key={head} className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
              <p className="text-body font-bold">{head}</p>
              <p className="text-small text-white/70">{line}</p>
            </div>
          ))}
        </div>
      </div>
    </LandingSection>
  )
}

// ---------------------------------------------------------------- Pricing

export function PricingSection({ title, subtitle }: { title: string; subtitle: string | null }) {
  const { data: plans, isLoading } = usePlans()
  const list = (plans ?? []).filter((p) => p.isActive !== false)
  if (!isLoading && list.length === 0) return null

  return (
    <LandingSection id="pricing" title={title} subtitle={subtitle} tone="muted">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
        {isLoading
          ? Array.from({ length: 3 }, (_, i) => <div key={i} className="h-80 animate-pulse rounded-card bg-surface" />)
          : list.map((plan) => {
              const featured = Boolean(plan.badge)
              const intro = plan.intro?.active ? plan.intro : null
              return (
                <Card
                  key={plan.id}
                  padding="lg"
                  elevation={featured ? 'floating' : 'soft'}
                  className={cn('relative flex flex-col', featured && 'ring-2 ring-primary')}
                >
                  {plan.badge && (
                    <Badge className="absolute -top-3 left-5 bg-primary text-primary-foreground">{plan.badge}</Badge>
                  )}
                  <h3 className="text-subtitle font-bold text-foreground">{plan.name}</h3>
                  {plan.description && <p className="mt-1 text-caption text-text-secondary">{plan.description}</p>}
                  <p className="mt-4">
                    <span className="text-heading font-extrabold text-foreground">{formatPrice(plan.price, plan.currency)}</span>
                    <span className="text-caption text-text-muted">{plan.price > 0 ? planPeriod(plan) : ''}</span>
                  </p>
                  {intro && (
                    <p className="mt-1 text-small font-semibold text-success">
                      {intro.label || `${formatPrice(intro.price, plan.currency)} for your first ${intro.days} days`}
                    </p>
                  )}
                  <ul className="mt-5 flex-1 space-y-2 text-caption text-text-secondary">
                    {planHighlights(plan).map((f) => (
                      <li key={f} className="flex gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button asChild size="md" variant={featured ? 'primary' : 'outline'} fullWidth className="mt-6">
                    <Link to={ROUTES.ownerSignup}>{plan.isFree ? 'Start free' : `Choose ${plan.name}`}</Link>
                  </Button>
                </Card>
              )
            })}
      </div>
    </LandingSection>
  )
}

/** What a plan card lists: its feature labels, then its main limits. */
function planHighlights(plan: NonNullable<ReturnType<typeof usePlans>['data']>[number]): string[] {
  const out = (plan.features ?? []).map(featureLabel)
  const { maxProducts, maxActiveOffers } = plan.limits
  if (maxProducts !== undefined) out.push(maxProducts === null ? 'Unlimited products' : `Up to ${maxProducts} products`)
  if (maxActiveOffers !== undefined) out.push(maxActiveOffers === null ? 'Unlimited offers' : `${maxActiveOffers} live offers at a time`)
  return out.slice(0, 8)
}

// ---------------------------------------------------------------- FAQs + closing

export function FaqSection({ title, subtitle, faqs }: { title: string; subtitle: string | null; faqs: LandingFaq[] }) {
  return (
    <LandingSection id="faqs" title={title} subtitle={subtitle}>
      <Card padding="none" className="max-w-3xl px-5">
        <Accordion type="single" collapsible>
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-body font-semibold text-foreground">{f.q}</AccordionTrigger>
              <AccordionContent className="whitespace-pre-line text-caption text-text-secondary">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>
    </LandingSection>
  )
}

export function FinalCtaSection({ title, subtitle }: { title: string; subtitle: string | null }) {
  return (
    <section id="join" className="py-12 sm:py-16">
      <div className="app-container">
        <div className="rounded-[2rem] bg-secondary px-6 py-10 text-center text-secondary-foreground sm:px-10 sm:py-14">
          <h2 className="mx-auto max-w-2xl text-title font-extrabold tracking-tight sm:text-heading">{title}</h2>
          {subtitle && <p className="mx-auto mt-3 max-w-xl text-body text-white/80">{subtitle}</p>}
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent hover:brightness-95">
              <Link to={ROUTES.ownerSignup}>
                <Store className="size-5" aria-hidden /> I own a shop
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
              <Link to={ROUTES.login}>
                <UserRound className="size-5" aria-hidden /> I’m a customer
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
