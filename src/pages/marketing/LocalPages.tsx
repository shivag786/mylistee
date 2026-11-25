import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowRight, Check, MapPin, X } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { MarketingShell } from '@/features/marketing/MarketingShell'
import { EnquiryForm } from '@/features/marketing/EnquiryForm'
import { MockScreen, PhoneFrame } from '@/features/marketing/mocks'
import { BUSINESS_TYPES, typeBySlug, type BusinessType } from '@/features/marketing/businessTypes'
import { CITIES, cityBySlug, type City } from '@/features/marketing/cities'
import { GENERAL_FAQS, GUIDES } from '@/features/marketing/guides'
import { abs, MKT, SUPPORT_EMAIL } from '@/features/marketing/site'
import { usePageSeo, type PageMeta } from '@/features/marketing/seo'
import { breadcrumbJsonLd, Faq, faqJsonLd, IconByName, PlayBadge, Reveal, SectionHead, usePlayLinks } from '@/features/marketing/ui'
import { accent, Blobs, LivePill, LiveShops } from '@/features/marketing/showcase'

/* ============================ Cities ============================ */

const isVillage = (c: City) => c.slug === 'small-towns-and-villages'

function cityFaqs(c: City): [string, string][] {
  const where = isVillage(c) ? 'small towns and villages' : c.name
  return [
    [`Which is the best POS / billing app for shops in ${where}?`, `Listee is a free-to-start POS and billing app used by shops in ${where}${isVillage(c) ? '' : ` and nearby ${c.nearby.slice(0, 3).join(', ')}`}. It works on any Android phone, prints GST bills, takes table QR and online orders without commission, and brings customers back with rewards.`],
    [`Is Listee available near me in ${isVillage(c) ? 'my village' : c.nearby[0]}?`, `Yes. Listee works anywhere in India with mobile internet. ${isVillage(c) ? 'Shops in tehsil markets, highway dhabas and village kirana stores use it.' : `Shops in ${c.name}, ${c.nearby.join(', ')} can register online and get set up the same day.`}`],
    [`Can someone from Listee help me set up in ${where}?`, `Yes. Leave your number on this page or email ${SUPPORT_EMAIL}; the Listee team calls back within one working day and helps you add your menu over a call${isVillage(c) ? '' : `, or through a local partner in ${c.name}`}.`],
    ['How much does it cost?', 'Starting is free. Paid plans are monthly, quarterly or yearly, and Listee takes no commission on your orders.'],
  ]
}

export function cityMeta(c: City): PageMeta {
  const place = isVillage(c) ? 'small towns & villages' : c.name
  return {
    title: isVillage(c)
      ? 'Billing & POS app for small towns and village shops — free to start'
      : `POS & billing software in ${c.name} — free app for shops | ${c.hindi}`,
    description: `Best POS and billing app for shops in ${place}${isVillage(c) ? '' : `, ${c.state}`}: GST bills, table QR ordering, online orders without commission, printer, rewards and offers. Free to start${isVillage(c) ? '' : ` — also in ${c.nearby.slice(0, 4).join(', ')}`}.`,
    path: MKT.city(c.slug),
    jsonLd: [
      {
        '@type': 'Service',
        name: `Listee POS & billing software in ${place}`,
        serviceType: 'Point of sale and billing software',
        provider: { '@id': 'https://listee.org/#organization' },
        areaServed: isVillage(c)
          ? { '@type': 'Country', name: 'India' }
          : [{ '@type': 'City', name: c.name, containedInPlace: { '@type': 'State', name: c.state } }, ...c.nearby.map((n) => ({ '@type': 'Place', name: n }))],
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR', description: 'Free to start' },
      },
      faqJsonLd(cityFaqs(c)),
      breadcrumbJsonLd([['Listee', abs(MKT.join)], ['POS software by city', abs(MKT.cities)], [place, abs(MKT.city(c.slug))]]),
    ],
  }
}

export const citiesMeta: PageMeta = {
  title: 'POS & billing software near you — Listee in every city, town and village',
  description: 'Listee POS and billing app for shops in Jhansi, Gwalior, Lucknow, Delhi, Pune, Bangalore, Mumbai, Hyderabad and small towns and villages across India. Free to start, no commission.',
  path: MKT.cities,
  jsonLd: [breadcrumbJsonLd([['Listee', abs(MKT.join)], ['POS software by city', abs(MKT.cities)]])],
}

export function CityHubPage() {
  usePageSeo(citiesMeta)
  const byState = CITIES.reduce<Record<string, City[]>>((acc, c) => {
    ;(acc[c.state] ??= []).push(c)
    return acc
  }, {})
  return (
    <MarketingShell>
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHead eyebrow="Near you" title="POS & billing software in your city" sub="Listee works in every city, town and village in India. Pick your place to see how local shops use it." />
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(byState).map(([state, list]) => (
            <Reveal key={state}>
              <h2 className="mb-3 text-small font-semibold uppercase tracking-wider text-text-muted">{state}</h2>
              <ul className="space-y-1.5">
                {list.map((c) => (
                  <li key={c.slug}>
                    <Link to={MKT.city(c.slug)} className="group flex items-center gap-2 font-semibold hover:text-primary">
                      <MapPin className="size-4 text-text-muted group-hover:text-primary" aria-hidden />POS software in {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </section>
    </MarketingShell>
  )
}

export function CityPage() {
  const { city } = useParams<{ city: string }>()
  const c = cityBySlug(city)
  if (!c) return <Navigate to={MKT.cities} replace />
  return <CityContent city={c} />
}

export function CityContent({ city: c }: { city: City }) {
  usePageSeo(cityMeta(c))
  const play = usePlayLinks()
  const village = isVillage(c)
  const place = village ? 'small towns & villages' : c.name
  const popular = c.popular.map((s) => typeBySlug(s)).filter(Boolean) as BusinessType[]
  const nearbyCities = CITIES.filter((x) => x.state === c.state && x.slug !== c.slug).slice(0, 6)

  return (
    <MarketingShell>
      <section className="relative overflow-hidden"><Blobs />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 lg:grid-cols-[1.2fr_auto]">
        <div>
          <nav aria-label="Breadcrumb" className="text-small text-text-muted">
            <Link to={MKT.join} className="hover:text-foreground">Listee</Link> / <Link to={MKT.cities} className="hover:text-foreground">Cities</Link> / <span className="text-foreground">{place}</span>
          </nav>
          <Reveal>
            <p className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-small font-semibold">
              <MapPin className="size-4 text-primary" aria-hidden /> {village ? 'All over India' : `${c.name}, ${c.state}`}
            </p>
            <h1 className="mt-4 font-heading text-[clamp(2rem,5vw,3.4rem)] font-extrabold leading-[1.05] tracking-tight">
              {village ? 'Billing & POS app for small-town and village shops' : <>POS & billing software for shops in {c.name}</>}
              <span className="mt-2 block text-[0.55em] font-bold text-text-muted">{c.hindi} की दुकानों के लिए बिलिंग ऐप</span>
            </h1>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="mt-5 text-lg text-text-secondary">{c.local}</p>
          </Reveal>
          <Reveal delay={0.1} className="mt-7 flex flex-wrap gap-3">
            <Link to={ROUTES.ownerSignup} className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-6 font-semibold text-white shadow-lg shadow-rose-500/25">
              Register free <ArrowRight className="size-4" aria-hidden />
            </Link>
            <PlayBadge href={play.vendor} app="Listee Business" who={`For shops in ${village ? 'your town' : c.name}`} />
          </Reveal>
        </div>
        <Reveal className="mx-auto"><PhoneFrame><MockScreen screen="pos" /></PhoneFrame></Reveal>
      </div></section>

      {!village && (
        <section className="mx-auto max-w-6xl px-4 pb-6 pt-4">
          <CityShops city={c.name} />
        </section>
      )}

      <section className="border-y border-border bg-surface py-16">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHead title={`What ${village ? 'village and small-town' : c.name} shops get with Listee`} />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['GST billing on your phone', 'Bills in seconds, printed on a Bluetooth or Wi-Fi printer.'],
              ['Table QR & online orders', 'Your own order link — no delivery-app commission.'],
              ['Customers come back', 'Spin & win, loyalty coins and offer notifications.'],
              ['AI menu scan', 'Photo of the menu card → products added.'],
              ['Day close & reports', 'Sales, cash and UPI totals every evening.'],
              ['Found nearby', `Your shop on Google and in the Listee app for customers ${village ? 'around you' : `in ${c.name}`}.`],
            ].map(([t, d], i) => (
              <Reveal key={t} delay={(i % 3) * 0.05}>
                <div className="h-full rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                  <span className={`grid size-10 place-items-center rounded-xl text-white ${accent(i).icon}`}><Check className="size-5" aria-hidden /></span>
                  <h3 className="mt-3 font-bold">{t}</h3>
                  <p className="text-small text-text-secondary">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-extrabold">Popular in {place}</h2>
            <div className="mt-5 space-y-3">
              {popular.map((t) => (
                <Link key={t.slug} to={MKT.type(t.slug)} className="flex items-center gap-3 rounded-2xl border border-border p-4 transition hover:border-foreground">
                  <IconByName name={t.icon} className="size-6 text-primary" />
                  <span className="font-semibold">{t.short} billing software</span>
                  <ArrowRight className="ml-auto size-4" aria-hidden />
                </Link>
              ))}
            </div>
            <h2 className="mt-10 text-2xl font-extrabold">{village ? 'Where it works' : `Also serving near ${c.name}`}</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {c.nearby.map((n) => (
                <li key={n} className="rounded-full border border-border px-3 py-1.5 text-small">{n}</li>
              ))}
            </ul>
            {nearbyCities.length > 0 && (
              <p className="mt-5 text-small text-text-secondary">
                Nearby: {nearbyCities.map((x, i) => (
                  <span key={x.slug}>{i > 0 && ' · '}<Link to={MKT.city(x.slug)} className="underline-offset-2 hover:underline">{x.name}</Link></span>
                ))}
              </p>
            )}
          </div>
          <div>
            <h2 className="mb-5 text-2xl font-extrabold">Get a free demo {village ? '' : `in ${c.name}`}</h2>
            <EnquiryForm city={village ? '' : c.name} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20">
        <h2 className="mb-6 text-2xl font-extrabold">Questions from shops in {place}</h2>
        <Faq items={cityFaqs(c)} />
      </section>
    </MarketingShell>
  )
}

/* ============================ Business types ============================ */

export function typeMeta(t: BusinessType): PageMeta {
  return {
    title: `${t.short} billing software & POS app — ${t.headline.split('with')[1]?.trim() ?? 'free to start'}`,
    description: `${t.headline}. ${t.wins.join('. ')}. Free to start, no commission. Listee for ${t.name.toLowerCase()} across India.`.slice(0, 300),
    path: MKT.type(t.slug),
    jsonLd: [
      faqJsonLd([...t.faqs, ...GENERAL_FAQS.slice(1, 3)]),
      breadcrumbJsonLd([['Listee', abs(MKT.join)], ['Billing software', abs(MKT.types)], [t.name, abs(MKT.type(t.slug))]]),
    ],
  }
}

export const typesMeta: PageMeta = {
  title: 'Billing software for every kind of shop — restaurant, bakery, café, kirana & more',
  description: 'Listee POS and billing app for restaurants, bakeries, cafés, sweet shops, kirana stores, cloud kitchens, juice shops, salons, medical stores and clothing stores.',
  path: MKT.types,
  jsonLd: [breadcrumbJsonLd([['Listee', abs(MKT.join)], ['Billing software', abs(MKT.types)]])],
}

export function TypeHubPage() {
  usePageSeo(typesMeta)
  return (
    <MarketingShell>
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHead eyebrow="Software for" title="Billing software for your kind of shop" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BUSINESS_TYPES.map((t, i) => (
            <Reveal key={t.slug} delay={(i % 3) * 0.05}>
              <Link to={MKT.type(t.slug)} className="flex h-full flex-col rounded-3xl border border-border bg-surface p-6 transition hover:-translate-y-1 hover:border-foreground">
                <IconByName name={t.icon} className="size-7 text-primary" />
                <h2 className="mt-4 text-xl font-extrabold">{t.name}</h2>
                <p className="mt-2 text-small text-text-secondary">{t.headline}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </MarketingShell>
  )
}

export function TypePage() {
  const { type } = useParams<{ type: string }>()
  const t = typeBySlug(type)
  if (!t) return <Navigate to={MKT.types} replace />
  return <TypeContent type={t} />
}

export function TypeContent({ type: t }: { type: BusinessType }) {
  usePageSeo(typeMeta(t))
  const play = usePlayLinks()
  const screen = t.slug === 'bakery' ? 'combo' : t.slug === 'restaurant' ? 'orders' : t.slug === 'cafe' ? 'loyalty' : 'notify'

  return (
    <MarketingShell>
      <section className="relative overflow-hidden"><Blobs />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 lg:grid-cols-[1.2fr_auto]">
        <div>
          <nav aria-label="Breadcrumb" className="text-small text-text-muted">
            <Link to={MKT.join} className="hover:text-foreground">Listee</Link> / <Link to={MKT.types} className="hover:text-foreground">Billing software</Link> / <span className="text-foreground">{t.name}</span>
          </nav>
          <Reveal>
            <span className="mt-6 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-400 text-white shadow-lg"><IconByName name={t.icon} className="size-7" /></span>
            <h1 className="mt-4 font-heading text-[clamp(2rem,5vw,3.2rem)] font-extrabold leading-[1.05] tracking-tight">{t.headline}</h1>
          </Reveal>
          <Reveal delay={0.05} className="mt-7 flex flex-wrap gap-3">
            <Link to={ROUTES.ownerSignup} className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-6 font-semibold text-white shadow-lg shadow-rose-500/25">
              Register your {t.short.toLowerCase()} free <ArrowRight className="size-4" aria-hidden />
            </Link>
            <PlayBadge href={play.vendor} app="Listee Business" who="Android app" />
          </Reveal>
        </div>
        <Reveal className="mx-auto"><PhoneFrame><MockScreen screen={screen} /></PhoneFrame></Reveal>
      </div></section>

      <section className="border-y border-border bg-surface py-16">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 md:grid-cols-2">
          <Reveal className="rounded-3xl border border-border bg-background p-7">
            <h2 className="text-xl font-extrabold">The problem</h2>
            <ul className="mt-4 space-y-3">
              {t.pains.map((p) => <li key={p} className="flex gap-2 text-text-secondary"><X className="mt-0.5 size-5 shrink-0 text-text-muted" aria-hidden />{p}</li>)}
            </ul>
          </Reveal>
          <Reveal delay={0.08} className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 p-7 text-white">
            <h2 className="text-xl font-extrabold">With Listee</h2>
            <ul className="mt-4 space-y-3">
              {t.wins.map((p) => <li key={p} className="flex gap-2"><Check className="mt-0.5 size-5 shrink-0" aria-hidden />{p}</li>)}
            </ul>
          </Reveal>
        </div>
        <Reveal className="mx-auto mt-8 max-w-3xl px-4 text-center text-lg">
          <p className="italic text-text-secondary">“{t.example}”</p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-extrabold">Learn how it works</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {GUIDES.slice(1, 5).map((g) => (
            <Link key={g.slug} to={MKT.guide(g.slug)} className="rounded-2xl border border-border p-4 font-semibold transition hover:border-foreground">{g.title} →</Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16">
        <h2 className="mb-6 text-2xl font-extrabold">{t.short} owners ask</h2>
        <Faq items={[...t.faqs, ...GENERAL_FAQS.slice(1, 3)]} />
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20">
        <h2 className="mb-5 text-center text-2xl font-extrabold">Get a free demo for your {t.short.toLowerCase()}</h2>
        <EnquiryForm />
      </section>
    </MarketingShell>
  )
}

/* ============================ Contact ============================ */

export const contactMeta: PageMeta = {
  title: 'Contact Listee — free demo, sales and support for shops',
  description: `Talk to the Listee team: free demo for your shop, partner and referral programme, or support. Call back within one working day. Email ${SUPPORT_EMAIL}.`,
  path: MKT.contact,
  jsonLd: [{ '@type': 'ContactPage', name: 'Contact Listee', url: abs(MKT.contact) }],
}

export function ContactPage() {
  usePageSeo(contactMeta)
  return (
    <MarketingShell>
      <section className="relative overflow-hidden"><Blobs /><div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-2">
        <div>
          <SectionHead center={false} eyebrow="Contact" title="Talk to the Listee team" sub="Free demo, help with setup, partner programme or any question — leave your number and we call you back within one working day." />
          <ul className="mt-8 space-y-4">
            {[
              ['Shop owners', 'Free demo and setup over a call — in Hindi or English.'],
              ['Partners', 'Bring shops to Listee in your area and earn on every shop that subscribes.'],
              ['Existing users', 'Help with billing, printer, orders or your plan.'],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <Check className="mt-1 size-5 shrink-0 text-primary" aria-hidden />
                <span><strong>{t}</strong><br /><span className="text-text-secondary">{d}</span></span>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-text-secondary">Email: <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-foreground underline">{SUPPORT_EMAIL}</a></p>
        </div>
        <EnquiryForm />
      </div></section>
    </MarketingShell>
  )
}

/** The city's real Listee shops, when there are any. */
function CityShops({ city }: { city: string }) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-6 ring-1 ring-black/5 md:p-8 [&:not(:has(a))]:hidden">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold">Listee shops in {city}</h2>
        <LivePill>Live now</LivePill>
      </div>
      <LiveShops city={city} />
    </div>
  )
}

