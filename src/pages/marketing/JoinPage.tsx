import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeIndianRupee,
  BarChart3,
  BellRing,
  Bot,
  Cake,
  Check,
  ClipboardList,
  Coins,
  Gift,
  Globe2,
  HeartHandshake,
  Languages,
  Layers,
  Link2,
  MessageCircle,
  Package,
  Printer,
  QrCode,
  Receipt,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Store,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { usePlans } from '@/features/owner/hooks/useOwner'
import { useLandingStats } from '@/features/landing/useLandingStats'
import { MarketingShell } from '@/features/marketing/MarketingShell'
import { EnquiryForm } from '@/features/marketing/EnquiryForm'
import { MockScreen, PhoneFrame } from '@/features/marketing/mocks'
import { accent, Blobs, LiveCombos, LivePill, LiveShops, LiveSpecials, NotifyStory, RealPhone, SHOTS } from '@/features/marketing/showcase'
import { BUSINESS_TYPES } from '@/features/marketing/businessTypes'
import { CITIES } from '@/features/marketing/cities'
import { GENERAL_FAQS, GUIDES } from '@/features/marketing/guides'
import { MKT } from '@/features/marketing/site'
import { usePageSeo, type PageMeta } from '@/features/marketing/seo'
import {
  CountUp,
  Eyebrow,
  Faq,
  faqJsonLd,
  IconByName,
  PlayBadge,
  Reveal,
  SectionHead,
  usePlayLinks,
  usePrerender,
} from '@/features/marketing/ui'

export const joinMeta: PageMeta = {
  title: 'Listee — POS billing, QR ordering & customer rewards app for shops in India',
  description:
    'Run your shop on your phone: POS billing with GST, table QR ordering, online orders without commission, spin & win, loyalty coins, offer notifications and an AI assistant. Free to start. For restaurants, bakeries, cafés, kirana and more.',
  path: MKT.join,
  jsonLd: [faqJsonLd(GENERAL_FAQS)],
}

const FEATURES = [
  { icon: Receipt, title: 'POS billing & GST', text: 'Bill in seconds on any phone. GST invoices with CGST/SGST, discounts, cash/UPI/card.' },
  { icon: QrCode, title: 'Table QR ordering', text: 'Customers scan the table QR, see your menu with photos and order — no waiting.' },
  { icon: ClipboardList, title: 'Online orders, no commission', text: 'Your own shop link and order page. Orders ring on your phone. You keep your margin.' },
  { icon: Package, title: 'AI menu scan', text: 'Photo of your menu card → every item and price added in a minute.' },
  { icon: Layers, title: 'Combos', text: 'Bundle best-sellers at one price and raise the average bill.' },
  { icon: Gift, title: 'Spin & win', text: 'Every QR scan is a free spin. Customers stop, scan and come back to redeem.' },
  { icon: Coins, title: 'Loyalty coins', text: 'Coins on every bill, spent on the next visit. Regulars stay regular.' },
  { icon: BellRing, title: 'Offer notifications', text: 'Send an offer to followers, past buyers or birthdays this week — straight to their phones.' },
  { icon: MessageCircle, title: 'WhatsApp offers', text: 'Approved WhatsApp templates to your customers, plan-wise.' },
  { icon: Bot, title: 'AI growth advisor', text: 'Daily ideas: what to discount, which combo to make, who to bring back.' },
  { icon: Printer, title: 'Printer & KOT', text: 'Bluetooth or Wi-Fi thermal printers, 58/80 mm. Bills and kitchen tickets.' },
  { icon: Users, title: 'Staff & attendance', text: 'Staff logins with permissions, attendance and who-billed-what.' },
  { icon: BarChart3, title: 'Day close & reports', text: 'Sales, payments, cash drawer, top items and staff — every evening.' },
  { icon: Link2, title: 'Personal shop link', text: 'One link for WhatsApp, Instagram and Google — shows only your shop.' },
  { icon: Star, title: 'Reviews & ratings', text: 'Collect reviews after every order and reply — more stars, more customers.' },
  { icon: Cake, title: 'Customers & birthdays', text: 'Your customer list with visits and spend, plus birthday and anniversary offers.' },
]

const FLOW = [
  { icon: Store, title: 'Register free', text: 'Mobile number, shop name, location. 5 minutes.' },
  { icon: Sparkles, title: 'Add your menu', text: 'Scan your menu card with AI or add items one by one.' },
  { icon: QrCode, title: 'Put up your QR', text: 'Print the poster. Share your shop link on WhatsApp.' },
  { icon: Zap, title: 'Bill, sell, repeat', text: 'Orders ring, bills print, customers win rewards and come back.' },
]

const DAY = [
  { time: '8:00 am', title: 'Opens the day', text: 'Perfect Bakery adds today’s fresh pastries in 30 seconds and the morning offer goes live.' },
  { time: '1:30 pm', title: 'Lunch rush', text: 'Table 4 orders by QR, two online cake orders ring in, the counter bills 30 customers without a queue.' },
  { time: '6:00 pm', title: 'Clears the shelf', text: 'One tap: “Fresh pastries 20% off till 9 pm” reaches 1,240 followers. The shelf is empty by 8.' },
  { time: '10:00 pm', title: 'Closes the day', text: 'Sales ₹18,420 · UPI ₹9,870 · cash counted. Report printed, owner goes home.' },
]

const COMPARE: { row: string; listee: boolean | string; machine: boolean | string; apps: boolean | string }[] = [
  { row: 'Bill on any phone', listee: true, machine: 'Extra device', apps: false },
  { row: 'GST invoices', listee: true, machine: true, apps: false },
  { row: 'Table QR & online orders', listee: true, machine: false, apps: true },
  { row: 'Commission on your orders', listee: 'None', machine: 'None', apps: '20–30%' },
  { row: 'Your customers’ data stays yours', listee: true, machine: false, apps: false },
  { row: 'Bring customers back (rewards, offers)', listee: true, machine: false, apps: 'Paid ads' },
  { row: 'AI ideas & menu scan', listee: true, machine: false, apps: false },
  { row: 'Cost to start', listee: 'Free', machine: '₹8–20k', apps: 'Fees + commission' },
]

export function JoinPage() {
  usePageSeo(joinMeta)
  const play = usePlayLinks()
  const { data: stats } = useLandingStats()

  return (
    <MarketingShell>
      {/* ---------------- Announcement ---------------- */}
      <div className="bg-gradient-to-r from-rose-500 via-orange-500 to-amber-400 text-white">
        <p className="mx-auto max-w-6xl px-4 py-2 text-center text-small font-semibold">
          🎉 Free to start — no card needed · Live in Jhansi, Indore & growing ·{' '}
          <Link to={MKT.contact} className="underline underline-offset-2">Book a free demo</Link>
        </p>
      </div>

      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/70 via-white to-white">
        <Blobs />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 md:pt-16 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <Reveal>
              <LivePill>For restaurants, bakeries, cafés, kirana & every local shop</LivePill>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-5 font-heading text-[clamp(2.4rem,6vw,4.4rem)] font-extrabold leading-[1.02] tracking-tight">
                Your whole shop.
                <br />
                <span className="bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 bg-clip-text text-transparent">One app.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-5 max-w-xl text-lg text-text-secondary">
                Listee is the <strong className="text-foreground">billing, ordering and customer-rewards app</strong> for local shops in India.
                Bill with GST, take table and online orders without commission, send offers straight to your customers’ phones — and
                bring them back with spin & win and coins.
              </p>
            </Reveal>
            <Reveal delay={0.15} className="mt-7 flex flex-wrap gap-3">
              <Link to={ROUTES.ownerSignup} className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-6 font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:gap-3 hover:shadow-xl">
                Register your shop free <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link to={MKT.contact} className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 font-semibold ring-1 ring-black/10 transition hover:ring-black/30">
                Book a free demo
              </Link>
            </Reveal>
            <Reveal delay={0.2} className="mt-7 flex flex-wrap gap-3">
              <PlayBadge href={play.vendor} app="Listee Business" who="App for shop owners" />
              <PlayBadge href={play.customer} app="Listee" who="App for customers" />
            </Reveal>
            <Reveal delay={0.25}>
              <ul className="mt-6 flex flex-wrap gap-2 text-small font-semibold">
                {[
                  ['Free to start', 'bg-emerald-50 text-emerald-700'],
                  ['0% commission', 'bg-rose-50 text-rose-700'],
                  ['Hindi & English', 'bg-amber-50 text-amber-700'],
                  ['Any Android phone', 'bg-sky-50 text-sky-700'],
                ].map(([t, c]) => (
                  <li key={t} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 ${c}`}><Check className="size-4" aria-hidden />{t}</li>
                ))}
              </ul>
            </Reveal>
          </div>
          <HeroPhones />
        </div>
      </section>

      {/* ---------------- Trust strip ---------------- */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4">
          <Fact big="₹0" label="To start — free plan" />
          <Fact big="0%" label="Commission on your orders" />
          <Fact big="5 min" label="To set up your shop" />
          {stats && stats.shops >= 50 ? <Stat value={stats.shops} suffix="+" label="Shops already on Listee" /> : <Fact big={`${CITIES.length - 1}+`} label="Cities, towns & villages" />}
        </div>
        <Marquee />
      </section>

      {/* ---------------- What is Listee ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <SectionHead eyebrow="What is Listee" title="Sell more. Bring them back. Grow." sub="Three jobs every shop has to do every day. Listee does all three in one app — so you stop juggling a billing machine, a delivery app, a diary and WhatsApp groups." />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            { icon: Receipt, n: '01', t: 'Sell', d: 'POS billing, GST invoices, table QR and online orders, printer and KOT, staff logins.', c: 'from-rose-500 to-orange-400' },
            { icon: HeartHandshake, n: '02', t: 'Bring them back', d: 'Offer notifications, spin & win on every scan, loyalty coins, birthday offers.', c: 'from-amber-400 to-yellow-300' },
            { icon: Sparkles, n: '03', t: 'Grow', d: 'AI growth advisor, menu scan, daily reports, reviews and your shop on Google and the Listee app.', c: 'from-emerald-500 to-lime-400' },
          ].map((p, i) => (
            <Reveal key={p.t} delay={i * 0.08}>
              <div className="group relative h-full overflow-hidden rounded-3xl bg-white p-7 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl">
                <div className={`absolute -right-10 -top-10 size-32 rounded-full bg-gradient-to-br ${p.c} opacity-15 transition group-hover:opacity-30`} />
                <div className="flex items-center justify-between">
                  <span className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br ${p.c} text-white shadow-lg`}><p.icon className="size-6" aria-hidden /></span>
                  <span className="font-heading text-4xl font-extrabold text-foreground/10">{p.n}</span>
                </div>
                <h3 className="mt-6 text-2xl font-extrabold">{p.t}</h3>
                <p className="mt-2 text-text-secondary">{p.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- Notification story ---------------- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHead
            eyebrow="The Listee magic"
            title={<>Send an offer. Their phone buzzes. <span className="text-rose-500">One tap — they’re in your shop.</span></>}
            sub="This is the feature shop owners love most: your offer lands on your customers’ phones, and the tap opens only YOUR shop page — not a marketplace full of competitors."
          />
          <div className="mt-12"><NotifyStory /></div>
        </div>
      </section>

      {/* ---------------- Live on Listee ---------------- */}
      <section id="live" className="scroll-mt-20 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center"><LivePill>Live on Listee right now</LivePill></div>
          <SectionHead title="Real shops. Real menus. Real offers." sub="These are actual Listee shops and what they are selling today — tap any to see their page." />
          <div className="mt-10"><LiveShops /></div>

          <h3 className="mt-16 flex items-center justify-center gap-2 text-center text-2xl font-extrabold"><Layers className="size-6 text-violet-500" aria-hidden /> Combos running now</h3>
          <div className="mt-6"><LiveCombos /></div>

          <h3 className="mt-16 flex items-center justify-center gap-2 text-center text-2xl font-extrabold"><Gift className="size-6 text-rose-500" aria-hidden /> Today’s specials & best-sellers</h3>
          <div className="mt-6"><LiveSpecials /></div>
        </div>
      </section>

      {/* ---------------- Features ---------------- */}
      <section id="features" className="scroll-mt-20 bg-neutral-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHead eyebrow="Features" title="Everything a local shop needs" sub="No extra machines. No commission. Works on the phone you already have." />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 4) * 0.05}>
                <div className={`group h-full rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl hover:ring-2 ${accent(i).ring}`}>
                  <span className={`grid size-11 place-items-center rounded-2xl text-white shadow-md transition group-hover:scale-110 ${accent(i).icon}`}>
                    <f.icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-bold">{f.title}</h3>
                  <p className="mt-1.5 text-small text-text-secondary">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
        <SectionHead eyebrow="How it works" title="Live in 4 simple steps" sub="Most shops are billing on Listee the same day they sign up." />
        <div className="relative mt-14 grid gap-8 md:grid-cols-4">
          <FlowLine />
          {FLOW.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.12} className="relative text-center">
              <div className={`mx-auto grid size-16 place-items-center rounded-2xl text-white shadow-lg ${accent(i).icon}`}>
                <s.icon className="size-7" aria-hidden />
              </div>
              <p className="mt-4 text-small font-semibold text-text-muted">Step {i + 1}</p>
              <h3 className="mt-1 text-lg font-extrabold">{s.title}</h3>
              <p className="mt-1 text-text-secondary">{s.text}</p>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-12 text-center">
          <Link to={MKT.guides} className="inline-flex items-center gap-2 font-semibold text-primary hover:gap-3">
            See step-by-step guides with screenshots <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Reveal>
      </section>

      {/* ---------------- A day at Perfect Bakery ---------------- */}
      <section className="border-y border-border bg-surface py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-[1fr_auto]">
          <div>
            <SectionHead center={false} eyebrow="A day with Listee" title="How Perfect Bakery runs on one phone" />
            <ol className="relative mt-10 space-y-8 border-l border-border pl-8">
              {DAY.map((d, i) => (
                <Reveal key={d.time} delay={i * 0.08}>
                  <li className="relative">
                    <span className="absolute -left-[41px] top-1 grid size-5 place-items-center rounded-full border-4 border-surface bg-primary" />
                    <p className="text-small font-semibold text-primary">{d.time}</p>
                    <h3 className="text-lg font-extrabold">{d.title}</h3>
                    <p className="text-text-secondary">{d.text}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
          <Reveal className="mx-auto">
            <PhoneFrame><MockScreen screen="dayClose" /></PhoneFrame>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Two apps ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <SectionHead eyebrow="Two apps, one network" title="One for your shop. One for your customers." />
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {[
            { app: 'Listee Business', who: 'For shop owners & staff', href: play.vendor, icon: Store, dark: true, points: ['Billing, orders, printer, KOT', 'Products, combos, offers, coins', 'Notify customers, AI advisor', 'Day close, staff, reports'] },
            { app: 'Listee', who: 'For customers — free', href: play.customer, icon: Smartphone, dark: false, points: ['Find shops & offers nearby', 'Order from table or home', 'Scan, spin & win rewards', 'Coins at every Listee shop'] },
          ].map((a, i) => (
            <Reveal key={a.app} delay={i * 0.08}>
              <div className={`flex h-full flex-col rounded-3xl p-8 ${a.dark ? 'bg-foreground text-background' : 'border border-border bg-surface'}`}>
                <a.icon className="size-9" aria-hidden />
                <h3 className="mt-5 text-2xl font-extrabold">{a.app}</h3>
                <p className={a.dark ? 'text-background/65' : 'text-text-secondary'}>{a.who}</p>
                <ul className="my-6 space-y-2.5">
                  {a.points.map((p) => (
                    <li key={p} className="flex items-center gap-2"><Check className="size-4 shrink-0" aria-hidden />{p}</li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <PlayBadge href={a.href} app={a.app} who={a.who} dark={!a.dark} />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- Benefits ---------------- */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BadgeIndianRupee, t: 'No commission', d: 'Keep every rupee of your order value.' },
            { icon: ShieldCheck, t: 'Your customers, your data', d: 'Never shared with other shops or sold.' },
            { icon: Languages, t: 'Hindi & English', d: 'Easy for you and your staff.' },
            { icon: Globe2, t: 'Found on Google', d: 'Your shop page shows up in local search.' },
          ].map((b, i) => (
            <Reveal key={b.t} delay={i * 0.06}>
              <div className="h-full rounded-2xl border border-border p-5">
                <b.icon className="size-6 text-primary" aria-hidden />
                <h3 className="mt-3 font-bold">{b.t}</h3>
                <p className="text-small text-text-secondary">{b.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- Comparison ---------------- */}
      <section className="mx-auto max-w-4xl px-4 pb-20">
        <SectionHead eyebrow="Compare" title="Why shops switch to Listee" />
        <Reveal className="mt-10 overflow-x-auto rounded-3xl border border-border bg-surface">
          <table className="w-full min-w-[560px] text-left text-small">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 font-semibold text-text-muted" scope="col"> </th>
                <th className="bg-foreground p-4 font-bold text-background" scope="col">Listee</th>
                <th className="p-4 font-semibold" scope="col">Billing machine</th>
                <th className="p-4 font-semibold" scope="col">Delivery apps</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((r) => (
                <tr key={r.row} className="border-b border-border last:border-0">
                  <th scope="row" className="p-4 font-medium">{r.row}</th>
                  <td className="bg-foreground/[0.03] p-4 font-semibold"><Cell v={r.listee} /></td>
                  <td className="p-4"><Cell v={r.machine} /></td>
                  <td className="p-4"><Cell v={r.apps} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </section>

      {/* ---------------- Pricing ---------------- */}
      <Pricing />

      {/* ---------------- Built for your shop ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <SectionHead eyebrow="Built for your kind of shop" title="Pick your business" />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {BUSINESS_TYPES.map((t, i) => (
            <Reveal key={t.slug} delay={(i % 5) * 0.04}>
              <Link to={MKT.type(t.slug)} className="group flex h-full items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:border-foreground">
                <IconByName name={t.icon} className="size-6 shrink-0 text-primary" />
                <span className="font-semibold">{t.name}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- Guides ---------------- */}
      <section className="border-y border-border bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHead eyebrow="Learn in minutes" title="Step-by-step guides" sub="Real screens from the Listee Business app, shown on Perfect Bakery." />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GUIDES.map((g, i) => (
              <Reveal key={g.slug} delay={(i % 4) * 0.05}>
                <Link to={MKT.guide(g.slug)} className="group flex h-full flex-col rounded-2xl border border-border bg-background p-5 transition hover:-translate-y-1 hover:border-foreground">
                  <IconByName name={g.icon} className="size-6 text-primary" />
                  <h3 className="mt-3 font-bold">{g.title}</h3>
                  <p className="mt-auto pt-3 text-small text-text-muted">{g.minutes} min read →</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="mx-auto max-w-3xl px-4 py-20">
        <SectionHead eyebrow="FAQ" title="Questions shop owners ask" />
        <Reveal className="mt-10"><Faq items={GENERAL_FAQS} /></Reveal>
      </section>

      {/* ---------------- Contact ---------------- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-500 via-orange-500 to-amber-400 py-20 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
          <Reveal>
            <p className="text-small font-semibold uppercase tracking-[0.18em] text-white/80">Talk to us</p>
            <h2 className="mt-2 font-heading text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-tight">Get a free demo for your shop</h2>
            <p className="mt-3 text-white/90 md:text-lg">
              Leave your number. Someone from the Listee team calls you, sets up your menu with you and shows you everything — in Hindi or English.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <PlayBadge href={play.vendor} app="Listee Business" who="Download now" dark={false} />
            </div>
          </Reveal>
          <Reveal delay={0.1} className="text-foreground"><EnquiryForm /></Reveal>
        </div>
      </section>
    </MarketingShell>
  )
}

function Cell({ v }: { v: boolean | string }) {
  if (v === true) return <Check className="size-5 text-primary" aria-label="Yes" />
  if (v === false) return <X className="size-5 text-text-muted" aria-label="No" />
  return <span>{v}</span>
}

function Stat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  return (
    <div className="text-center">
      <p className="font-heading text-3xl font-extrabold md:text-4xl"><CountUp value={value} suffix={suffix} /></p>
      <p className="text-small text-text-secondary">{label}</p>
    </div>
  )
}

function Fact({ big, label }: { big: string; label: string }) {
  return (
    <Reveal className="text-center">
      <p className="font-heading text-3xl font-extrabold md:text-4xl">{big}</p>
      <p className="text-small text-text-secondary">{label}</p>
    </Reveal>
  )
}

function Marquee() {
  const pre = usePrerender()
  const items = [...BUSINESS_TYPES, ...BUSINESS_TYPES]
  return (
    <div className="relative overflow-hidden border-t border-border py-4 [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
      <div className={`flex w-max gap-8 ${pre ? '' : 'animate-[marquee_40s_linear_infinite]'}`}>
        {items.map((t, i) => (
          <span key={`${t.slug}-${i}`} className="flex items-center gap-2 whitespace-nowrap text-small font-semibold text-text-secondary">
            <IconByName name={t.icon} className="size-4" />{t.name}
          </span>
        ))}
      </div>
      <style>{'@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}'}</style>
    </div>
  )
}

/** Real app screens: the shop page in front, its menu behind, with live-looking cards around. */
function HeroPhones() {
  const pre = usePrerender()
  const float = (d: number, y = 8) => (pre ? {} : { animate: { y: [0, -y, 0] }, transition: { duration: d, repeat: Infinity, ease: 'easeInOut' as const } })
  return (
    <div className="relative mx-auto h-[600px] w-full max-w-[480px]">
      <motion.div className="absolute right-0 top-10 hidden rotate-6 sm:block" {...float(7)}>
        <RealPhone src={SHOTS.menu} alt="Menu with real cake photos on a Listee shop page" className="scale-90 opacity-95" />
      </motion.div>
      <motion.div className="absolute left-0 top-0 z-10 -rotate-3 sm:left-4" {...float(6, 10)}>
        <RealPhone src={SHOTS.shop} alt="The Perfect Cafe & bakery shop page on Listee" />
      </motion.div>
      <motion.div className="absolute -left-2 top-28 z-20 w-64 rounded-2xl bg-white/95 p-3 shadow-2xl ring-1 ring-black/5 backdrop-blur sm:-left-10" {...float(4.5, 6)}>
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
          <span className="grid size-4 place-items-center rounded bg-amber-400 text-[9px] font-bold text-white">L</span> Listee · now
        </div>
        <p className="mt-1 text-[13px] font-bold">The Perfect Cafe & bakery</p>
        <p className="text-[13px] text-neutral-600">Fresh pastries 22% off till 9 pm 🍰</p>
      </motion.div>
      <motion.div className="absolute bottom-20 right-2 z-20 flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-white shadow-xl" {...float(5)}>
        <BellRing className="size-5" aria-hidden />
        <span className="text-small font-bold">New order · ₹350</span>
      </motion.div>
      <motion.div className="absolute bottom-6 left-10 z-20 rounded-2xl bg-amber-400 px-4 py-2.5 text-small font-extrabold text-neutral-900 shadow-xl" {...float(5.5, 6)}>
        🎡 You won ₹50 off!
      </motion.div>
    </div>
  )
}

/** The line joining the 4 steps, drawn as you scroll. */
function FlowLine() {
  const pre = usePrerender()
  return (
    <div aria-hidden className="absolute left-[12.5%] right-[12.5%] top-8 hidden h-px bg-border md:block">
      {!pre && (
        <motion.div className="h-px origin-left bg-primary" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.6, ease: 'easeInOut' }} />
      )}
    </div>
  )
}

function Pricing() {
  const { data: plans } = usePlans()
  const list = (plans ?? []).filter((p) => (p as { isActive?: boolean }).isActive !== false).slice(0, 4)
  const per = (i: string) => (i === 'year' ? '/year' : i === 'quarter' ? '/quarter' : i === 'lifetime' ? ' once' : '/month')

  return (
    <section id="pricing" className="scroll-mt-20 border-y border-border bg-surface py-20">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHead eyebrow="Pricing" title="Start free. Upgrade when you grow." sub="Simple monthly, quarterly or yearly plans. No commission on your orders — online payments carry only the gateway fee." />
        <div className={`mt-12 grid gap-4 ${list.length >= 3 ? 'md:grid-cols-3 lg:grid-cols-4' : 'md:grid-cols-2'}`}>
          {list.length === 0 && (
            <Reveal className="rounded-3xl border border-foreground bg-background p-7 md:col-span-2">
              <Eyebrow>Free</Eyebrow>
              <p className="mt-2 text-4xl font-extrabold">₹0</p>
              <p className="mt-2 text-text-secondary">Billing, products, QR code and your shop page — free to start. Paid plans add offers, notifications and AI.</p>
            </Reveal>
          )}
          {list.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.06}>
              <div className={`flex h-full flex-col rounded-3xl border p-6 ${i === 1 ? 'border-foreground bg-foreground text-background' : 'border-border bg-background'}`}>
                <p className="font-bold">{p.name}</p>
                <p className="mt-3 text-3xl font-extrabold">
                  {p.price > 0 ? `₹${p.price.toLocaleString('en-IN')}` : 'Free'}
                  {p.price > 0 && <span className="text-small font-medium opacity-60">{per(p.interval)}</span>}
                </p>
                {p.description && <p className={`mt-2 text-small ${i === 1 ? 'text-background/70' : 'text-text-secondary'}`}>{p.description}</p>}
                <Link to={ROUTES.ownerSignup} className={`mt-auto inline-flex h-11 items-center justify-center rounded-full pt-0 font-semibold ${i === 1 ? 'mt-6 bg-background text-foreground' : 'mt-6 border border-border'}`}>
                  Start now
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
