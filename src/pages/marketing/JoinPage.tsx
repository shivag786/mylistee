import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
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
import { HERO_ORDERS, MockScreen, PhoneFrame } from '@/features/marketing/mocks'
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
      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden">
        <GridBackdrop />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 md:pt-20 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-small font-semibold text-text-secondary">
                <span className="size-2 animate-pulse rounded-full bg-primary" /> For restaurants, bakeries, cafés, kirana & every local shop
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-5 font-heading text-[clamp(2.4rem,6vw,4.2rem)] font-extrabold leading-[1.02] tracking-tight">
                Your whole shop.
                <br />
                <span className="text-primary">One app.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-5 max-w-xl text-lg text-text-secondary">
                Listee is the <strong className="text-foreground">billing, ordering and customer-rewards app</strong> for local shops in India.
                Bill with GST, take table and online orders without commission, and bring customers back with spin & win, coins and offers —
                all from your phone.
              </p>
            </Reveal>
            <Reveal delay={0.15} className="mt-7 flex flex-wrap gap-3">
              <Link to={ROUTES.ownerSignup} className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 font-semibold text-background transition hover:gap-3">
                Register your shop free <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link to={MKT.contact} className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-surface px-6 font-semibold transition hover:border-foreground">
                Book a free demo
              </Link>
            </Reveal>
            <Reveal delay={0.2} className="mt-7 flex flex-wrap gap-3">
              <PlayBadge href={play.vendor} app="Listee Business" who="App for shop owners" />
              <PlayBadge href={play.customer} app="Listee" who="App for customers" />
            </Reveal>
            <Reveal delay={0.25}>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-small text-text-secondary">
                {['Free to start', 'No commission', 'Hindi & English', 'Any Android phone'].map((t) => (
                  <li key={t} className="flex items-center gap-1.5"><Check className="size-4 text-primary" aria-hidden />{t}</li>
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
            { icon: Receipt, n: '01', t: 'Sell', d: 'POS billing, GST invoices, table QR and online orders, printer and KOT, staff logins.' },
            { icon: HeartHandshake, n: '02', t: 'Bring them back', d: 'Spin & win on every scan, loyalty coins, birthday offers, notifications and WhatsApp offers.' },
            { icon: Sparkles, n: '03', t: 'Grow', d: 'AI growth advisor, menu scan, daily reports, reviews and your shop on Google and the Listee app.' },
          ].map((p, i) => (
            <Reveal key={p.t} delay={i * 0.08}>
              <div className="group h-full rounded-3xl border border-border bg-surface p-7 transition hover:-translate-y-1 hover:border-foreground">
                <div className="flex items-center justify-between">
                  <p.icon className="size-8 text-primary" aria-hidden />
                  <span className="font-heading text-4xl font-extrabold text-foreground/10">{p.n}</span>
                </div>
                <h3 className="mt-6 text-2xl font-extrabold">{p.t}</h3>
                <p className="mt-2 text-text-secondary">{p.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- Features ---------------- */}
      <section id="features" className="scroll-mt-20 bg-foreground py-20 text-background">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-small font-semibold uppercase tracking-[0.18em] text-background/60">Features</p>
            <h2 className="mt-2 font-heading text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-tight">Everything a local shop needs</h2>
            <p className="mt-3 text-background/70 md:text-lg">No extra machines. No commission. Works on the phone you already have.</p>
          </Reveal>
          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl bg-background/10 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 4) * 0.05} className="bg-foreground">
                <div className="group h-full p-6 transition hover:bg-background/5">
                  <f.icon className="size-6 text-background transition group-hover:scale-110" aria-hidden />
                  <h3 className="mt-4 font-bold">{f.title}</h3>
                  <p className="mt-1.5 text-small text-background/65">{f.text}</p>
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
              <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-border bg-surface shadow-sm">
                <s.icon className="size-7 text-primary" aria-hidden />
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
      <section className="bg-foreground py-20 text-background">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
          <Reveal>
            <p className="text-small font-semibold uppercase tracking-[0.18em] text-background/60">Talk to us</p>
            <h2 className="mt-2 font-heading text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-tight">Get a free demo for your shop</h2>
            <p className="mt-3 text-background/70 md:text-lg">
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

/** Faint dotted grid behind the hero. */
function GridBackdrop() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 opacity-[0.5] [mask-image:radial-gradient(ellipse_at_top,#000_20%,transparent_70%)]"
      style={{ backgroundImage: 'radial-gradient(var(--color-border) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
    />
  )
}

/** Two phones: orders arriving live, and a customer spinning to win. */
function HeroPhones() {
  const pre = usePrerender()
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (pre) return
    const id = setInterval(() => setTick((t) => t + 1), 2600)
    return () => clearInterval(id)
  }, [pre])
  const shown = [0, 1, 2].map((k) => HERO_ORDERS[(tick + k) % HERO_ORDERS.length])

  return (
    <div className="relative mx-auto h-[560px] w-full max-w-[460px]">
      <motion.div
        className="absolute left-0 top-4 z-10"
        animate={pre ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <PhoneFrame>
          <p className="mb-2 text-[15px] font-extrabold">Orders</p>
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-[11px] font-bold text-white">
            <BellRing className="size-4 animate-bounce" aria-hidden /> New order ringing…
          </div>
          <div className="space-y-2">
            <AnimatePresence initial={false} mode="popLayout">
              {shown.map(([id, what, amt], i) => (
                <motion.div
                  key={`${id}-${tick}-${i}`}
                  layout
                  initial={{ opacity: 0, y: -20, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className={`rounded-xl border p-2.5 ${i === 0 ? 'border-primary bg-primary/5' : 'border-border bg-surface'}`}
                >
                  <div className="flex justify-between font-bold"><span>{id}</span><span>{amt}</span></div>
                  <p className="text-text-muted">{what}</p>
                  {i === 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-2 text-center text-[11px] font-bold">
                      <span className="rounded-lg border border-border py-1.5">Reject</span>
                      <span className="rounded-lg bg-primary py-1.5 text-white">Accept</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="mt-3 rounded-xl bg-foreground p-3 text-background">
            <p className="text-[10px] opacity-70">Today</p>
            <p className="text-[20px] font-extrabold">₹18,420</p>
          </div>
        </PhoneFrame>
      </motion.div>
      <motion.div
        className="absolute right-0 top-24 hidden scale-90 sm:block"
        animate={pre ? undefined : { y: [0, 12, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      >
        <PhoneFrame title="Listee · Customer"><MockScreen screen="spin" /></PhoneFrame>
      </motion.div>
      {[
        { t: 'GST bill printed', icon: Printer, cls: 'left-[52%] top-0' },
        { t: '+1 loyal customer', icon: Users, cls: 'bottom-16 left-[46%]' },
      ].map((c, i) => (
        <motion.div
          key={c.t}
          className={`absolute z-20 hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-small font-semibold shadow-lg sm:flex ${c.cls}`}
          animate={pre ? undefined : { y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: i * 1.2 }}
        >
          <c.icon className="size-4 text-primary" aria-hidden />{c.t}
        </motion.div>
      ))}
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
