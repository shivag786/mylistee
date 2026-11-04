import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ExternalLink, PanelTop, Plus, RotateCcw, Store, Trash2, LayoutGrid } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useAdminSettings, useUpdateSettings } from '@/features/admin/hooks/useAdmin'
import {
  DEFAULT_CUSTOMER_BENEFITS,
  DEFAULT_FAQS,
  DEFAULT_HERO,
  DEFAULT_LANDING_SECTIONS,
  DEFAULT_VENDOR_BENEFITS,
  LANDING_META,
  resolveLanding,
  type LandingContent,
  type LandingFaq,
  type LandingItem,
  type LandingSectionSetting,
  type ResolvedLanding,
} from '@/features/landing/landingContent'
import { ROUTES } from '@/constants/routes'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { cn } from '@/utils/cn'

const DEFAULTS: ResolvedLanding = resolveLanding(null)

/**
 * Admin → Landing page. Chooses what `/` shows signed-out visitors (the shop
 * feed or the landing page), and edits the landing page: section order and
 * headings, the hero, both benefit lists and the FAQs. Banners, categories,
 * offers, shops and plans on the page come live from their own admin pages.
 */
export function AdminLandingPage() {
  usePageTitle('Landing page')
  const { data, isLoading, isError, refetch } = useAdminSettings()
  const update = useUpdateSettings()
  const saved = useMemo(() => resolveLanding(data?.landingPage), [data?.landingPage])
  const [form, setForm] = useState<ResolvedLanding>(saved)

  useEffect(() => setForm(saved), [saved])

  if (isLoading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Spinner size={32} label="Loading landing page" />
      </div>
    )
  }
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />

  const dirty = JSON.stringify(form) !== JSON.stringify(saved)
  const isDefault = JSON.stringify(form) === JSON.stringify(DEFAULTS)
  const homePage = data.homePage ?? 'shops'

  function setHomePage(choice: 'shops' | 'landing') {
    update.mutate(
      { homePage: choice },
      {
        onSuccess: () =>
          toast.success(choice === 'landing' ? 'The landing page is now the home page' : 'The shop feed is now the home page'),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Could not change the home page.'),
      },
    )
  }

  function save() {
    // The stock content saves as "nothing saved", so later improvements to the defaults reach this site too.
    const payload: LandingContent | null = isDefault
      ? null
      : {
          sections: form.sections.map((s) => ({
            id: s.id,
            enabled: s.enabled,
            title: s.title?.trim() || null,
            subtitle: s.subtitle?.trim() || null,
          })),
          hero: form.hero,
          customerBenefits: form.customerBenefits.filter((i) => i.title.trim()),
          vendorBenefits: form.vendorBenefits.filter((i) => i.title.trim()),
          faqs: form.faqs.filter((f) => f.q.trim() && f.a.trim()),
        }
    update.mutate(
      { landingPage: payload },
      {
        onSuccess: () => toast.success('Landing page saved'),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Could not save the landing page.'),
      },
    )
  }

  const patch = (change: Partial<ResolvedLanding>) => setForm((f) => ({ ...f, ...change }))

  return (
    <div className="space-y-4 pb-24">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="inline-flex items-center gap-2 text-title font-bold text-foreground">
            <PanelTop className="size-6 text-primary" aria-hidden /> Landing page
          </h1>
          <p className="text-caption text-text-secondary">
            One page that explains Listee to customers and shop owners, with sign-up buttons for both.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={ROUTES.landing} target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" aria-hidden /> Preview landing page
          </a>
        </Button>
      </header>

      {/* What `/` shows */}
      <Card elevation="soft" padding="md" className="max-w-4xl">
        <h2 className="text-subtitle font-bold text-foreground">Home page</h2>
        <p className="text-caption text-text-secondary">
          What visitors who are not signed in see when they open the website. Signed-in customers always get the shop
          feed, and the shop feed is always at <code>/explore</code>.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ChoiceCard
            active={homePage === 'shops'}
            disabled={update.isPending}
            onClick={() => setHomePage('shops')}
            icon={<LayoutGrid className="size-5" aria-hidden />}
            title="Shop feed"
            text="Shops, items and offers straight away (arranged in Home layout)."
          />
          <ChoiceCard
            active={homePage === 'landing'}
            disabled={update.isPending}
            onClick={() => setHomePage('landing')}
            icon={<Store className="size-5" aria-hidden />}
            title="Landing page"
            text="Benefits, plans, FAQs and sign-up for shops and customers — then the shops."
          />
        </div>
        <p className="mt-3 text-small text-text-muted">
          The landing page is always at <code>{ROUTES.landing}</code> too, whichever you choose — handy for ads and
          WhatsApp messages to shop owners.
        </p>
      </Card>

      <Sections sections={form.sections} onChange={(sections) => patch({ sections })} />

      <Card elevation="soft" padding="md" className="max-w-4xl space-y-3">
        <h2 className="text-subtitle font-bold text-foreground">Hero</h2>
        <TextRow label="Small badge" value={form.hero.badge} placeholder={DEFAULT_HERO.badge} max={60} onChange={(badge) => patch({ hero: { ...form.hero, badge } })} />
        <TextRow label="Headline" value={form.hero.title} placeholder={DEFAULT_HERO.title} max={120} onChange={(title) => patch({ hero: { ...form.hero, title } })} />
        <div className="space-y-1.5">
          <Label htmlFor="hero-sub">Line under the headline</Label>
          <Textarea
            id="hero-sub"
            value={form.hero.subtitle}
            maxLength={300}
            rows={3}
            onChange={(e) => patch({ hero: { ...form.hero, subtitle: e.target.value } })}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextRow label="Shop button" value={form.hero.vendorCta} placeholder={DEFAULT_HERO.vendorCta} max={40} onChange={(vendorCta) => patch({ hero: { ...form.hero, vendorCta } })} />
          <TextRow label="Customer button" value={form.hero.customerCta} placeholder={DEFAULT_HERO.customerCta} max={40} onChange={(customerCta) => patch({ hero: { ...form.hero, customerCta } })} />
        </div>
      </Card>

      <ItemsEditor
        heading="Benefits for customers"
        items={form.customerBenefits}
        defaults={DEFAULT_CUSTOMER_BENEFITS}
        onChange={(customerBenefits) => patch({ customerBenefits })}
      />
      <ItemsEditor
        heading="Benefits for shops"
        items={form.vendorBenefits}
        defaults={DEFAULT_VENDOR_BENEFITS}
        onChange={(vendorBenefits) => patch({ vendorBenefits })}
      />
      <FaqEditor faqs={form.faqs} onChange={(faqs) => patch({ faqs })} />

      {/* Save bar, always in reach on a long form. */}
      <div className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <div className="flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" leftIcon={<RotateCcw className="size-4" />} disabled={isDefault || update.isPending} onClick={() => setForm(DEFAULTS)}>
            Reset to default text
          </Button>
          <div className="flex items-center gap-2">
            {dirty && <span className="text-small text-warning">Unsaved changes</span>}
            <Button variant="outline" size="sm" disabled={!dirty || update.isPending} onClick={() => setForm(saved)}>
              Discard
            </Button>
            <Button size="sm" disabled={!dirty} isLoading={update.isPending} onClick={save}>
              Save landing page
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChoiceCard({
  active,
  disabled,
  onClick,
  icon,
  title,
  text,
}: {
  active: boolean
  disabled: boolean
  onClick: () => void
  icon: ReactNode
  title: string
  text: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      disabled={disabled || active}
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
        active ? 'border-primary bg-primary-soft' : 'border-border bg-surface hover:border-primary/40',
      )}
    >
      <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', active ? 'bg-primary text-primary-foreground' : 'bg-surface-muted text-text-secondary')}>
        {icon}
      </span>
      <span>
        <span className="block text-body font-semibold text-foreground">
          {title} {active && <span className="ml-1 text-small font-semibold text-primary">· In use</span>}
        </span>
        <span className="block text-caption text-text-secondary">{text}</span>
      </span>
    </button>
  )
}

function TextRow({
  label,
  value,
  placeholder,
  max,
  onChange,
}: {
  label: string
  value: string
  placeholder?: string
  max: number
  onChange: (v: string) => void
}) {
  const id = `f-${label.replace(/\W+/g, '-').toLowerCase()}`
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} placeholder={placeholder} maxLength={max} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function move<T>(list: T[], index: number, by: number): T[] {
  const to = index + by
  if (to < 0 || to >= list.length) return list
  const next = [...list]
  const [item] = next.splice(index, 1)
  next.splice(to, 0, item)
  return next
}

function Sections({ sections, onChange }: { sections: LandingSectionSetting[]; onChange: (s: LandingSectionSetting[]) => void }) {
  const patchAt = (i: number, change: Partial<LandingSectionSetting>) =>
    onChange(sections.map((s, j) => (j === i ? { ...s, ...change } : s)))

  return (
    <Card elevation="soft" padding="md" className="max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-subtitle font-bold text-foreground">Sections</h2>
          <p className="text-caption text-text-secondary">
            Order, show or hide, and rename. Sections with nothing to show (no banners, no offers) hide themselves.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_LANDING_SECTIONS.map((s) => ({ ...s })))}>
          Default order
        </Button>
      </div>
      <ol className="mt-4 space-y-2">
        {sections.map((s, i) => {
          const meta = LANDING_META[s.id]
          return (
            <li key={s.id} className={cn('rounded-xl border border-border bg-surface p-3', !s.enabled && 'bg-surface-muted opacity-70')}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-body font-semibold text-foreground">
                    <span className="mr-1.5 text-text-muted">{i + 1}.</span>
                    {meta.label}
                  </p>
                  <p className="text-small text-text-secondary">{meta.description}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="sm" variant="ghost" className="px-2" disabled={i === 0} onClick={() => onChange(move(sections, i, -1))} aria-label={`Move ${meta.label} up`}>
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="px-2" disabled={i === sections.length - 1} onClick={() => onChange(move(sections, i, 1))} aria-label={`Move ${meta.label} down`}>
                    <ArrowDown className="size-4" />
                  </Button>
                  <Switch checked={s.enabled} onCheckedChange={(v) => patchAt(i, { enabled: v })} aria-label={`Show ${meta.label}`} />
                </div>
              </div>
              {s.enabled && meta.defaultTitle && (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <Input
                    value={s.title ?? ''}
                    onChange={(e) => patchAt(i, { title: e.target.value })}
                    placeholder={`Heading: ${meta.defaultTitle}`}
                    maxLength={80}
                    className="h-9 text-caption"
                    aria-label={`${meta.label} heading`}
                  />
                  <Input
                    value={s.subtitle ?? ''}
                    onChange={(e) => patchAt(i, { subtitle: e.target.value })}
                    placeholder={meta.defaultSubtitle ? `Line: ${meta.defaultSubtitle}` : 'Line under the heading (optional)'}
                    maxLength={240}
                    className="h-9 text-caption"
                    aria-label={`${meta.label} line under the heading`}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

function ItemsEditor({
  heading,
  items,
  defaults,
  onChange,
}: {
  heading: string
  items: LandingItem[]
  defaults: LandingItem[]
  onChange: (items: LandingItem[]) => void
}) {
  const patchAt = (i: number, change: Partial<LandingItem>) => onChange(items.map((it, j) => (j === i ? { ...it, ...change } : it)))
  return (
    <Card elevation="soft" padding="md" className="max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-subtitle font-bold text-foreground">{heading}</h2>
        <Button variant="ghost" size="sm" onClick={() => onChange(defaults.map((d) => ({ ...d })))}>
          Default cards
        </Button>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 rounded-xl border border-border p-3">
            <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[14rem_1fr]">
              <Input value={item.title} maxLength={60} placeholder="Title" onChange={(e) => patchAt(i, { title: e.target.value })} aria-label={`Card ${i + 1} title`} className="h-9 text-caption" />
              <Input value={item.text ?? ''} maxLength={240} placeholder="One line about it" onChange={(e) => patchAt(i, { text: e.target.value })} aria-label={`Card ${i + 1} text`} className="h-9 text-caption" />
            </div>
            <RowActions index={i} count={items.length} onMove={(by) => onChange(move(items, i, by))} onRemove={() => onChange(items.filter((_, j) => j !== i))} />
          </li>
        ))}
      </ul>
      <Button variant="outline" size="sm" className="mt-3" leftIcon={<Plus className="size-4" />} disabled={items.length >= 12} onClick={() => onChange([...items, { title: '', text: '' }])}>
        Add card
      </Button>
    </Card>
  )
}

function FaqEditor({ faqs, onChange }: { faqs: LandingFaq[]; onChange: (f: LandingFaq[]) => void }) {
  const patchAt = (i: number, change: Partial<LandingFaq>) => onChange(faqs.map((f, j) => (j === i ? { ...f, ...change } : f)))
  return (
    <Card elevation="soft" padding="md" className="max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-subtitle font-bold text-foreground">FAQs</h2>
        <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_FAQS.map((f) => ({ ...f })))}>
          Default FAQs
        </Button>
      </div>
      <ul className="mt-3 space-y-2">
        {faqs.map((f, i) => (
          <li key={i} className="flex items-start gap-2 rounded-xl border border-border p-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Input value={f.q} maxLength={200} placeholder="Question" onChange={(e) => patchAt(i, { q: e.target.value })} aria-label={`Question ${i + 1}`} className="h-9 text-caption font-semibold" />
              <Textarea value={f.a} maxLength={1500} rows={2} placeholder="Answer" onChange={(e) => patchAt(i, { a: e.target.value })} aria-label={`Answer ${i + 1}`} className="text-caption" />
            </div>
            <RowActions index={i} count={faqs.length} onMove={(by) => onChange(move(faqs, i, by))} onRemove={() => onChange(faqs.filter((_, j) => j !== i))} />
          </li>
        ))}
      </ul>
      <Button variant="outline" size="sm" className="mt-3" leftIcon={<Plus className="size-4" />} disabled={faqs.length >= 30} onClick={() => onChange([...faqs, { q: '', a: '' }])}>
        Add question
      </Button>
    </Card>
  )
}

function RowActions({ index, count, onMove, onRemove }: { index: number; count: number; onMove: (by: number) => void; onRemove: () => void }) {
  return (
    <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
      <Button size="sm" variant="ghost" className="px-2" disabled={index === 0} onClick={() => onMove(-1)} aria-label="Move up">
        <ArrowUp className="size-4" />
      </Button>
      <Button size="sm" variant="ghost" className="px-2" disabled={index === count - 1} onClick={() => onMove(1)} aria-label="Move down">
        <ArrowDown className="size-4" />
      </Button>
      <Button size="sm" variant="ghost" className="px-2 text-danger" onClick={onRemove} aria-label="Remove">
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}
