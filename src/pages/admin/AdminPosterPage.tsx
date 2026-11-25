import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ROUTES } from '@/constants/routes'
import { useAppConfig } from '@/hooks/useAppConfig'
import { useAdminBusiness } from '@/features/admin/hooks/useAdmin'
import { generateQrDataUrl } from '@/utils/qr'
import type { AdminBusiness } from '@/features/admin/types'
import {
  COPY,
  HOOKS,
  POSTER_THEMES,
  STEPS,
  themeForCategory,
  type PosterHook,
  type PosterLang,
  type PosterTheme,
} from '@/features/admin/poster/posterThemes'

export interface PosterOptions {
  theme: PosterTheme
  lang: PosterLang
  hook: PosterHook
  offer: string
  showLogo: boolean
  showRating: boolean
  showSteps: boolean
  showApp: boolean
}

/**
 * A4 QR poster for one shop, styled by its category: shop name, its permanent
 * QR, a hook that makes people scan, and listee.org in small print. Print it
 * straight from the browser (or "Save as PDF").
 */
export function AdminPosterPage() {
  const { id } = useParams<{ id: string }>()
  const { data: business, isLoading, isError, refetch } = useAdminBusiness(id)
  const { data: config } = useAppConfig()
  const appUrl = config?.apps?.customerPlayStore ?? ''

  const [opts, setOpts] = useState<PosterOptions | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [appQr, setAppQr] = useState<string | null>(null)
  const [zoom, setZoom] = useState(0.62)

  useEffect(() => {
    if (!business || opts) return
    const theme = themeForCategory(business.category)
    setOpts({
      theme,
      lang: 'hinglish',
      hook: theme.hook,
      offer: '',
      showLogo: !!business.logoUrl,
      showRating: business.averageRating >= 3.5 && business.totalReviews > 0,
      showSteps: true,
      showApp: true,
    })
  }, [business, opts])

  const qrUrl = business ? business.qrUrl ?? `${window.location.origin}/b/${business.slug}` : ''
  useEffect(() => {
    if (qrUrl) void generateQrDataUrl(qrUrl, 1200).then(setQr)
  }, [qrUrl])
  useEffect(() => {
    if (appUrl) void generateQrDataUrl(appUrl, 400).then(setAppQr)
  }, [appUrl])

  useEffect(() => {
    if (business) document.title = `Poster · ${business.name}`
  }, [business])

  if (isError) return <ErrorState onRetry={() => void refetch()} />
  if (isLoading || !business || !opts) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner size={32} label="Loading shop" />
      </div>
    )
  }

  const set = <K extends keyof PosterOptions>(k: K, v: PosterOptions[K]) => setOpts((o) => (o ? { ...o, [k]: v } : o))

  return (
    <div className="poster-studio min-h-dvh bg-surface-muted">
      <style>{PRINT_CSS}</style>

      <div className="no-print mx-auto flex max-w-6xl flex-col gap-4 p-4 lg:flex-row">
        {/* Controls */}
        <aside className="w-full space-y-4 rounded-xl bg-surface p-4 shadow-sm lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:w-80 lg:overflow-y-auto">
          <Link to={ROUTES.admin.businesses} className="inline-flex items-center gap-1 text-small text-text-secondary hover:text-foreground">
            <ArrowLeft className="size-4" /> Businesses
          </Link>
          <div>
            <h1 className="text-title font-bold text-foreground">QR poster</h1>
            <p className="text-caption text-text-secondary">{business.name} · {business.category ?? 'No category'}</p>
          </div>

          <div className="space-y-1.5">
            <Label>Design</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {POSTER_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  title={t.label}
                  aria-label={t.label}
                  onClick={() => set('theme', t)}
                  className={`grid aspect-square place-items-center rounded-lg text-xl ${opts.theme.id === t.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  style={{ background: t.bg }}
                >
                  {t.motifs[0]}
                </button>
              ))}
            </div>
            <p className="text-small text-text-muted">{opts.theme.label}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-lang">Language</Label>
            <select id="p-lang" value={opts.lang} onChange={(e) => set('lang', e.target.value as PosterLang)} className="h-11 w-full rounded-input border border-border bg-surface px-3">
              <option value="hinglish">Hinglish</option>
              <option value="hi">हिन्दी</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-hook">Headline</Label>
            <select id="p-hook" value={opts.hook} onChange={(e) => set('hook', e.target.value as PosterHook)} className="h-11 w-full rounded-input border border-border bg-surface px-3">
              {(Object.keys(HOOKS) as PosterHook[]).map((h) => (
                <option key={h} value={h}>{HOOKS[h].label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-offer">Offer sticker (optional)</Label>
            <Input id="p-offer" value={opts.offer} maxLength={28} onChange={(e) => set('offer', e.target.value)} placeholder="10% OFF on first scan" />
            <div className="flex flex-wrap gap-1">
              {['10% OFF first order', 'FREE gift on scan', 'Buy 1 Get 1', 'Flat ₹50 OFF'].map((o) => (
                <button key={o} type="button" onClick={() => set('offer', o)} className="rounded-full border border-border px-2 py-0.5 text-small text-text-secondary hover:bg-surface-muted">
                  {o}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Toggle label="Shop logo" checked={opts.showLogo} disabled={!business.logoUrl} onChange={(v) => set('showLogo', v)} />
            <Toggle label={`Rating (${business.averageRating.toFixed(1)}★, ${business.totalReviews})`} checked={opts.showRating} disabled={business.totalReviews === 0} onChange={(v) => set('showRating', v)} />
            <Toggle label="Scan → Spin → Win steps" checked={opts.showSteps} onChange={(v) => set('showSteps', v)} />
            <Toggle label="Get the app (Play Store)" checked={opts.showApp && !!appUrl} disabled={!appUrl} onChange={(v) => set('showApp', v)} />
            {!appUrl && <p className="text-small text-text-muted">Add the Play Store link in Settings → App store links.</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-zoom">Preview size</Label>
            <input id="p-zoom" type="range" min={0.35} max={1} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full" />
          </div>

          <Button onClick={() => window.print()} leftIcon={<Printer className="size-4" />} fullWidth disabled={!qr}>
            Print / Save as PDF
          </Button>
          <p className="text-small text-text-muted">
            In the print dialog pick A4, margins “None”, and turn on “Background graphics”.
          </p>
          <p className="break-all text-small text-text-muted">QR opens: {qrUrl}</p>
        </aside>

        {/* Preview */}
        <main className="flex flex-1 justify-center overflow-auto">
          <div style={{ zoom }} className="poster-zoom shadow-2xl">
            <Poster business={business} opts={{ ...opts, showApp: opts.showApp && !!appUrl }} qr={qr} appQr={appQr} />
          </div>
        </main>
      </div>

      {/* Only this prints. */}
      <div className="print-only">
        <Poster business={business} opts={{ ...opts, showApp: opts.showApp && !!appUrl }} qr={qr} appQr={appQr} />
      </div>
    </div>
  )
}

function Toggle({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={`flex items-center justify-between gap-2 text-body ${disabled ? 'opacity-50' : ''}`}>
      <span>{label}</span>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} aria-label={label} />
    </label>
  )
}

/** Shop name size so long names still fit on one or two lines. */
function nameSize(name: string): string {
  const n = name.length
  if (n <= 12) return '17mm'
  if (n <= 18) return '13mm'
  if (n <= 26) return '10.5mm'
  if (n <= 36) return '8.5mm'
  return '7mm'
}

/** Scattered, faint category motifs — same spots every render. */
const MOTIF_SPOTS = [
  [6, 4, -18, 15], [84, 3, 14, 13], [44, 1, 8, 9], [2, 30, 10, 11], [90, 26, -12, 12],
  [4, 56, -8, 10], [91, 52, 16, 10], [12, 78, 20, 12], [86, 76, -16, 13], [50, 90, 0, 9],
  [26, 16, -10, 8], [70, 14, 12, 8], [3, 92, 6, 9], [93, 94, -6, 9],
] as const

export function Poster({ business, opts, qr, appQr }: { business: AdminBusiness; opts: PosterOptions; qr: string | null; appQr: string | null }) {
  const { theme: t, lang } = opts
  const [headline, sub] = HOOKS[opts.hook].text[lang]
  const steps = STEPS[lang]
  const copy = COPY[lang]
  const benefits = t.benefits[lang]
  const motifs = useMemo(() => MOTIF_SPOTS.map((s, i) => ({ s, m: t.motifs[i % t.motifs.length] })), [t])

  return (
    <div
      className="poster"
      style={{
        width: '210mm',
        height: '297mm',
        position: 'relative',
        overflow: 'hidden',
        background: t.bg,
        color: t.ink,
        fontFamily: "'Poppins','Montserrat','Rubik','Nirmala UI','Noto Sans Devanagari',system-ui,sans-serif",
      }}
    >
      {/* Motifs */}
      {motifs.map(({ s: [x, y, r, size], m }, i) => (
        <span
          key={i}
          aria-hidden
          style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, fontSize: `${size}mm`, transform: `rotate(${r}deg)`, opacity: 0.22, lineHeight: 1 }}
        >
          {m}
        </span>
      ))}
      {/* Glow behind the QR */}
      <div aria-hidden style={{ position: 'absolute', left: '50%', top: '140mm', width: '200mm', height: '190mm', transform: 'translate(-50%,-50%)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,.28) 0%, rgba(255,255,255,0) 65%)' }} />

      <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12mm 12mm 0' }}>
        <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly', paddingBottom: '4mm' }}>
        {/* Shop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5mm', maxWidth: '100%' }}>
          {opts.showLogo && business.logoUrl && (
            <img src={business.logoUrl} alt="" style={{ width: '22mm', height: '22mm', borderRadius: '50%', objectFit: 'cover', border: `1.2mm solid ${t.accent}`, background: '#fff', flexShrink: 0 }} />
          )}
          <div style={{ textAlign: opts.showLogo && business.logoUrl ? 'left' : 'center', minWidth: 0 }}>
            <div style={{ fontSize: nameSize(business.name), fontWeight: 900, lineHeight: 1.02, letterSpacing: '-0.02em', textShadow: '0 1mm 3mm rgba(0,0,0,.25)', wordBreak: 'break-word' }}>
              {business.name}
            </div>
            <div style={{ display: 'flex', gap: '2.5mm', marginTop: '2mm', justifyContent: opts.showLogo && business.logoUrl ? 'flex-start' : 'center', flexWrap: 'wrap' }}>
              {business.verified && (
                <span style={{ background: t.accent, color: t.onAccent, borderRadius: '10mm', padding: '0.8mm 3mm', fontSize: '3.6mm', fontWeight: 800 }}>✔ {copy.verified}</span>
              )}
              {opts.showRating && business.totalReviews > 0 && (
                <span style={{ background: 'rgba(255,255,255,.18)', borderRadius: '10mm', padding: '0.8mm 3mm', fontSize: '3.6mm', fontWeight: 700 }}>
                  ★ {business.averageRating.toFixed(1)} · {business.totalReviews} reviews
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Hook */}
        <div>
        <div style={{ fontSize: headline.length > 20 ? '12mm' : '15mm', fontWeight: 900, color: t.accent, lineHeight: 1, textAlign: 'center', letterSpacing: '-0.01em', textShadow: '0 1.2mm 0 rgba(0,0,0,.22)' }}>
          {headline}
        </div>
        <div style={{ marginTop: '3mm', fontSize: '5mm', fontWeight: 600, textAlign: 'center', opacity: 0.95, maxWidth: '165mm', marginInline: 'auto' }}>{sub}</div>
        </div>

        {/* QR */}
        <div style={{ position: 'relative', marginTop: '4mm' }}>
          <div style={{ position: 'absolute', top: '-5mm', left: '50%', transform: 'translateX(-50%)', background: t.accent, color: t.onAccent, borderRadius: '10mm', padding: '1.5mm 5mm', fontSize: '4.2mm', fontWeight: 800, whiteSpace: 'nowrap', zIndex: 2, boxShadow: '0 1mm 2mm rgba(0,0,0,.2)' }}>
            📷 {copy.scanMe}
          </div>
          <div style={{ background: '#fff', borderRadius: '8mm', padding: '7mm', boxShadow: '0 4mm 10mm rgba(0,0,0,.3)', position: 'relative' }}>
            {/* Scanner corners */}
            {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
              <span
                key={c}
                aria-hidden
                style={{
                  position: 'absolute',
                  width: '14mm',
                  height: '14mm',
                  borderColor: t.accent === '#ffffff' ? t.onAccent : t.accent,
                  borderStyle: 'solid',
                  borderWidth: 0,
                  ...(c[0] === 't' ? { top: '2.5mm', borderTopWidth: '2mm' } : { bottom: '2.5mm', borderBottomWidth: '2mm' }),
                  ...(c[1] === 'l' ? { left: '2.5mm', borderLeftWidth: '2mm' } : { right: '2.5mm', borderRightWidth: '2mm' }),
                  borderRadius: c === 'tl' ? '4mm 0 0 0' : c === 'tr' ? '0 4mm 0 0' : c === 'bl' ? '0 0 0 4mm' : '0 0 4mm 0',
                }}
              />
            ))}
            {qr ? (
              <img src={qr} alt="Shop QR code" style={{ width: '104mm', height: '104mm', display: 'block' }} />
            ) : (
              <div style={{ width: '104mm', height: '104mm' }} />
            )}
          </div>

          {/* Offer sticker */}
          {opts.offer.trim() && (
            <div
              style={{
                position: 'absolute',
                right: '-24mm',
                top: '-10mm',
                width: '38mm',
                height: '38mm',
                display: 'grid',
                placeItems: 'center',
                textAlign: 'center',
                transform: 'rotate(12deg)',
                background: t.accent,
                color: t.onAccent,
                clipPath:
                  'polygon(50% 0%,61% 11%,75% 6%,79% 21%,94% 25%,89% 39%,100% 50%,89% 61%,94% 75%,79% 79%,75% 94%,61% 89%,50% 100%,39% 89%,25% 94%,21% 79%,6% 75%,11% 61%,0% 50%,11% 39%,6% 25%,21% 21%,25% 6%,39% 11%)',
                padding: '7mm',
                fontWeight: 900,
                fontSize: opts.offer.length > 16 ? '3.8mm' : '4.8mm',
                lineHeight: 1.05,
              }}
            >
              {opts.offer.trim()}
            </div>
          )}
        </div>

        {/* Steps */}
        {opts.showSteps && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3mm' }}>
            {steps.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '3mm' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2mm', background: 'rgba(255,255,255,.16)', border: '0.4mm solid rgba(255,255,255,.35)', borderRadius: '10mm', padding: '1.5mm 4mm 1.5mm 1.5mm' }}>
                  <span style={{ width: '7mm', height: '7mm', borderRadius: '50%', background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: '4mm' }}>{i + 1}</span>
                  <span style={{ fontWeight: 800, fontSize: '4.6mm' }}>{s}</span>
                </div>
                {i < steps.length - 1 && <span style={{ fontSize: '6mm', fontWeight: 900, color: t.accent }}>➜</span>}
              </div>
            ))}
          </div>
        )}

        </div>

        {/* Benefits */}
        <div style={{ width: 'calc(100% + 24mm)', background: '#fff', color: '#1f2937', borderRadius: '9mm 9mm 0 0', padding: '6mm 10mm 5mm' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4mm' }}>
            {benefits.map(([icon, text]) => (
              <div key={text} style={{ background: t.soft, borderRadius: '5mm', padding: '3.5mm 3mm', textAlign: 'center' }}>
                <div style={{ fontSize: '8mm', lineHeight: 1 }}>{icon}</div>
                <div style={{ marginTop: '1.5mm', fontSize: '3.9mm', fontWeight: 700, lineHeight: 1.2 }}>{text}</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ marginTop: '4.5mm', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4mm', borderTop: '0.3mm dashed #d1d5db', paddingTop: '3.5mm' }}>
            {opts.showApp && appQr ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '3mm' }}>
                <img src={appQr} alt="" style={{ width: '15mm', height: '15mm' }} />
                <div style={{ fontSize: '3.5mm', fontWeight: 700, lineHeight: 1.25, maxWidth: '75mm' }}>
                  {copy.app}
                  <div style={{ fontSize: '2.8mm', fontWeight: 500, color: '#6b7280' }}>Rewards at every shop near you</div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '3.3mm', color: '#6b7280', fontWeight: 600 }}>Rewards at every shop near you</div>
            )}
            <div style={{ textAlign: 'right', lineHeight: 1.1 }}>
              <div style={{ fontSize: '2.6mm', color: '#9ca3af' }}>Powered by</div>
              <div style={{ fontSize: '4mm', fontWeight: 800, color: '#374151' }}>listee.org</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const PRINT_CSS = `
.poster, .poster * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
.print-only { display: none; }
@page { size: A4 portrait; margin: 0; }
@media print {
  html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
  body * { visibility: hidden; }
  .print-only, .print-only * { visibility: visible; }
  .print-only { display: block; position: fixed; left: 0; top: 0; }
  .no-print { display: none !important; }
  .poster-studio { background: none !important; min-height: 0 !important; }
}
`
