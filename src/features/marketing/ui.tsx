import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  BarChart3,
  BellRing,
  CakeSlice,
  Candy,
  ChefHat,
  ChevronDown,
  ClipboardList,
  Coffee,
  GlassWater,
  Layers,
  Package,
  Pill,
  Printer,
  QrCode,
  Scissors,
  Shirt,
  ShoppingBasket,
  Store,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'
import { useAppConfig } from '@/hooks/useAppConfig'
import { PLAY_FALLBACK } from './site'

/** True while the build pre-renders pages to static HTML: no entrance animations, all text visible. */
export const PrerenderContext = createContext(false)
export const usePrerender = () => useContext(PrerenderContext)

/** Fades and lifts its content in when it scrolls into view. */
export function Reveal({ children, delay = 0, className, y = 24 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  const pre = usePrerender()
  if (pre) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

/** Counts up to `value` when it scrolls into view (the final number when pre-rendered). */
export function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const pre = usePrerender()
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [shown, setShown] = useState(pre ? value : 0)

  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1200)
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value])

  return (
    <span ref={ref} className="tabular-nums">
      {shown.toLocaleString('en-IN')}
      {suffix}
    </span>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-small font-semibold uppercase tracking-[0.18em] text-primary">{children}</p>
}

export function SectionHead({ eyebrow, title, sub, center = true }: { eyebrow?: string; title: ReactNode; sub?: ReactNode; center?: boolean }) {
  return (
    <Reveal className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="mt-2 font-heading text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-[1.1] tracking-tight text-foreground">{title}</h2>
      {sub && <p className="mt-3 text-body text-text-secondary md:text-lg">{sub}</p>}
    </Reveal>
  )
}

const ICONS: Record<string, LucideIcon> = {
  UtensilsCrossed, CakeSlice, Coffee, Candy, ShoppingBasket, ChefHat, GlassWater, Scissors, Pill, Shirt,
  Store, Package, Layers, ClipboardList, Printer, BellRing, QrCode, BarChart3,
}

export function IconByName({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Store
  return <Icon className={className} aria-hidden />
}

/** Play Store links: the admin's saved links, else the known store pages. */
export function usePlayLinks() {
  const { data } = useAppConfig()
  return {
    customer: data?.apps?.customerPlayStore || PLAY_FALLBACK.customer,
    vendor: data?.apps?.vendorPlayStore || PLAY_FALLBACK.vendor,
  }
}

/** A monochrome "Get it on Google Play" badge with who the app is for. */
export function PlayBadge({ href, app, who, dark = true }: { href: string; app: string; who: string; dark?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      aria-label={`Get ${app} on Google Play — ${who}`}
      className={`group inline-flex items-center gap-3 rounded-2xl border px-4 py-2.5 transition hover:-translate-y-0.5 ${
        dark ? 'border-foreground bg-foreground text-background' : 'border-white/30 bg-white/10 text-white backdrop-blur'
      }`}
    >
      <svg viewBox="0 0 24 24" className="size-7 shrink-0" aria-hidden>
        <path fill="currentColor" d="M3.6 1.8c-.3.2-.5.6-.5 1.1v18.2c0 .5.2.9.5 1.1L13.8 12 3.6 1.8Zm11 11 2.7 2.7-12 6.9 9.3-9.6Zm0-1.6L5.3 1.6l12 6.9-2.7 2.7Zm3.7 3.6-3-3 3-3 3.3 1.9c.9.5.9 1.8 0 2.3l-3.3 1.8Z" />
      </svg>
      <span className="text-left leading-tight">
        <span className="block text-[10px] uppercase tracking-wider opacity-70">Get it on Google Play</span>
        <span className="block text-[15px] font-bold">{app}</span>
        <span className="block text-[11px] opacity-70">{who}</span>
      </span>
    </a>
  )
}

/** Questions and answers as plain HTML (readable by crawlers), open/close without JS. */
export function Faq({ items }: { items: [string, string][] }) {
  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-surface">
      {items.map(([q, a]) => (
        <details key={q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-foreground">
            <h3 className="text-body md:text-[17px]">{q}</h3>
            <ChevronDown className="size-5 shrink-0 text-text-muted transition group-open:rotate-180" aria-hidden />
          </summary>
          <p className="mt-3 text-text-secondary">{a}</p>
        </details>
      ))}
    </div>
  )
}

export const faqJsonLd = (items: [string, string][]) => ({
  '@type': 'FAQPage',
  mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
})

export const breadcrumbJsonLd = (crumbs: [string, string][]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url })),
})
