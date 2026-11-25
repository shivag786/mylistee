import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Clock, Lightbulb } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { MarketingShell } from '@/features/marketing/MarketingShell'
import { MockScreen, PhoneFrame } from '@/features/marketing/mocks'
import { GUIDES, guideBySlug, type Guide } from '@/features/marketing/guides'
import { abs, MKT } from '@/features/marketing/site'
import { usePageSeo, type PageMeta } from '@/features/marketing/seo'
import { breadcrumbJsonLd, Faq, faqJsonLd, IconByName, PlayBadge, Reveal, SectionHead, usePlayLinks } from '@/features/marketing/ui'

export const guidesMeta: PageMeta = {
  title: 'Listee guides — how to use Listee Business for billing, orders and offers',
  description: 'Step-by-step guides with screens: register your shop, add products with AI menu scan, create combos, manage orders, POS billing with GST and printer, notify customers, QR poster and day close.',
  path: MKT.guides,
  jsonLd: [breadcrumbJsonLd([['Listee', abs(MKT.join)], ['Guides', abs(MKT.guides)]])],
}

export function guideMeta(g: Guide): PageMeta {
  return {
    title: `${g.title} — Listee guide`,
    description: g.summary.slice(0, 300),
    path: MKT.guide(g.slug),
    jsonLd: [
      {
        '@type': 'HowTo',
        name: g.title,
        description: g.summary,
        totalTime: `PT${g.minutes}M`,
        tool: [{ '@type': 'HowToTool', name: 'Listee Business app' }],
        step: g.steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.title, text: s.text, url: `${abs(MKT.guide(g.slug))}#step-${i + 1}` })),
      },
      faqJsonLd(g.faqs),
      breadcrumbJsonLd([['Listee', abs(MKT.join)], ['Guides', abs(MKT.guides)], [g.title, abs(MKT.guide(g.slug))]]),
    ],
  }
}

export function GuideHubPage() {
  usePageSeo(guidesMeta)
  const play = usePlayLinks()
  return (
    <MarketingShell>
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHead
          eyebrow="Listee guides"
          title="Learn Listee in minutes"
          sub="Every important step in the Listee Business app, shown on an example shop — Perfect Bakery. Follow along on your phone."
        />
        <div className="mt-6 flex justify-center"><PlayBadge href={play.vendor} app="Listee Business" who="Install to follow along" /></div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((g, i) => (
            <Reveal key={g.slug} delay={(i % 3) * 0.06}>
              <Link to={MKT.guide(g.slug)} className="group flex h-full flex-col rounded-3xl border border-border bg-surface p-6 transition hover:-translate-y-1 hover:border-foreground">
                <div className="flex items-center justify-between">
                  <IconByName name={g.icon} className="size-7 text-primary" />
                  <span className="text-small text-text-muted">Guide {i + 1}</span>
                </div>
                <h2 className="mt-5 text-xl font-extrabold">{g.title}</h2>
                <p className="mt-2 line-clamp-3 text-small text-text-secondary">{g.summary}</p>
                <p className="mt-auto flex items-center gap-1.5 pt-5 text-small font-semibold">
                  <Clock className="size-4" aria-hidden /> {g.minutes} min <ArrowRight className="ml-auto size-4 transition group-hover:translate-x-1" aria-hidden />
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </MarketingShell>
  )
}

export function GuidePage() {
  const { slug } = useParams<{ slug: string }>()
  const guide = guideBySlug(slug)
  if (!guide) return <Navigate to={MKT.guides} replace />
  return <GuideContent guide={guide} />
}

/** Split out so the pre-renderer can render a guide without route params. */
export function GuideContent({ guide }: { guide: Guide }) {
  usePageSeo(guideMeta(guide))
  const play = usePlayLinks()
  const idx = GUIDES.findIndex((g) => g.slug === guide.slug)
  const next = GUIDES[idx + 1]
  const prev = GUIDES[idx - 1]

  return (
    <MarketingShell>
      <article className="mx-auto max-w-5xl px-4 py-12">
        <nav aria-label="Breadcrumb" className="text-small text-text-muted">
          <Link to={MKT.join} className="hover:text-foreground">Listee</Link> / <Link to={MKT.guides} className="hover:text-foreground">Guides</Link> / <span className="text-foreground">{guide.title}</span>
        </nav>
        <Reveal>
          <h1 className="mt-4 font-heading text-[clamp(2rem,5vw,3.2rem)] font-extrabold leading-[1.05] tracking-tight">{guide.title}</h1>
        </Reveal>
        <Reveal delay={0.05}>
          {/* The short answer first — what search and AI assistants quote. */}
          <p className="mt-5 rounded-2xl border-l-4 border-primary bg-surface p-5 text-lg text-foreground">
            <strong>Quick answer: </strong>{guide.summary}
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-small text-text-muted"><Clock className="size-4" aria-hidden /> {guide.minutes} minutes · Example shop: Perfect Bakery</p>
        </Reveal>

        <ol className="mt-14 space-y-20">
          {guide.steps.map((s, i) => (
            <li key={s.title} id={`step-${i + 1}`} className="scroll-mt-24">
              <div className={`grid items-center gap-10 md:grid-cols-2 ${i % 2 ? 'md:[&>*:first-child]:order-2' : ''}`}>
                <Reveal>
                  <span className="grid size-12 place-items-center rounded-2xl bg-foreground text-lg font-extrabold text-background">{i + 1}</span>
                  <h2 className="mt-4 text-2xl font-extrabold md:text-3xl">{s.title}</h2>
                  <p className="mt-3 text-lg text-text-secondary">{s.text}</p>
                  {s.tip && (
                    <p className="mt-4 flex gap-2 rounded-2xl border border-border bg-surface p-4 text-small">
                      <Lightbulb className="size-5 shrink-0 text-primary" aria-hidden /> <span><strong>Tip:</strong> {s.tip}</span>
                    </p>
                  )}
                </Reveal>
                <Reveal delay={0.1} className="mx-auto">
                  <PhoneFrame><MockScreen screen={s.screen} /></PhoneFrame>
                </Reveal>
              </div>
            </li>
          ))}
        </ol>

        <section className="mt-20">
          <h2 className="mb-6 text-2xl font-extrabold">Common questions</h2>
          <Faq items={guide.faqs} />
        </section>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8">
          {prev ? (
            <Link to={MKT.guide(prev.slug)} className="flex items-center gap-2 font-semibold hover:text-primary"><ArrowLeft className="size-4" aria-hidden />{prev.title}</Link>
          ) : <span />}
          {next ? (
            <Link to={MKT.guide(next.slug)} className="flex items-center gap-2 font-semibold hover:text-primary">{next.title}<ArrowRight className="size-4" aria-hidden /></Link>
          ) : (
            <Link to={ROUTES.ownerSignup} className="flex items-center gap-2 font-semibold text-primary">Register your shop free <ArrowRight className="size-4" aria-hidden /></Link>
          )}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 rounded-3xl bg-foreground p-8 text-center text-background">
          <h2 className="text-2xl font-extrabold">Try it on your own shop</h2>
          <p className="text-background/70">Free to start. Need help? The Listee team sets it up with you.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <PlayBadge href={play.vendor} app="Listee Business" who="For shop owners" dark={false} />
            <Link to={MKT.contact} className="inline-flex h-[58px] items-center rounded-2xl border border-white/30 px-6 font-semibold">Book a free demo</Link>
          </div>
        </div>
      </article>
    </MarketingShell>
  )
}
