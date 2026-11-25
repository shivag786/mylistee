import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Menu, MessageCircle, Store } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Logo } from '@/components/icons/Logo'
import { useAppConfig } from '@/hooks/useAppConfig'
import { BUSINESS_TYPES } from './businessTypes'
import { CITIES } from './cities'
import { GUIDES } from './guides'
import { MKT, SUPPORT_EMAIL } from './site'
import { PlayBadge, usePlayLinks } from './ui'

const NAV: [string, string][] = [
  ['Features', `${MKT.join}#features`],
  ['How it works', `${MKT.join}#how-it-works`],
  ['Pricing', `${MKT.join}#pricing`],
  ['Guides', MKT.guides],
  ['Contact', MKT.contact],
]

/** WhatsApp link to the Listee team, when a support number is set. */
export function useSupport() {
  const { data } = useAppConfig()
  const phone = (data?.support?.phone ?? '').replace(/\D/g, '')
  const wa = phone.length >= 10 ? `https://wa.me/${phone.length === 10 ? `91${phone}` : phone}?text=${encodeURIComponent('Hi Listee team, I want to know more about Listee for my shop.')}` : null
  return { email: data?.support?.email || SUPPORT_EMAIL, phone: data?.support?.phone || '', wa }
}

/** Header, footer link hub and a floating "talk to us" button around every marketing page. */
export function MarketingShell({ children }: { children: ReactNode }) {
  const play = usePlayLinks()
  const support = useSupport()

  // The live page is up: drop the pre-rendered copy shown while it loaded (see main.tsx).
  useEffect(() => {
    const w = window as Window & { __listeeRevealApp?: () => void }
    w.__listeeRevealApp?.()
    w.__listeeRevealApp = undefined
  }, [])

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link to={MKT.join} aria-label="Listee home" className="shrink-0">
            <Logo size={30} showWordmark />
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {NAV.map(([label, to]) => (
              <Link key={label} to={to} className="rounded-full px-3.5 py-2 text-caption font-semibold text-text-secondary transition hover:bg-surface-muted hover:text-foreground">
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to={ROUTES.ownerLogin} className="hidden rounded-full px-3.5 py-2 text-caption font-semibold text-text-secondary hover:text-foreground sm:inline-flex">
              Shop login
            </Link>
            <Link to={ROUTES.ownerSignup} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-4 py-2 text-caption font-semibold text-white shadow-md shadow-rose-500/20 transition hover:shadow-lg">
              <Store className="size-4" aria-hidden /> Register free
            </Link>
            <details className="relative lg:hidden">
              <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-full border border-border [&::-webkit-details-marker]:hidden" aria-label="Menu">
                <Menu className="size-5" aria-hidden />
              </summary>
              <div className="absolute right-0 top-12 w-56 rounded-2xl border border-border bg-surface p-2 shadow-xl">
                {NAV.map(([label, to]) => (
                  <Link key={label} to={to} className="block rounded-xl px-3 py-2.5 font-semibold hover:bg-surface-muted">{label}</Link>
                ))}
                <Link to={ROUTES.ownerLogin} className="block rounded-xl px-3 py-2.5 font-semibold hover:bg-surface-muted">Shop login</Link>
              </div>
            </details>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">{children}</main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <Logo size={30} showWordmark />
            <p className="max-w-xs text-small text-text-secondary">
              Listee is the billing, ordering and customer-rewards app for local shops across India. Free to start, no commission on your orders.
            </p>
            <div className="flex flex-col items-start gap-2">
              <PlayBadge href={play.vendor} app="Listee Business" who="For shop owners" />
              <PlayBadge href={play.customer} app="Listee" who="For customers" />
            </div>
          </div>
          <FooterCol title="Guides" links={GUIDES.map((g) => [g.title, MKT.guide(g.slug)])} />
          <FooterCol title="Software for" links={BUSINESS_TYPES.map((t) => [`${t.short} billing software`, MKT.type(t.slug)])} />
          <div className="space-y-6">
            <FooterCol title="Company" links={[['About Listee', MKT.join], ['Contact us', MKT.contact], ['Explore shops', ROUTES.explore], ['Privacy policy', '/privacy'], ['Terms', '/terms']]} />
            <div className="space-y-1.5 text-small text-text-secondary">
              <a href={`mailto:${support.email}`} className="flex items-center gap-2 hover:text-foreground"><Mail className="size-4" />{support.email}</a>
              {support.wa && <a href={support.wa} target="_blank" rel="noopener" className="flex items-center gap-2 hover:text-foreground"><MessageCircle className="size-4" />WhatsApp {support.phone}</a>}
            </div>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="mx-auto max-w-6xl px-4 py-8">
            <p className="mb-3 text-small font-semibold text-foreground">POS & billing software near you</p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-small text-text-secondary">
              {CITIES.map((c) => (
                <li key={c.slug}><Link to={MKT.city(c.slug)} className="hover:text-foreground">POS software in {c.name}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-border py-5 text-center text-small text-text-muted">
          © {new Date().getFullYear()} Listee · listee.org · Made in India for local shops
        </div>
      </footer>

      {/* Talk to us — always one tap away. */}
      <Link
        to={MKT.contact}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-caption font-semibold text-white shadow-xl shadow-emerald-500/30 transition hover:-translate-y-0.5"
      >
        <MessageCircle className="size-4" aria-hidden /> Talk to Listee
      </Link>
    </div>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="mb-3 text-small font-semibold text-foreground">{title}</p>
      <ul className="space-y-2 text-small text-text-secondary">
        {links.map(([label, to]) => (
          <li key={to}><Link to={to} className="hover:text-foreground">{label}</Link></li>
        ))}
      </ul>
    </div>
  )
}
