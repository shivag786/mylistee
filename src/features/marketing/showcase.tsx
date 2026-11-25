import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BellRing, Check, Flame, Hand, MapPin, ShoppingBag, Sparkles, Store, Tag } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/apiClient'
import { usePrerender } from './ui'

/* ------------------------------------------------------------------ */
/* Colours: a bright, friendly set used across the marketing pages.    */
/* ------------------------------------------------------------------ */
export const ACCENTS = [
  { soft: 'bg-rose-50', icon: 'bg-rose-500', text: 'text-rose-600', ring: 'hover:ring-rose-200', grad: 'from-rose-500 to-orange-400' },
  { soft: 'bg-amber-50', icon: 'bg-amber-400', text: 'text-amber-600', ring: 'hover:ring-amber-200', grad: 'from-amber-400 to-yellow-300' },
  { soft: 'bg-emerald-50', icon: 'bg-emerald-500', text: 'text-emerald-600', ring: 'hover:ring-emerald-200', grad: 'from-emerald-500 to-lime-400' },
  { soft: 'bg-sky-50', icon: 'bg-sky-500', text: 'text-sky-600', ring: 'hover:ring-sky-200', grad: 'from-sky-500 to-cyan-400' },
  { soft: 'bg-violet-50', icon: 'bg-violet-500', text: 'text-violet-600', ring: 'hover:ring-violet-200', grad: 'from-violet-500 to-fuchsia-400' },
  { soft: 'bg-orange-50', icon: 'bg-orange-500', text: 'text-orange-600', ring: 'hover:ring-orange-200', grad: 'from-orange-500 to-amber-400' },
] as const
export const accent = (i: number) => ACCENTS[i % ACCENTS.length]

/** Soft colour blobs behind a hero. */
export function Blobs({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute -left-24 -top-24 size-[380px] rounded-full bg-amber-300/40 blur-3xl" />
      <div className="absolute -right-20 top-10 size-[420px] rounded-full bg-rose-300/35 blur-3xl" />
      <div className="absolute bottom-[-120px] left-1/3 size-[380px] rounded-full bg-emerald-300/35 blur-3xl" />
    </div>
  )
}

/** A phone frame around a real app screenshot. */
export function RealPhone({ src, alt, className = '', children }: { src?: string; alt: string; className?: string; children?: ReactNode }) {
  return (
    <div className={`relative w-[270px] shrink-0 rounded-[2.6rem] bg-neutral-900 p-2.5 shadow-[0_40px_90px_-25px_rgba(15,23,42,0.55)] ring-1 ring-black/10 ${className}`}>
      <div className="absolute left-1/2 top-4 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-neutral-900" aria-hidden />
      <div className="relative aspect-[600/1194] overflow-hidden rounded-[2.1rem] bg-white">
        {src && <img src={src} alt={alt} className="absolute inset-0 size-full object-cover object-top" loading="lazy" decoding="async" />}
        {children}
      </div>
    </div>
  )
}

export const SHOTS = {
  shop: '/marketing/app-shop.webp',
  menu: '/marketing/app-shop-menu.webp',
}

/* ------------------------------------------------------------------ */
/* Notification → tap → your shop → order                              */
/* ------------------------------------------------------------------ */
const STORY = [
  { icon: BellRing, title: 'You send an offer', text: 'In Listee Business tap Notify customers, write “Fresh pastries 22% off”, Send now.', color: 'bg-rose-500' },
  { icon: Hand, title: 'Their phone buzzes', text: 'Followers and past customers get it on their lock screen — from your shop’s name.', color: 'bg-amber-400' },
  { icon: Store, title: 'One tap opens YOUR shop', text: 'Your own page with your menu, offers and rewards — no other shops, no ads.', color: 'bg-emerald-500' },
  { icon: ShoppingBag, title: 'They order, you get the ring', text: 'Table, pickup or online — the order rings on your phone in seconds.', color: 'bg-sky-500' },
]

export function NotifyStory() {
  const pre = usePrerender()
  const [step, setStep] = useState(pre ? 2 : 0)
  useEffect(() => {
    if (pre) return
    const id = setInterval(() => setStep((s) => (s + 1) % STORY.length), 3200)
    return () => clearInterval(id)
  }, [pre])

  return (
    <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto]">
      <ol className="space-y-3">
        {STORY.map((s, i) => (
          <li key={s.title}>
            <button
              type="button"
              onClick={() => setStep(i)}
              className={`flex w-full items-start gap-4 rounded-2xl p-4 text-left transition ${step === i ? 'bg-white shadow-lg ring-1 ring-black/5' : 'opacity-70 hover:opacity-100'}`}
            >
              <span className={`grid size-11 shrink-0 place-items-center rounded-xl text-white ${s.color}`}>
                <s.icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block text-small font-semibold text-text-muted">Step {i + 1}</span>
                <span className="block text-lg font-extrabold text-foreground">{s.title}</span>
                <span className="block text-text-secondary">{s.text}</span>
                {step === i && !pre && (
                  <motion.span layoutId="story-bar" className="mt-3 block h-1 overflow-hidden rounded-full bg-black/5">
                    <motion.span key={step} className={`block h-full ${s.color}`} initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 3.2, ease: 'linear' }} />
                  </motion.span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div className="relative mx-auto">
        <RealPhone alt="Listee app" src={step >= 3 ? SHOTS.menu : step >= 2 ? SHOTS.shop : undefined}>
          <AnimatePresence>
            {step < 2 && (
              <motion.div
                key="lock"
                className="absolute inset-0 bg-gradient-to-b from-indigo-900 via-violet-800 to-rose-700"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.4 }}
              >
                <p className="mt-16 text-center text-6xl font-light text-white tabular-nums">7:42</p>
                <p className="text-center text-small text-white/70">Saturday, 6 December</p>
                <motion.div
                  className="relative mx-3 mt-10 rounded-2xl bg-white/90 p-3 shadow-xl backdrop-blur"
                  initial={pre ? false : { y: -40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1, scale: step === 1 ? 0.97 : 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.3 }}
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                    <span className="grid size-4 place-items-center rounded bg-amber-400 text-[9px] font-bold text-white">L</span> Listee · now
                  </div>
                  <p className="mt-1 text-[13px] font-bold text-neutral-900">The Perfect Cafe & bakery</p>
                  <p className="text-[13px] text-neutral-700">Fresh pastries 22% off till 9 pm 🍰 Tap to order</p>
                  {step === 1 && !pre && (
                    <motion.span
                      className="absolute right-8 top-1/2 size-10 rounded-full bg-white/70 ring-4 ring-sky-400/60"
                      initial={{ scale: 0.3, opacity: 1 }}
                      animate={{ scale: 1.8, opacity: 0 }}
                      transition={{ duration: 0.9, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          {step === 3 && !pre && (
            <motion.div
              className="absolute inset-x-3 bottom-4 flex items-center gap-2 rounded-2xl bg-emerald-500 px-3 py-2.5 text-[13px] font-semibold text-white shadow-lg"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Check className="size-4" aria-hidden /> Order sent to the shop
            </motion.div>
          )}
        </RealPhone>
        <motion.div
          className="absolute -left-10 top-24 hidden rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-black/5 sm:block"
          animate={pre ? undefined : { y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <p className="text-small text-text-muted">Sent to</p>
          <p className="text-xl font-extrabold text-foreground">1,240 customers</p>
        </motion.div>
        <motion.div
          className="absolute -right-8 bottom-28 hidden items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-black/5 sm:flex"
          animate={pre ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          <span className="grid size-8 place-items-center rounded-full bg-emerald-100 text-emerald-600"><BellRing className="size-4" /></span>
          <span className="text-small font-semibold">New order · ₹350</span>
        </motion.div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Live data from listee.org: shops by city, combos, today’s specials  */
/* ------------------------------------------------------------------ */
interface LiveShop {
  id: string
  slug: string
  name: string
  category: string | null
  city: string | null
  area: string | null
  coverImage: string | null
  logo: string | null
  rating: number
  offerCount: number
  isOpen: boolean
}
interface LiveCombo {
  id: string
  name: string
  imageUrl: string | null
  comboPrice: number
  totalPrice: number
  savings: number
  items: { name: string; imageUrl: string | null }[]
  business: { slug: string; name: string; logo: string | null }
}
interface LiveItem {
  id: string
  name: string
  imageUrl: string | null
  price: number
  strikePrice: number | null
  label: string | null
  business: { slug: string; name: string; logoUrl?: string | null }
}

const titleCase = (s: string) => s.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

export function useLiveShops() {
  return useQuery({
    queryKey: ['marketing', 'shops'],
    queryFn: () => apiClient.get<LiveShop[]>('businesses', { query: { perPage: 50 }, auth: false }),
    staleTime: 10 * 60_000,
  })
}

/** All vendors, city by city, with their real photos. */
export function LiveShops({ city: only }: { city?: string } = {}) {
  const { data } = useLiveShops()
  // Shops with photos first, open ones before closed — the grid opens with real images.
  const shops = useMemo(
    () => (Array.isArray(data) ? [...data] : []).sort((a, b) => Number(!!b.coverImage) - Number(!!a.coverImage) || Number(b.isOpen) - Number(a.isOpen)),
    [data],
  )
  const cities = useMemo(() => {
    const m = new Map<string, number>()
    shops.forEach((s) => {
      const c = titleCase(s.city ?? 'Other') || 'Other'
      m.set(c, (m.get(c) ?? 0) + 1)
    })
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [shops])
  const [city, setCity] = useState<string>(only ? titleCase(only) : 'All')
  const list = city === 'All' ? shops : shops.filter((s) => titleCase(s.city ?? 'Other') === city)

  if (list.length === 0) return null
  return (
    <div>
      <div className={`flex flex-wrap justify-center gap-2 ${only ? 'hidden' : ''}`}>
        {[['All', shops.length] as [string, number], ...cities].map(([c, n], i) => (
          <button
            key={c}
            type="button"
            onClick={() => setCity(c)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-small font-semibold transition ${
              city === c ? `${accent(i).icon} text-white shadow` : 'bg-white text-foreground ring-1 ring-black/10 hover:ring-black/20'
            }`}
          >
            <MapPin className="size-3.5" aria-hidden /> {c} <span className="opacity-70">{n}</span>
          </button>
        ))}
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {list.slice(0, 12).map((s, i) => (
          <a key={s.id} href={`/b/${s.slug}`} className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl">
            <div className={`relative h-32 bg-gradient-to-br ${accent(i).grad}`}>
              {s.coverImage && <img src={s.coverImage} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />}
              <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold ${s.isOpen ? 'bg-emerald-500 text-white' : 'bg-white/90 text-neutral-700'}`}>
                {s.isOpen ? 'Open now' : 'Closed'}
              </span>
            </div>
            <div className="relative px-4 pb-4 pt-7">
              <span className="absolute -top-6 left-4 grid size-12 place-items-center overflow-hidden rounded-2xl bg-white shadow ring-2 ring-white">
                {s.logo ? <img src={s.logo} alt="" className="size-full object-cover" loading="lazy" /> : <Store className="size-5 text-text-muted" />}
              </span>
              <p className="line-clamp-1 font-bold text-foreground">{s.name}</p>
              <p className="line-clamp-1 text-small text-text-secondary">{[s.category, titleCase(s.city ?? '')].filter(Boolean).join(' · ')}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

/** Combos live right now, with their real product photos. */
export function LiveCombos() {
  const { data } = useQuery({
    queryKey: ['marketing', 'combos'],
    queryFn: () => apiClient.get<LiveCombo[]>('combos', { auth: false }),
    staleTime: 10 * 60_000,
  })
  const combos = Array.isArray(data) ? data : []
  if (combos.length === 0) return null
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {combos.slice(0, 6).map((c, i) => (
        <a key={c.id} href={`/b/${c.business.slug}`} className={`group rounded-3xl p-5 ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl ${accent(i).soft}`}>
          <div className="flex items-center">
            {c.items.slice(0, 3).map((it, k) => (
              <span key={k} className="-ml-3 grid size-20 place-items-center overflow-hidden rounded-full bg-white ring-4 ring-white first:ml-0">
                {it.imageUrl ? <img src={it.imageUrl} alt={it.name} className="size-full object-cover" loading="lazy" /> : <Sparkles className="size-6 text-text-muted" />}
              </span>
            ))}
            {c.savings > 0 && <span className={`ml-auto rounded-full px-3 py-1 text-small font-extrabold text-white ${accent(i).icon}`}>Save {inr(c.savings)}</span>}
          </div>
          <p className="mt-4 line-clamp-1 text-lg font-extrabold text-foreground">{c.name}</p>
          <p className="line-clamp-1 text-small text-text-secondary">{c.items.map((x) => x.name).join(' + ')}</p>
          <p className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground">{inr(c.comboPrice)}</span>
            {c.totalPrice > c.comboPrice && <span className="text-text-muted line-through">{inr(c.totalPrice)}</span>}
          </p>
          <p className="mt-2 text-small font-semibold text-text-secondary">at {c.business.name}</p>
        </a>
      ))}
    </div>
  )
}

/** Today’s specials and best-sellers with real dish photos. */
export function LiveSpecials() {
  const spot = useQuery({
    queryKey: ['marketing', 'spotlight'],
    queryFn: () => apiClient.get<{ hero: LiveItem[] }>('home/spotlight', { auth: false }),
    staleTime: 10 * 60_000,
  })
  const popular = useQuery({
    queryKey: ['marketing', 'popular'],
    queryFn: () => apiClient.get<(LiveItem & { orderCount?: number })[]>('home/popular-items', { auth: false }),
    staleTime: 10 * 60_000,
  })
  const items = [...(spot.data?.hero ?? []), ...(Array.isArray(popular.data) ? popular.data : [])]
    .filter((x, i, all) => x.imageUrl && all.findIndex((y) => y.id === x.id) === i)
    .slice(0, 8)
  if (items.length === 0) return null
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {items.map((it, i) => {
        const off = it.strikePrice && it.strikePrice > it.price ? Math.round(((it.strikePrice - it.price) / it.strikePrice) * 100) : 0
        return (
          <a key={it.id} href={`/b/${it.business.slug}`} className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl">
            <div className="relative aspect-square overflow-hidden bg-neutral-100">
              <img src={it.imageUrl ?? ''} alt={it.name} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />
              {off > 0 && <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-2.5 py-1 text-[12px] font-extrabold text-neutral-900">{off}% off</span>}
              {it.label && (
                <span className={`absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white ${accent(i).icon}`}>
                  {/ordered/i.test(it.label) ? <Flame className="size-3" /> : <Tag className="size-3" />} {it.label}
                </span>
              )}
            </div>
            <div className="p-3.5">
              <p className="line-clamp-1 font-bold capitalize text-foreground">{it.name}</p>
              <p className="flex items-baseline gap-1.5">
                <span className="font-extrabold">{inr(it.price)}</span>
                {off > 0 && <span className="text-small text-text-muted line-through">{inr(it.strikePrice!)}</span>}
              </p>
              <p className="line-clamp-1 text-small text-text-secondary">{it.business.name}</p>
            </div>
          </a>
        )
      })}
    </div>
  )
}

/** The little green "live" pill. */
export function LivePill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-small font-bold text-emerald-700 ring-1 ring-emerald-200">
      <span className="relative flex size-2.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
      </span>
      {children}
    </span>
  )
}

