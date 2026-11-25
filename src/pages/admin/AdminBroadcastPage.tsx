import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BellRing, CheckCircle2, Clock, Loader2, Megaphone, Send, Smartphone, Store, Users, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/utils/toast'
import {
  useAdminBusinesses,
  useAdminCategories,
  useBroadcast,
  useBroadcastPreview,
  useBroadcasts,
} from '@/features/admin/hooks/useAdmin'
import type { AdminBusiness, BroadcastInput, BroadcastItem, BroadcastTarget } from '@/features/admin/types'

const TARGETS: { value: BroadcastTarget; label: string; hint: string; icon: typeof Users }[] = [
  { value: 'customers', label: 'All customers', hint: 'Everyone with the Listee customer app or account', icon: Users },
  { value: 'owners', label: 'Vendors (shop owners)', hint: 'All shops, or only one category', icon: Store },
  { value: 'shop_customers', label: "One shop's customers", hint: 'Followers / buyers of a single shop', icon: BellRing },
  { value: 'all', label: 'Everyone', hint: 'Customers + vendors', icon: Megaphone },
  { value: 'test', label: 'Test to my phone', hint: 'Only you — check how it looks first', icon: Smartphone },
]

/** Where a tap opens. The customer app knows these paths; others open Notifications. */
const CUSTOMER_LINKS = [
  { value: '', label: 'Notifications screen' },
  { value: '/nearby', label: 'Nearby shops' },
  { value: '/deals', label: 'Deals' },
  { value: '/wallet', label: 'Wallet / rewards' },
  { value: '/orders', label: 'My orders' },
  { value: '/favorites', label: 'Favourite shops' },
]
/** Vendor app opens its Orders tab for these; the web panel opens the page itself. */
const VENDOR_LINKS = [
  { value: '', label: 'Open the app' },
  { value: '/business/orders', label: 'Orders' },
  { value: '/business/offers', label: 'Offers (web)' },
  { value: '/business/subscription', label: 'Plan (web)' },
]

const TEMPLATES: { label: string; target: BroadcastTarget; title: string; body: string }[] = [
  { label: 'Weekend deals', target: 'customers', title: 'Weekend deals near you 🎉', body: 'Shops around you have new offers this weekend. Open Listee and grab yours before they end!' },
  { label: 'Spin & win', target: 'customers', title: 'Your free spin is waiting 🎡', body: 'Scan the Listee QR at any shop and spin to win discounts and gifts.' },
  { label: 'Vendor: add offer', target: 'owners', title: 'Customers are looking for offers', body: 'Add a weekend offer in 1 minute — shops with offers get up to 3x more visits.' },
  { label: 'Vendor: put poster', target: 'owners', title: 'Your Listee poster is ready 🖨️', body: 'Stick your QR poster at the counter — every scan is a new customer for you.' },
]

export function AdminBroadcastPage() {
  const broadcast = useBroadcast()
  const { data: overview } = useBroadcasts()
  const { data: categories } = useAdminCategories()

  const [target, setTarget] = useState<BroadcastTarget>('customers')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [link, setLink] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [shop, setShop] = useState<AdminBusiness | null>(null)
  const [audience, setAudience] = useState('everyone')
  const [confirming, setConfirming] = useState(false)

  const audienceInput: Omit<BroadcastInput, 'title'> = useMemo(
    () => ({
      target,
      categoryId: target === 'owners' && categoryId ? categoryId : undefined,
      businessId: target === 'shop_customers' ? shop?.id : undefined,
      audience: target === 'shop_customers' ? audience : undefined,
    }),
    [target, categoryId, shop, audience],
  )
  const ready = target !== 'shop_customers' || !!shop
  const preview = useBroadcastPreview(audienceInput, ready)

  // A shop's push opens that shop by default.
  useEffect(() => {
    if (target === 'shop_customers' && shop) setLink(`/b/${shop.slug}`)
  }, [target, shop])
  useEffect(() => setConfirming(false), [target, categoryId, shop, audience])

  const links = target === 'owners' ? VENDOR_LINKS : CUSTOMER_LINKS
  const big = (preview.data?.recipients ?? 0) > 50 && target !== 'test'

  function send() {
    if (!title.trim()) return toast.error('A title is required.')
    if (!ready) return toast.error('Pick a shop first.')
    if (big && !confirming) return setConfirming(true)
    broadcast.mutate(
      { ...audienceInput, title: title.trim(), body: body.trim() || undefined, link: link.trim() || undefined },
      {
        onSuccess: (res) => {
          toast.success(`Sending to ${res.sent} ${res.sent === 1 ? 'person' : 'people'} · ${res.reachable} on phone`)
          setConfirming(false)
          if (target !== 'test') {
            setTitle('')
            setBody('')
          }
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Broadcast failed.'),
      },
    )
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-title font-bold text-foreground">Push notifications</h1>
        <p className="text-caption text-text-secondary">
          Notify customers, vendors or one shop's customers — in-app plus a push on their phone
        </p>
      </header>

      {overview && !overview.pushConfigured && (
        <div className="flex max-w-5xl items-start gap-2 rounded-md bg-warning-soft px-3 py-2 text-small text-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          Firebase is not set up on this server, so only in-app notifications go out (no phone push). Add the service-account JSON to enable push.
        </div>
      )}

      <div className="grid max-w-5xl gap-4 lg:grid-cols-[1fr_320px]">
        <Card elevation="soft" padding="lg" className="space-y-5">
          {/* 1. Audience */}
          <section className="space-y-2">
            <Label>1. Who should get it?</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {TARGETS.map((t) => {
                const Icon = t.icon
                const active = target === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTarget(t.value)}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-left transition ${
                      active ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:bg-surface-muted'
                    }`}
                  >
                    <Icon className={`mt-0.5 size-5 shrink-0 ${active ? 'text-primary' : 'text-text-muted'}`} aria-hidden />
                    <span>
                      <span className="block font-medium text-foreground">{t.label}</span>
                      <span className="block text-small text-text-secondary">{t.hint}</span>
                    </span>
                  </button>
                )
              })}
            </div>

            {target === 'owners' && (
              <select
                aria-label="Category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-11 w-full rounded-input border border-border bg-surface px-3 text-body text-foreground"
              >
                <option value="">All categories</option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            {target === 'shop_customers' && (
              <div className="space-y-2">
                <ShopPicker value={shop} onChange={setShop} />
                <select
                  aria-label="Which customers"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="h-11 w-full rounded-input border border-border bg-surface px-3 text-body text-foreground"
                >
                  {(overview?.shopAudiences ?? [{ key: 'everyone', label: 'Followers + customers' }]).map((a) => (
                    <option key={a.key} value={a.key}>{a.label}</option>
                  ))}
                </select>
              </div>
            )}

            <ReachLine loading={preview.isFetching} ready={ready} data={preview.data} />
          </section>

          {/* 2. Message */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="bc-title">2. Message</Label>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATES.filter((t) => (target === 'owners' ? t.target === 'owners' : t.target !== 'owners')).map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => {
                      setTitle(t.title)
                      setBody(t.body)
                    }}
                    className="rounded-full border border-border px-2.5 py-1 text-small text-text-secondary hover:bg-surface-muted"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <Input id="bc-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New rewards near you!" maxLength={120} />
            <div className="text-right text-small text-text-muted">{title.length}/120 · keep it under 50 so it isn't cut</div>
            <Textarea id="bc-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Details (optional)…" rows={3} maxLength={500} />
          </section>

          {/* 3. Tap opens */}
          <section className="space-y-2">
            <Label htmlFor="bc-link">3. When they tap it, open…</Label>
            <div className="flex flex-wrap gap-1.5">
              {links.map((l) => (
                <button
                  key={l.label}
                  type="button"
                  onClick={() => setLink(l.value)}
                  className={`rounded-full border px-2.5 py-1 text-small ${
                    link === l.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary hover:bg-surface-muted'
                  }`}
                >
                  {l.label}
                </button>
              ))}
              {shop && target === 'shop_customers' && (
                <button
                  type="button"
                  onClick={() => setLink(`/b/${shop.slug}`)}
                  className={`rounded-full border px-2.5 py-1 text-small ${
                    link === `/b/${shop.slug}` ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary'
                  }`}
                >
                  {shop.name}
                </button>
              )}
            </div>
            <Input id="bc-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="/b/shop-slug" maxLength={255} />
          </section>

          {confirming && (
            <div className="rounded-md bg-warning-soft px-3 py-2 text-small text-warning">
              This goes to {preview.data?.recipients} people and cannot be taken back. Press send again to confirm.
            </div>
          )}

          <Button type="button" onClick={send} isLoading={broadcast.isPending} leftIcon={<Send className="size-4" />} fullWidth>
            {confirming ? 'Yes, send now' : target === 'test' ? 'Send test to my phone' : 'Send notification'}
          </Button>
        </Card>

        <PhonePreview title={title} body={body} />
      </div>

      <History items={overview?.items ?? []} />
    </div>
  )
}

function ReachLine({ loading, ready, data }: { loading: boolean; ready: boolean; data?: { recipients: number; reachable: number } }) {
  if (!ready) return <p className="text-small text-text-muted">Pick a shop to see how many people this reaches.</p>
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md bg-info-soft px-3 py-2 text-small text-info">
      {loading && !data ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Users className="size-4" aria-hidden />}
      <span>
        <b className="tabular-nums">{data?.recipients ?? '…'}</b> people get it in the app ·{' '}
        <b className="tabular-nums">{data?.reachable ?? '…'}</b> get a phone push
      </span>
      {data && data.recipients > 0 && data.reachable < data.recipients && (
        <span className="text-text-muted">(the rest haven't allowed notifications / not installed)</span>
      )}
    </div>
  )
}

/** Search a shop by name. */
function ShopPicker({ value, onChange }: { value: AdminBusiness | null; onChange: (b: AdminBusiness | null) => void }) {
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])
  const { data, isFetching } = useAdminBusinesses({ page: 1, search: debounced, status: 'active' })

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-primary bg-primary/5 px-3 py-2">
        <span className="min-w-0">
          <span className="block truncate font-medium text-foreground">{value.name}</span>
          <span className="block text-small text-text-secondary">{value.category ?? '—'}</span>
        </span>
        <Button variant="outline" size="sm" onClick={() => onChange(null)}>Change</Button>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search shop by name…" aria-label="Search shop" />
      <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
        {isFetching && !data && <p className="p-3 text-small text-text-muted">Searching…</p>}
        {(data?.items ?? []).slice(0, 8).map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => onChange(b)}
            className="flex w-full items-center justify-between gap-2 border-b border-border px-3 py-2 text-left last:border-0 hover:bg-surface-muted"
          >
            <span className="truncate text-foreground">{b.name}</span>
            <span className="shrink-0 text-small text-text-muted">{b.category ?? ''}</span>
          </button>
        ))}
        {data && data.items.length === 0 && <p className="p-3 text-small text-text-muted">No shop found.</p>}
      </div>
    </div>
  )
}

/** Roughly how it lands on an Android lock screen. */
function PhonePreview({ title, body }: { title: string; body: string }) {
  return (
    <div className="hidden lg:block">
      <div className="sticky top-4 rounded-[2rem] border-[10px] border-foreground/90 bg-gradient-to-b from-slate-700 to-slate-900 p-3 pb-16 shadow-xl">
        <p className="mb-6 mt-4 text-center text-4xl font-light text-white tabular-nums">10:24</p>
        <div className="rounded-2xl bg-white/95 p-3 shadow">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="grid size-4 place-items-center rounded bg-amber-400 text-[9px] font-bold text-white">L</span>
            Listee · now
          </div>
          <p className="line-clamp-1 text-sm font-semibold text-slate-900">{title || 'Your title shows here'}</p>
          <p className="line-clamp-3 text-[13px] text-slate-600">{body || 'And the message here.'}</p>
        </div>
      </div>
    </div>
  )
}

function History({ items }: { items: BroadcastItem[] }) {
  if (items.length === 0) return null
  return (
    <Card elevation="soft" padding="lg" className="max-w-5xl">
      <h2 className="mb-3 font-semibold text-foreground">Recent notifications</h2>
      <div className="divide-y divide-border">
        {items.map((b) => (
          <div key={b.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{b.title}</p>
              {b.body && <p className="line-clamp-1 text-small text-text-secondary">{b.body}</p>}
              <p className="text-small text-text-muted">
                {b.audienceLabel} · {b.createdAt ? new Date(b.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
              </p>
            </div>
            <div className="flex items-center gap-3 text-small tabular-nums">
              <span title="Got it in the app">{b.recipients} in-app</span>
              <span title="Pushes accepted by Firebase / devices">
                {b.pushed ?? '—'} pushed{b.failed ? ` · ${b.failed} failed` : ''}
              </span>
              <StatusBadge status={b.status} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function StatusBadge({ status }: { status: BroadcastItem['status'] }) {
  if (status === 'sent') return <Badge tone="success" size="sm"><CheckCircle2 className="size-3" /> Sent</Badge>
  if (status === 'failed') return <Badge tone="danger" size="sm"><XCircle className="size-3" /> Failed</Badge>
  return <Badge tone="info" size="sm"><Clock className="size-3" /> {status === 'sending' ? 'Sending' : 'Queued'}</Badge>
}
