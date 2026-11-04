import { Fragment, useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Store } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Logo } from '@/components/icons/Logo'
import { Button } from '@/components/ui/button'
import { LegalFooter } from '@/components/navigation/LegalFooter'
import { LocationProvider } from '@/features/location/LocationProvider'
import { useAppConfig } from '@/hooks/useAppConfig'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
  resolveLanding,
  sectionText,
  type LandingSectionId,
  type LandingSectionSetting,
  type ResolvedLanding,
} from '@/features/landing/landingContent'
import {
  BannersSection,
  BenefitsSection,
  CategoriesSection,
  FaqSection,
  FinalCtaSection,
  HeroSection,
  HowItWorksSection,
  NearbySection,
  OffersSection,
  PersonalLinkSection,
  PricingSection,
} from '@/features/landing/LandingSections'

/** Header links, shown only for sections that are switched on. */
const NAV: { id: LandingSectionId; anchor: string; label: string }[] = [
  { id: 'offers', anchor: 'offers', label: 'Offers' },
  { id: 'vendorBenefits', anchor: 'for-shops', label: 'For shops' },
  { id: 'pricing', anchor: 'pricing', label: 'Pricing' },
  { id: 'faqs', anchor: 'faqs', label: 'FAQs' },
]

/**
 * The landing page — `/` for signed-out visitors when the admin chooses it
 * (Admin → Landing page). Sells Listee to customers and shop owners on one
 * page: live shops, offers and categories for customers; benefits, the
 * personal link, plans and sign-up for shops. Content and section order come
 * from the admin (landingContent.ts holds the defaults).
 */
export function LandingPage() {
  usePageTitle()
  const { data: config } = useAppConfig()
  const landing = useMemo(() => resolveLanding(config?.landingPage), [config?.landingPage])
  const sections = landing.sections.filter((s) => s.enabled)
  const on = new Set(sections.map((s) => s.id))

  return (
    <LocationProvider>
      <div className="flex min-h-dvh flex-col bg-background">
        <header className="sticky top-0 z-40 border-b border-border/60 bg-header/90 backdrop-blur-xl">
          <div className="app-container flex h-16 items-center justify-between gap-3">
            <Link to={ROUTES.home} aria-label="Listee home" className="shrink-0">
              <Logo size={32} showWordmark />
            </Link>
            <nav aria-label="Page sections" className="hidden items-center gap-1 md:flex">
              {NAV.filter((n) => on.has(n.id)).map((n) => (
                <a
                  key={n.id}
                  href={`#${n.anchor}`}
                  className="rounded-full px-3.5 py-2 text-caption font-semibold text-text-secondary hover:bg-surface-muted hover:text-foreground"
                >
                  {n.label}
                </a>
              ))}
              <Link
                to={ROUTES.explore}
                className="rounded-full px-3.5 py-2 text-caption font-semibold text-text-secondary hover:bg-surface-muted hover:text-foreground"
              >
                Explore shops
              </Link>
            </nav>
            <div className="flex shrink-0 items-center gap-2">
              <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
                <Link to={ROUTES.login}>Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to={ROUTES.ownerSignup}>
                  <Store className="size-4" aria-hidden /> Register shop
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main id="main-content" className="flex-1">
          {sections.map((section) => (
            <Fragment key={section.id}>{renderSection(section, landing)}</Fragment>
          ))}
        </main>

        <SiteFooter />
        <LegalFooter />
      </div>
    </LocationProvider>
  )
}

function renderSection(section: LandingSectionSetting, landing: ResolvedLanding): ReactNode {
  const { title, subtitle } = sectionText(section)
  switch (section.id) {
    case 'hero':
      return <HeroSection hero={landing.hero} />
    case 'banners':
      return <BannersSection />
    case 'categories':
      return <CategoriesSection title={title} subtitle={subtitle} />
    case 'offers':
      return <OffersSection title={title} subtitle={subtitle} />
    case 'nearby':
      return <NearbySection title={title} subtitle={subtitle} />
    case 'customerBenefits':
      return (
        <BenefitsSection id="for-customers" audience="customer" title={title} subtitle={subtitle} items={landing.customerBenefits} />
      )
    case 'howItWorks':
      return <HowItWorksSection title={title} subtitle={subtitle} />
    case 'vendorBenefits':
      return <BenefitsSection id="for-shops" audience="vendor" title={title} subtitle={subtitle} items={landing.vendorBenefits} />
    case 'personalLink':
      return <PersonalLinkSection title={title} subtitle={subtitle} />
    case 'pricing':
      return <PricingSection title={title} subtitle={subtitle} />
    case 'faqs':
      return <FaqSection title={title} subtitle={subtitle} faqs={landing.faqs} />
    case 'finalCta':
      return <FinalCtaSection title={title} subtitle={subtitle} />
  }
}

function SiteFooter() {
  const columns: { heading: string; links: { to: string; label: string }[] }[] = [
    {
      heading: 'For customers',
      links: [
        { to: ROUTES.explore, label: 'Explore shops' },
        { to: ROUTES.nearby, label: 'Shops near me' },
        { to: ROUTES.deals, label: 'Today’s offers' },
        { to: ROUTES.login, label: 'Sign in / sign up' },
      ],
    },
    {
      heading: 'For shops',
      links: [
        { to: ROUTES.ownerSignup, label: 'Register your shop' },
        { to: ROUTES.ownerLogin, label: 'Shop owner login' },
        { to: '#pricing', label: 'Pricing' },
        { to: '#faqs', label: 'FAQs' },
      ],
    },
  ]
  return (
    <footer className="border-t border-border/60 bg-surface">
      <div className="app-container grid gap-8 py-10 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo size={36} showWordmark />
          <p className="mt-3 max-w-xs text-caption text-text-secondary">
            Local shops, their offers and your rewards — in one place.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.heading}>
            <p className="text-caption font-bold text-foreground">{col.heading}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  {/* In-page anchors are plain links: the router would treat "#…" as a route. */}
                  {l.to.startsWith('#') ? (
                    <a href={l.to} className="text-caption text-text-secondary hover:text-primary hover:underline">
                      {l.label}
                    </a>
                  ) : (
                    <Link to={l.to} className="text-caption text-text-secondary hover:text-primary hover:underline">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  )
}
