import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ExternalLink, Globe, Search } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useAdminSettings, useUpdateSettings } from '@/features/admin/hooks/useAdmin'
import { SEO_PAGES, type SeoPageId, type SeoSettings } from '@/features/seo/seoTypes'
import { env } from '@/config/env'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { cn } from '@/utils/cn'

interface SeoForm {
  siteTitle: string
  description: string
  keywords: string
  ogImageUrl: string
  googleVerification: string
  bingVerification: string
  googleAnalyticsId: string
  noindex: boolean
  pages: Record<SeoPageId, { title: string; description: string }>
}

function toForm(seo: SeoSettings | null | undefined): SeoForm {
  const pages = Object.fromEntries(
    SEO_PAGES.map((p) => [p.id, { title: seo?.pages?.[p.id]?.title ?? '', description: seo?.pages?.[p.id]?.description ?? '' }]),
  ) as SeoForm['pages']
  return {
    siteTitle: seo?.siteTitle ?? '',
    description: seo?.description ?? '',
    keywords: seo?.keywords ?? '',
    ogImageUrl: seo?.ogImageUrl ?? '',
    googleVerification: seo?.googleVerification ?? '',
    bingVerification: seo?.bingVerification ?? '',
    googleAnalyticsId: seo?.googleAnalyticsId ?? '',
    noindex: seo?.noindex ?? false,
    pages,
  }
}

const blankToNull = (v: string) => (v.trim() === '' ? null : v.trim())

function toPayload(form: SeoForm): SeoSettings {
  const pages: SeoSettings['pages'] = {}
  for (const p of SEO_PAGES) {
    const { title, description } = form.pages[p.id]
    if (title.trim() || description.trim()) pages[p.id] = { title: blankToNull(title), description: blankToNull(description) }
  }
  return {
    siteTitle: blankToNull(form.siteTitle),
    description: blankToNull(form.description),
    keywords: blankToNull(form.keywords),
    ogImageUrl: blankToNull(form.ogImageUrl),
    googleVerification: blankToNull(verificationCode(form.googleVerification)),
    bingVerification: blankToNull(verificationCode(form.bingVerification)),
    googleAnalyticsId: blankToNull(form.googleAnalyticsId.toUpperCase()),
    noindex: form.noindex,
    pages,
  }
}

/**
 * Search Console hands out a whole tag — `<meta name="google-site-verification"
 * content="abc…" />`. Accept that pasted as is and keep only the code.
 */
function verificationCode(value: string): string {
  const match = value.match(/content=["']([^"']+)["']/i)
  return (match ? match[1] : value).trim()
}

/** The sitemap is served by the API server, next to /api/v1. */
const SITEMAP_URL = env.apiBaseUrl.replace(/\/api\/v1\/?$/, '') + '/sitemap.xml'

/**
 * Admin → SEO. What Google and shared links show for the site: the title,
 * description, share picture, Search Console / Bing verification, Google
 * Analytics, and a title and description per main page. Applied by SeoManager.
 */
export function AdminSeoPage() {
  usePageTitle('SEO')
  const { data, isLoading, isError, refetch } = useAdminSettings()
  const update = useUpdateSettings()
  const saved = useMemo(() => toForm(data?.seo), [data?.seo])
  const [form, setForm] = useState<SeoForm>(saved)

  useEffect(() => setForm(saved), [saved])

  if (isLoading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Spinner size={32} label="Loading SEO settings" />
      </div>
    )
  }
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />

  const dirty = JSON.stringify(form) !== JSON.stringify(saved)
  const set = <K extends keyof SeoForm>(key: K, value: SeoForm[K]) => setForm((f) => ({ ...f, [key]: value }))
  const setPage = (id: SeoPageId, change: Partial<SeoForm['pages'][SeoPageId]>) =>
    setForm((f) => ({ ...f, pages: { ...f.pages, [id]: { ...f.pages[id], ...change } } }))

  const gaValid = form.googleAnalyticsId.trim() === '' || /^G-[A-Z0-9]+$/i.test(form.googleAnalyticsId.trim())
  const urlValid = form.ogImageUrl.trim() === '' || /^https?:\/\/\S+$/i.test(form.ogImageUrl.trim())

  function save() {
    if (!gaValid || !urlValid) return
    update.mutate(
      { seo: toPayload(form) },
      {
        onSuccess: () => toast.success('SEO settings saved'),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Could not save the SEO settings.'),
      },
    )
  }

  const origin = window.location.origin
  const previewTitle = form.siteTitle.trim() || 'Listee — Rewards Around You'
  const previewDesc = form.description.trim() || 'Add a description so Google shows your own words under the title.'

  return (
    <div className="space-y-4 pb-24">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="inline-flex items-center gap-2 text-title font-bold text-foreground">
            <Globe className="size-6 text-primary" aria-hidden /> SEO
          </h1>
          <p className="text-caption text-text-secondary">How Listee looks on Google and when someone shares a link.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={SITEMAP_URL} target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" aria-hidden /> Open sitemap
          </a>
        </Button>
      </header>

      <div className="grid max-w-5xl gap-4 lg:grid-cols-[1fr_22rem]">
        <Card elevation="soft" padding="md" className="space-y-4">
          <h2 className="text-subtitle font-bold text-foreground">Whole site</h2>
          <Field label="Site title" id="seo-title" hint={<Counter value={form.siteTitle} best={60} />}>
            <Input id="seo-title" value={form.siteTitle} maxLength={70} placeholder="Listee — Local shops, offers and rewards near you" onChange={(e) => set('siteTitle', e.target.value)} />
          </Field>
          <Field label="Description" id="seo-desc" hint={<Counter value={form.description} best={160} />}>
            <Textarea id="seo-desc" value={form.description} maxLength={320} rows={3} placeholder="Find local shops near you, today’s discounts and rewards. Shop owners: register free and get your own shop link." onChange={(e) => set('description', e.target.value)} />
          </Field>
          <Field label="Keywords" id="seo-kw" hint="Comma separated. Google mostly ignores these; Bing reads them.">
            <Input id="seo-kw" value={form.keywords} maxLength={400} placeholder="local shops, offers near me, restaurant discounts, shop online listing" onChange={(e) => set('keywords', e.target.value)} />
          </Field>
          <Field label="Share picture (link)" id="seo-og" hint="Shown when a link is shared. 1200 × 630 px works best. Paste the full https:// address of the image.">
            <Input id="seo-og" value={form.ogImageUrl} maxLength={500} placeholder="https://…/share.jpg" aria-invalid={!urlValid} onChange={(e) => set('ogImageUrl', e.target.value)} />
            {!urlValid && <p className="text-small text-danger">Use a full address that starts with https://</p>}
            {urlValid && form.ogImageUrl.trim() && (
              <img src={form.ogImageUrl.trim()} alt="Share picture preview" className="mt-2 aspect-[1200/630] w-full max-w-sm rounded-lg border border-border object-cover" />
            )}
          </Field>
          <div className="flex items-start justify-between gap-4 rounded-xl border border-border p-3">
            <div>
              <p className="text-body font-semibold text-foreground">Hide from search engines</p>
              <p className="text-small text-text-secondary">Only while testing. Leave this off for a live site, or it drops out of Google.</p>
            </div>
            <Switch checked={form.noindex} onCheckedChange={(v) => set('noindex', v)} aria-label="Hide from search engines" />
          </div>
        </Card>

        {/* What Google will roughly show. */}
        <Card elevation="soft" padding="md" className="h-fit">
          <p className="inline-flex items-center gap-1.5 text-small font-semibold text-text-muted">
            <Search className="size-3.5" aria-hidden /> Google preview
          </p>
          <div className="mt-3 rounded-xl bg-white p-3 text-left">
            <p className="truncate text-[12px] text-[#4d5156]">{origin.replace(/^https?:\/\//, '')}</p>
            <p className="line-clamp-1 text-[18px] leading-snug text-[#1a0dab]">{previewTitle}</p>
            <p className="line-clamp-2 text-[13px] leading-snug text-[#4d5156]">{previewDesc}</p>
          </div>
        </Card>
      </div>

      <Card elevation="soft" padding="md" className="max-w-5xl space-y-4">
        <h2 className="text-subtitle font-bold text-foreground">Google and Bing</h2>
        <Field
          label="Google Search Console verification"
          id="seo-gsc"
          hint="Search Console → Add property → URL prefix → HTML tag. Paste the whole tag or just the code."
        >
          <Input id="seo-gsc" value={form.googleVerification} placeholder='<meta name="google-site-verification" content="…" />' onChange={(e) => set('googleVerification', e.target.value)} />
        </Field>
        <Field label="Bing Webmaster verification" id="seo-bing" hint="Bing Webmaster Tools → Add site → HTML meta tag. Paste the whole tag or just the code.">
          <Input id="seo-bing" value={form.bingVerification} placeholder='<meta name="msvalidate.01" content="…" />' onChange={(e) => set('bingVerification', e.target.value)} />
        </Field>
        <Field label="Google Analytics 4 id" id="seo-ga" hint="Analytics → Admin → Data streams → your web stream → Measurement ID.">
          <Input id="seo-ga" value={form.googleAnalyticsId} maxLength={20} placeholder="G-XXXXXXXXXX" aria-invalid={!gaValid} onChange={(e) => set('googleAnalyticsId', e.target.value)} />
          {!gaValid && <p className="text-small text-danger">A Google Analytics 4 id looks like G-XXXXXXXXXX.</p>}
        </Field>
        <p className="rounded-xl bg-surface-muted p-3 text-small text-text-secondary">
          After verifying, submit your sitemap in Search Console: <code className="break-all">{SITEMAP_URL}</code>. It lists the main pages
          and every active shop. If Google can’t verify with the tag, use the DNS (domain) method in Search Console instead — it
          doesn’t depend on the page.
        </p>
      </Card>

      <Card elevation="soft" padding="md" className="max-w-5xl">
        <h2 className="text-subtitle font-bold text-foreground">Page titles</h2>
        <p className="text-caption text-text-secondary">Leave blank to use the site title and description above.</p>
        <ul className="mt-4 space-y-3">
          {SEO_PAGES.map((p) => (
            <li key={p.id} className="rounded-xl border border-border p-3">
              <p className="text-body font-semibold text-foreground">
                {p.label} <code className="ml-1 text-small font-normal text-text-muted">{p.path}</code>
              </p>
              <div className="mt-2 grid gap-2 md:grid-cols-[1fr_1.4fr]">
                <Input value={form.pages[p.id].title} maxLength={70} placeholder="Title" onChange={(e) => setPage(p.id, { title: e.target.value })} aria-label={`${p.label} title`} className="h-9 text-caption" />
                <Input value={form.pages[p.id].description} maxLength={320} placeholder="Description" onChange={(e) => setPage(p.id, { description: e.target.value })} aria-label={`${p.label} description`} className="h-9 text-caption" />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <div className="flex max-w-5xl items-center justify-end gap-2">
          {dirty && <span className="text-small text-warning">Unsaved changes</span>}
          <Button variant="outline" size="sm" disabled={!dirty || update.isPending} onClick={() => setForm(saved)}>
            Discard
          </Button>
          <Button size="sm" disabled={!dirty || !gaValid || !urlValid} isLoading={update.isPending} onClick={save}>
            Save SEO
          </Button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, id, hint, children }: { label: string; id: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {typeof hint !== 'string' && hint}
      </div>
      {children}
      {typeof hint === 'string' && <p className="text-small text-text-muted">{hint}</p>}
    </div>
  )
}

/** "48 / 60" — turns amber past what Google shows before cutting the text off. */
function Counter({ value, best }: { value: string; best: number }) {
  const n = value.trim().length
  return <span className={cn('text-small tabular-nums', n > best ? 'text-warning' : 'text-text-muted')}>{n} / {best}</span>
}
