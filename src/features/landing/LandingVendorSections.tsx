import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  BadgeIndianRupee,
  Bell,
  Bot,
  Camera,
  Check,
  ChefHat,
  CircleCheckBig,
  Coins,
  FileText,
  Link2,
  MapPin,
  MessageSquareReply,
  Printer,
  QrCode,
  Receipt,
  ScanLine,
  Sparkles,
  Star,
  Store,
  Ticket,
  UserCheck,
  Users,
  Wand2,
  X,
  type LucideIcon,
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/components/ui/button'
import { useNearbyBusinesses } from '@/features/businesses/hooks/useNearbyBusinesses'
import { ShopCard } from '@/features/businesses/components/ShopCard'
import { ShopCardSkeleton } from '@/features/businesses/components/ShopCardSkeleton'
import { cn } from '@/utils/cn'
import { LandingSection } from './LandingSections'
import { useLandingStats } from './useLandingStats'
import { VENDOR_TOOL_GROUPS, WHY_ROWS, type ToolGroup } from './landingContent'

// ---------------------------------------------------------------- Live numbers

/** "1,240" → "1,200+", small numbers as they are. */
function roundedPlus(n: number): string {
  if (n >= 1000) return `${(Math.floor(n / 100) * 100).toLocaleString('en-IN')}+`
  if (n >= 100) return `${Math.floor(n / 10) * 10}+`
  return String(n)
}

/**
 * A strip of four tiles under the hero. Real numbers show once they are big
 * enough to impress; until then the tile shows a promise instead.
 */
export function StatsSection() {
  const { data } = useLandingStats()
  const tiles: { value: string; label: string; icon: LucideIcon }[] = [
    data && data.shops >= 5
      ? { value: roundedPlus(data.shops), label: 'shops already on Listee', icon: Store }
      : { value: 'Free', label: 'shop link & QR, forever', icon: Link2 },
    data && data.cityCount >= 1
      ? { value: String(data.cityCount), label: data.cityCount === 1 ? `city live — ${data.cities[0]?.name}` : 'cities live', icon: MapPin }
      : { value: '5 min', label: 'to put your menu online', icon: ScanLine },
    data && data.customers >= 100
      ? { value: roundedPlus(data.customers), label: 'customers earning rewards', icon: Users }
      : { value: '0%', label: 'commission on your orders', icon: BadgeIndianRupee },
    data && data.orders >= 100
      ? { value: roundedPlus(data.orders), label: 'orders placed', icon: Receipt }
      : { value: 'AI', label: 'assistant built in', icon: Sparkles },
  ]

  return (
    <section id="stats" aria-label="Listee in numbers" className="relative z-10 -mt-8 sm:-mt-10">
      <div className="app-container">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-border/70 shadow-floating ring-1 ring-border/60 lg:grid-cols-4">
          {tiles.map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 bg-surface p-4 sm:p-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-title font-extrabold leading-none text-foreground">{value}</p>
                <p className="mt-1 text-small text-text-secondary">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- Tools for shops

const TOOL_ICONS: Record<string, LucideIcon> = { online: Store, sell: Receipt, grow: Coins, team: Users, ai: Bot }

export function VendorToolsSection({ title, subtitle }: { title: string; subtitle: string | null }) {
  const [active, setActive] = useState(VENDOR_TOOL_GROUPS[0].id)
  const group = VENDOR_TOOL_GROUPS.find((g) => g.id === active) ?? VENDOR_TOOL_GROUPS[0]
  const reduce = useReducedMotion()

  return (
    <LandingSection id="for-shops" title={title} subtitle={subtitle}>
      <div role="tablist" aria-label="What a shop gets" className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {VENDOR_TOOL_GROUPS.map((g) => {
          const Icon = TOOL_ICONS[g.id] ?? Store
          const on = g.id === active
          return (
            <button
              key={g.id}
              role="tab"
              id={`tool-tab-${g.id}`}
              aria-selected={on}
              aria-controls="tool-panel"
              onClick={() => setActive(g.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-caption font-bold transition-colors',
                on ? 'border-primary bg-primary text-primary-foreground shadow-soft' : 'border-border bg-surface text-text-secondary hover:border-primary/50 hover:text-foreground',
              )}
            >
              <Icon className="size-4" aria-hidden /> {g.tab}
            </button>
          )
        })}
      </div>

      <div id="tool-panel" role="tabpanel" aria-labelledby={`tool-tab-${group.id}`} className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={group.id}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <h3 className="text-subtitle font-extrabold text-foreground sm:text-title">{group.title}</h3>
            <p className="mt-2 text-body text-text-secondary">{group.text}</p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {group.features.map((f) => (
                <li key={f.title} className="rounded-2xl border border-border/70 bg-surface p-4 shadow-soft">
                  <p className="flex items-center gap-2 text-body font-bold text-foreground">
                    <CircleCheckBig className="size-4 shrink-0 text-success" aria-hidden /> {f.title}
                  </p>
                  <p className="mt-1 text-caption text-text-secondary">{f.text}</p>
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-6">
              <Link to={ROUTES.ownerSignup}>
                Register your shop free <ArrowRight className="size-5" aria-hidden />
              </Link>
            </Button>
          </motion.div>
        </AnimatePresence>

        <PhoneMock group={group} />
      </div>
    </LandingSection>
  )
}

/** A drawn phone screen that shows the tab's idea (no screenshots to keep up to date). */
function PhoneMock({ group }: { group: ToolGroup }) {
  const reduce = useReducedMotion()
  return (
    <div className="relative mx-auto w-full max-w-sm" aria-hidden>
      <div className="absolute inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-primary/30 to-accent/30 blur-2xl" />
      <div className="rounded-[2.5rem] border-[10px] border-secondary bg-background p-4 shadow-floating">
        <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-border" />
        <AnimatePresence mode="wait">
          <motion.div
            key={group.id}
            initial={reduce ? false : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="min-h-[22rem] space-y-3"
          >
            {MOCKS[group.id]?.() ?? null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function MockRow({ left, right, sub, icon }: { left: string; right?: string; sub?: string; icon?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-soft">
      {icon}
      <div className="min-w-0 flex-1">
        <p className="truncate text-caption font-bold text-foreground">{left}</p>
        {sub && <p className="truncate text-small text-text-muted">{sub}</p>}
      </div>
      {right && <span className="text-caption font-bold text-foreground">{right}</span>}
    </div>
  )
}

const VegDot = ({ non }: { non?: boolean }) => (
  <span className={cn('grid size-4 shrink-0 place-items-center rounded-[3px] border', non ? 'border-destructive' : 'border-success')}>
    <span className={cn('size-2 rounded-full', non ? 'bg-destructive' : 'bg-success')} />
  </span>
)

const MOCKS: Record<string, () => ReactNode> = {
  online: () => (
    <>
      <div className="rounded-2xl bg-gradient-to-br from-gradient-from to-gradient-to p-4 text-white">
        <p className="text-small text-white/70">listee.org/sharma-dhaba</p>
        <p className="mt-1 text-subtitle font-extrabold">Sharma Dhaba</p>
        <p className="mt-1 flex items-center gap-1 text-small text-white/85">
          <Star className="size-3.5 fill-current text-accent" /> 4.6 · Open now · 1.2 km
        </p>
      </div>
      <MockRow icon={<VegDot />} left="Paneer Tikka" sub="Starters" right="₹180" />
      <MockRow icon={<VegDot />} left="Dal Makhani" sub="Half ₹140 · Full ₹220" right="₹140" />
      <MockRow icon={<VegDot non />} left="Butter Chicken" sub="Bestseller" right="₹220" />
      <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 p-3 text-caption font-bold text-primary">
        <QrCode className="size-5" /> Your QR for the counter
      </div>
    </>
  ),
  sell: () => (
    <>
      <div className="flex items-center justify-between">
        <p className="text-body font-extrabold text-foreground">Table 4 · Bill</p>
        <span className="rounded-full bg-success/15 px-2.5 py-1 text-small font-bold text-success">Paid · UPI</span>
      </div>
      <div className="space-y-2 rounded-2xl bg-surface p-4 text-caption shadow-soft">
        {[
          ['2 × Paneer Tikka', '₹360'],
          ['1 × Dal Makhani (Full)', '₹220'],
          ['4 × Butter Naan', '₹160'],
        ].map(([a, b]) => (
          <p key={a} className="flex justify-between text-foreground">
            <span>{a}</span>
            <span>{b}</span>
          </p>
        ))}
        <p className="flex justify-between border-t border-dashed border-border pt-2 text-text-secondary">
          <span>GST 5%</span>
          <span>₹37</span>
        </p>
        <p className="flex justify-between text-body font-extrabold text-foreground">
          <span>Total</span>
          <span>₹777</span>
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-small font-bold">
        <span className="flex items-center justify-center gap-1.5 rounded-xl bg-primary p-2.5 text-primary-foreground">
          <Printer className="size-4" /> Print bill
        </span>
        <span className="flex items-center justify-center gap-1.5 rounded-xl bg-surface p-2.5 text-foreground shadow-soft">
          <FileText className="size-4" /> GST invoice
        </span>
      </div>
    </>
  ),
  grow: () => (
    <>
      <div className="rounded-2xl bg-accent/25 p-4">
        <p className="text-small font-bold text-text-secondary">Rahul earned</p>
        <p className="flex items-center gap-2 text-heading font-extrabold text-foreground">
          <Coins className="size-7 text-warning" /> 78 coins
        </p>
        <p className="text-small text-text-secondary">on his order at Sharma Dhaba</p>
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-soft">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[conic-gradient(var(--color-primary)_0_25%,var(--color-accent)_0_50%,var(--color-success)_0_75%,var(--color-warning)_0)]">
          <span className="size-5 rounded-full bg-surface" />
        </span>
        <div>
          <p className="text-caption font-bold text-foreground">Spin & win</p>
          <p className="text-small text-text-muted">Won: Free masala chai ☕</p>
        </div>
      </div>
      <MockRow icon={<Ticket className="size-5 text-primary" />} left="Happy hours 4–6 pm" sub="20% off on all starters" />
      <MockRow icon={<Bell className="size-5 text-primary" />} left="Sent to 312 followers" sub="“New thali every Sunday 🍛”" />
    </>
  ),
  team: () => (
    <>
      <p className="text-body font-extrabold text-foreground">Today’s team</p>
      <MockRow icon={<UserCheck className="size-5 text-success" />} left="Amit · Waiter" sub="In at 10:02 am" right="✓" />
      <MockRow icon={<UserCheck className="size-5 text-success" />} left="Priya · Cashier" sub="In at 10:15 am" right="✓" />
      <MockRow icon={<ChefHat className="size-5 text-primary" />} left="Kitchen screen" sub="3 orders cooking" />
      <div className="rounded-2xl bg-secondary p-4 text-secondary-foreground">
        <p className="text-small text-white/70">Day close · Today</p>
        <p className="text-title font-extrabold">₹18,450</p>
        <p className="text-small text-white/70">64 orders · Cash ₹6,200 · Online ₹12,250</p>
      </div>
    </>
  ),
  ai: () => (
    <>
      <div className="flex items-center gap-2 text-body font-extrabold text-foreground">
        <Sparkles className="size-5 text-primary" /> AI assistant
      </div>
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary p-3 text-caption text-primary-foreground">
        Write a notification for our Sunday thali
      </div>
      <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-surface p-3 text-caption text-foreground shadow-soft">
        <p className="font-bold">Sunday Thali is back! 🍛</p>
        <p className="text-text-secondary">Dal, 2 sabzi, rice, 4 rotis & sweet — just ₹149. Come hungry!</p>
      </div>
      <MockRow icon={<ScanLine className="size-5 text-primary" />} left="Menu scanned" sub="42 dishes · 6 sections" right="✓" />
      <MockRow icon={<MessageSquareReply className="size-5 text-primary" />} left="Reply to a 3★ review" sub="3 polite replies ready" />
    </>
  ),
}

// ---------------------------------------------------------------- AI assistant

const AI_EXAMPLES: { kind: string; icon: LucideIcon; ask: string; answer: string }[] = [
  {
    kind: 'Dish description',
    icon: Wand2,
    ask: 'Paneer Tikka, ₹180',
    answer: 'Smoky, juicy paneer cubes marinated in our house spices and grilled in the tandoor. Served with mint chutney.',
  },
  {
    kind: 'Offer idea',
    icon: Ticket,
    ask: 'Slow afternoons',
    answer: 'Happy hours 3–5 pm: any starter + cold coffee for ₹199. Fills empty tables and sells your best seller.',
  },
  {
    kind: 'Notification',
    icon: Bell,
    ask: 'Weekend special',
    answer: 'Weekend feast 🍛 Butter Chicken + 2 Naan at ₹249, only Sat–Sun. Order from your table or pick up!',
  },
  {
    kind: 'Review reply',
    icon: MessageSquareReply,
    ask: '3★ “Tasty but slow service”',
    answer: 'Thank you for the kind words on the food! Sorry about the wait — we have added staff at peak hours. See you again soon.',
  },
]

export function AiAssistantSection({ title, subtitle }: { title: string; subtitle: string | null }) {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)
  useEffect(() => {
    if (reduce) return
    const id = window.setInterval(() => setI((n) => (n + 1) % AI_EXAMPLES.length), 4500)
    return () => window.clearInterval(id)
  }, [reduce])
  const ex = AI_EXAMPLES[i]

  return (
    <LandingSection id="ai-assistant" title={title} subtitle={subtitle} tone="muted">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Menu scan */}
        <div className="flex flex-col rounded-3xl bg-surface p-6 shadow-soft ring-1 ring-border/60 sm:p-8">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-small font-bold text-primary">
            <ScanLine className="size-3.5" aria-hidden /> AI menu scan
          </span>
          <h3 className="mt-3 text-subtitle font-extrabold text-foreground">Your whole menu online from one photo</h3>
          <p className="mt-1 text-caption text-text-secondary">
            No typing 100 dishes. Works with printed menus, PDFs and screenshots of your Zomato or Swiggy menu.
          </p>
          <ol className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Camera, t: 'Snap', d: 'Photo of each menu page' },
              { icon: Sparkles, t: 'AI reads', d: 'Dishes, sections, prices, sizes, veg / non-veg' },
              { icon: Check, t: 'You confirm', d: 'Fix anything, tap Add — done' },
            ].map(({ icon: Icon, t, d }, n) => (
              <li key={t} className="relative rounded-2xl bg-surface-muted/70 p-4">
                <span className="absolute right-3 top-3 text-small font-extrabold text-text-muted">{n + 1}</span>
                <Icon className="size-6 text-primary" aria-hidden />
                <p className="mt-2 text-body font-bold text-foreground">{t}</p>
                <p className="text-small text-text-secondary">{d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex-1 space-y-2 rounded-2xl border border-dashed border-border p-3" aria-hidden>
            {[
              ['Paneer Tikka', 'Starters', '₹180', false],
              ['Dal Makhani', 'Half ₹140 · Full ₹220', '₹140', false],
              ['Chicken Biryani', 'Rice', '₹260', true],
            ].map(([n, s, p, non]) => (
              <div key={String(n)} className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-caption shadow-soft">
                <VegDot non={Boolean(non)} />
                <span className="flex-1 font-semibold text-foreground">{n}</span>
                <span className="hidden text-small text-text-muted sm:inline">{s}</span>
                <span className="font-bold text-foreground">{p}</span>
                <CircleCheckBig className="size-4 text-success" />
              </div>
            ))}
          </div>
        </div>

        {/* AI writes */}
        <div className="flex flex-col rounded-3xl bg-gradient-to-br from-gradient-from to-gradient-to p-6 text-secondary-foreground shadow-floating sm:p-8">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-small font-bold ring-1 ring-white/20">
            <Bot className="size-3.5 text-accent" aria-hidden /> AI writes for you
          </span>
          <h3 className="mt-3 text-subtitle font-extrabold">Ideas and words, ready in seconds</h3>
          <p className="mt-1 text-caption text-white/75">
            It knows your menu and best sellers, so every idea fits your shop. You choose — nothing is posted on its own.
          </p>
          <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="AI examples">
            {AI_EXAMPLES.map((e, n) => (
              <button
                key={e.kind}
                role="tab"
                aria-selected={n === i}
                onClick={() => setI(n)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-small font-bold transition-colors',
                  n === i ? 'bg-accent text-accent-foreground' : 'bg-white/10 text-white/80 hover:bg-white/20',
                )}
              >
                {e.kind}
              </button>
            ))}
          </div>
          <div className="mt-5 flex-1 space-y-3" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.div
                key={ex.kind}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-3"
              >
                <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-white/15 px-4 py-2.5 text-caption">
                  <ex.icon className="mr-1.5 inline size-4 text-accent" aria-hidden />
                  {ex.ask}
                </div>
                <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-surface px-4 py-3 text-caption text-foreground shadow-soft">
                  <p className="mb-1 flex items-center gap-1 text-small font-bold text-primary">
                    <Sparkles className="size-3.5" aria-hidden /> Listee AI
                  </p>
                  {ex.answer}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <Button asChild size="lg" className="mt-6 self-start bg-accent text-accent-foreground hover:bg-accent hover:brightness-95">
            <Link to={ROUTES.ownerSignup}>
              Try the AI free <ArrowRight className="size-5" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </LandingSection>
  )
}

// ---------------------------------------------------------------- Why Listee

export function WhyListeeSection({ title, subtitle }: { title: string; subtitle: string | null }) {
  return (
    <LandingSection id="why-listee" title={title} subtitle={subtitle}>
      <div className="overflow-hidden rounded-3xl bg-surface shadow-soft ring-1 ring-border/60">
        <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] bg-surface-muted/70 text-caption font-bold sm:text-body">
          <div className="p-3 sm:p-4" />
          <div className="flex items-center gap-1.5 bg-primary p-3 text-primary-foreground sm:p-4">
            <Store className="size-4" aria-hidden /> Listee
          </div>
          <div className="p-3 text-text-secondary sm:p-4">Typical delivery app</div>
        </div>
        {WHY_ROWS.map((row) => (
          <div key={row.label} className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] border-t border-border/60 text-small sm:text-caption">
            <div className="p-3 font-semibold text-foreground sm:p-4">{row.label}</div>
            <div className="flex items-start gap-1.5 bg-primary-soft/50 p-3 font-bold text-foreground sm:p-4">
              <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> {row.listee}
            </div>
            <div className="flex items-start gap-1.5 p-3 text-text-secondary sm:p-4">
              <X className="mt-0.5 size-4 shrink-0 text-destructive/70" aria-hidden /> {row.others}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-small text-text-muted">
        Delivery-app commission is a typical range and varies by app, city and plan. Listee works alongside them — keep
        them for delivery and use Listee for your own customers.
      </p>
    </LandingSection>
  )
}

// ---------------------------------------------------------------- Cities & shops

export function CitiesSection({ title, subtitle }: { title: string; subtitle: string | null }) {
  const { data } = useLandingStats()
  const cities = data?.cities ?? []
  const [city, setCity] = useState<string | null>(null)
  const chosen = city ?? cities[0]?.name ?? null
  const shops = useNearbyBusinesses(chosen ? { city: chosen } : {})
  const list = (shops.data ?? []).slice(0, 8)

  if (cities.length === 0) return null

  return (
    <LandingSection
      id="cities"
      title={title}
      subtitle={subtitle}
      action={
        <Link to={ROUTES.explore} className="inline-flex items-center gap-1 text-caption font-bold text-primary hover:underline">
          Explore all shops <ArrowRight className="size-4" aria-hidden />
        </Link>
      }
    >
      <div className="mb-5 flex flex-wrap gap-2">
        {cities.map((c) => (
          <button
            key={c.name}
            onClick={() => setCity(c.name)}
            aria-pressed={c.name === chosen}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-caption font-bold transition-colors',
              c.name === chosen ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface text-foreground hover:border-primary/50',
            )}
          >
            <MapPin className="size-4" aria-hidden /> {c.name}
            <span className={cn('rounded-full px-1.5 text-small', c.name === chosen ? 'bg-white/20' : 'bg-surface-muted text-text-secondary')}>
              {c.shops}
            </span>
          </button>
        ))}
      </div>

      {(data?.categories.length ?? 0) > 0 && (
        <ul className="mb-5 flex flex-wrap gap-2" aria-label="Kinds of shops">
          {data?.categories.map((c) => (
            <li key={c.name} className="rounded-full bg-surface-muted px-3 py-1 text-small text-text-secondary">
              {c.name} <span className="font-bold text-foreground">{c.shops}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {shops.isLoading
          ? Array.from({ length: 4 }, (_, n) => <ShopCardSkeleton key={n} />)
          : list.map((b) => <ShopCard key={b.id} business={b} />)}
        <Link
          to={ROUTES.ownerSignup}
          className="group flex min-h-48 flex-col justify-between rounded-card border-2 border-dashed border-primary/40 bg-primary-soft/40 p-5 transition-colors hover:border-primary"
        >
          <Store className="size-8 text-primary" aria-hidden />
          <div>
            <p className="text-body font-extrabold text-foreground">Your shop could be here</p>
            <p className="mt-1 text-caption text-text-secondary">City not listed yet? Be the first shop in your city on Listee.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-caption font-bold text-primary">
              Register free <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </div>
        </Link>
      </div>
    </LandingSection>
  )
}

// ---------------------------------------------------------------- Mobile register bar

/** A slim "Register your shop" bar on phones once the visitor scrolls past the hero. */
export function MobileRegisterBar() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 640)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-surface/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl transition-transform md:hidden',
        show ? 'translate-y-0' : 'translate-y-full',
      )}
      aria-hidden={!show}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-caption font-bold text-foreground">Own a shop?</p>
          <p className="truncate text-small text-text-secondary">Free link & QR · 0% commission · AI</p>
        </div>
        <Button asChild size="md" tabIndex={show ? 0 : -1}>
          <Link to={ROUTES.ownerSignup}>
            <Store className="size-4" aria-hidden /> Register free
          </Link>
        </Button>
      </div>
    </div>
  )
}
