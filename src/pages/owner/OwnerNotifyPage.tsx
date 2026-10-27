import { useEffect, useMemo, useState } from 'react'
import { BellRing, Users, Send, Clock, Smartphone, Info, CheckCircle2, Search, Mail, Phone } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Spinner } from '@/components/feedback/Spinner'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ErrorState } from '@/components/feedback/ErrorState'
import { SkeletonList } from '@/components/feedback/skeletons'
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog'
import { usePushCustomers, usePushSummary, useSendPush } from '@/features/owner/hooks/usePush'
import { useOwnerBusiness } from '@/features/owner/hooks/useOwner'
import { useProducts } from '@/features/owner/hooks/useProducts'
import type { PushAudience } from '@/features/owner/services/pushService'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'
import { cn } from '@/utils/cn'

/** Ready-made messages — one tap fills the title and text. */
const TEMPLATES = [
  { label: '🔥 Fresh batch', title: 'Fresh batch just out of the oven!', body: 'Come in while it’s warm — limited pieces.' },
  { label: '🎉 New combo', title: 'New combo is live 🎉', body: 'Save more on your favourites. Open to see what’s inside.' },
  { label: '⏳ Ends today', title: 'Offer ends tonight ⏳', body: 'Last chance — visit us before closing.' },
  { label: '👋 Miss you', title: 'We miss you 👋', body: 'It’s been a while! Drop by — something special is waiting.' },
]

const TITLE_MAX = 80
const BODY_MAX = 200

/**
 * Notify customers: pick who (followers, past customers, lapsed ones), write a
 * short message (or tap a template), choose what opens on tap, and send.
 * Shows the month's reach left and why sending is paused, if it is.
 */
export function OwnerNotifyPage() {
  usePageTitle('Notify customers')
  const { data, isLoading, isError, refetch } = usePushSummary()
  const { data: business } = useOwnerBusiness()
  const { data: products } = useProducts()
  const send = useSendPush()

  const [audience, setAudience] = useState<PushAudience>('everyone')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [target, setTarget] = useState('shop')
  const [howMany, setHowMany] = useState('')
  const [confirming, setConfirming] = useState(false)
  // Customers ticked in the list; none ticked = the whole group.
  const [picked, setPicked] = useState<Set<string>>(new Set())

  const selected = data?.audiences.find((a) => a.key === audience)
  const remaining = data?.reach.remaining ?? null
  // The most this send can reach: the group, capped by what's left this month.
  const maxSend = selected ? (remaining === null ? selected.count : Math.min(selected.count, remaining)) : 0
  const count =
    picked.size > 0
      ? remaining === null
        ? picked.size
        : Math.min(picked.size, remaining)
      : howMany
        ? Math.min(Number(howMany) || 0, maxSend)
        : maxSend

  useEffect(() => {
    setHowMany('')
    setPicked(new Set())
  }, [audience])

  const link = useMemo(() => {
    if (!business) return undefined
    return target === 'shop' ? `/b/${business.slug}` : `/b/${business.slug}?item=${target}`
  }, [business, target])

  const blocked = data?.blockedReason ?? null
  const canSend = !blocked && title.trim().length > 0 && count > 0

  async function doSend() {
    try {
      const res = await send.mutateAsync({
        audience,
        title: title.trim(),
        body: body.trim() || undefined,
        link,
        limit: count,
        customerIds: picked.size > 0 ? [...picked] : undefined,
      })
      toast.success(`Sent to ${res.recipients} customers`)
      setTitle('')
      setBody('')
      setPicked(new Set())
      setConfirming(false)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic)
      setConfirming(false)
    }
  }

  if (isLoading) return <SkeletonList rows={4} />
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />

  const reachPct = data.reach.limit ? Math.round((data.reach.used / data.reach.limit) * 100) : 0

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header>
        <h1 className="inline-flex items-center gap-2 text-title font-bold text-foreground">
          <BellRing className="size-6 text-primary" aria-hidden /> Notify customers
        </h1>
        <p className="text-caption text-text-secondary">
          Send a message to people who follow your shop or ordered from you. It pops up on their phone.
        </p>
      </header>

      {/* This month's allowance */}
      <Card padding="md" className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-caption font-medium text-text-secondary">This month</p>
          <p className="text-body font-bold text-foreground">
            {data.reach.limit === null ? 'Unlimited customers' : `${data.reach.remaining} of ${data.reach.limit} customers left`}
          </p>
        </div>
        {data.reach.limit !== null && <Progress value={reachPct} />}
        <p className="text-small text-text-muted">
          {data.sends.limit === null
            ? `${data.sends.used} sent this month · 1 per day`
            : `${data.sends.used} of ${data.sends.limit} notifications used · 1 per day`}
        </p>
      </Card>

      {blocked && (
        <Card padding="md" className="flex items-start gap-3 border-warning/40 bg-warning-soft">
          <Clock className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
          <p className="text-caption font-medium text-foreground">{blocked}</p>
        </Card>
      )}

      {/* 1. Who */}
      <Card padding="md" className="space-y-3">
        <h2 className="text-body font-semibold text-foreground">1. Who should get it?</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {data.audiences.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => setAudience(a.key)}
              aria-pressed={audience === a.key}
              className={cn(
                'rounded-2xl border p-3 text-left transition-colors',
                audience === a.key ? 'border-primary bg-primary-soft ring-1 ring-primary' : 'border-border hover:border-border-strong',
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-caption font-semibold text-foreground">{a.label}</span>
                <Badge tone={audience === a.key ? 'primary' : 'neutral'} className="gap-1">
                  <Users className="size-3" aria-hidden /> {a.count}
                </Badge>
              </span>
              <span className="mt-1 flex items-center gap-1 text-small text-text-muted">
                <Smartphone className="size-3" aria-hidden /> {a.reachable} get it on their phone
              </span>
            </button>
          ))}
        </div>
        {data.perCustomer?.limit != null && (
          <p className="text-small text-text-muted">
            One customer can get {data.perCustomer.limit} {data.perCustomer.limit === 1 ? 'notification' : 'notifications'} from
            you a month. Anyone who already got them is skipped.
          </p>
        )}
        {selected && selected.count > 0 && (
          <CustomerPicker audience={audience} masked={data.customerDetails !== 'full'} picked={picked} onChange={setPicked} />
        )}
        {selected && selected.count > 0 && picked.size === 0 && (
          <div className="flex items-center gap-3">
            <Label htmlFor="push-count" className="shrink-0">Send to</Label>
            <Input
              id="push-count"
              type="number"
              inputMode="numeric"
              min={1}
              max={maxSend}
              value={howMany}
              placeholder={String(maxSend)}
              onChange={(e) => setHowMany(e.target.value)}
              className="w-28"
            />
            <span className="text-small text-text-muted">of {maxSend} (newest first)</span>
          </div>
        )}
      </Card>

      {/* 2. Message */}
      <Card padding="md" className="space-y-3">
        <h2 className="text-body font-semibold text-foreground">2. Message</h2>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => {
                setTitle(t.title)
                setBody(t.body)
              }}
              className="rounded-full bg-surface-muted px-3 py-1 text-small font-medium text-foreground hover:bg-primary-soft hover:text-primary"
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Label htmlFor="push-title">Title</Label>
            <span className="text-small text-text-muted">{title.length}/{TITLE_MAX}</span>
          </div>
          <Input id="push-title" value={title} maxLength={TITLE_MAX} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Hot samosas ready at 5 PM!" />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Label htmlFor="push-body">Text (optional)</Label>
            <span className="text-small text-text-muted">{body.length}/{BODY_MAX}</span>
          </div>
          <Textarea id="push-body" rows={2} value={body} maxLength={BODY_MAX} onChange={(e) => setBody(e.target.value)} placeholder="One line on why they should come." />
        </div>
        <div className="space-y-1.5">
          <Label>When they tap it, open</Label>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="shop">Your shop page</SelectItem>
              {(products ?? []).filter((p) => p.isVisible).map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Preview */}
      <div className="space-y-1.5">
        <p className="text-small font-medium text-text-muted">Preview</p>
        <div className="flex items-start gap-3 rounded-2xl bg-neutral-900 p-3 text-white shadow-floating">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary">
            <BellRing className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-small text-white/60">Listee · now</p>
            <p className="text-caption font-semibold">
              {business?.name ?? 'Your shop'}: {title.trim() || 'Your title'}
            </p>
            {body.trim() && <p className="text-small text-white/80">{body.trim()}</p>}
          </div>
        </div>
      </div>

      <Button
        className="w-full"
        size="lg"
        leftIcon={<Send className="size-4" />}
        disabled={!canSend}
        onClick={() => setConfirming(true)}
      >
        {count > 0 ? `Send to ${count} ${count === 1 ? 'customer' : 'customers'}` : 'Nobody to send to yet'}
      </Button>
      <p className="flex items-start gap-1.5 text-small text-text-muted">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Only your followers and customers can get it. Nothing is sent between 10 PM and 8 AM.
      </p>

      {data.recent.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-body font-semibold text-foreground">Sent recently</h2>
          {data.recent.map((c) => (
            <Card key={c.id} padding="sm" className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-caption font-semibold text-foreground">{c.title}</p>
                <p className="text-small text-text-muted">
                  {c.audience} · {c.recipients} customers · {c.reachable} on phone
                  {c.sentAt && ` · ${new Date(c.sentAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}`}
                </p>
              </div>
            </Card>
          ))}
        </section>
      )}

      <ConfirmationDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Send to ${count} customers?`}
        description={`“${title.trim()}” goes out now and uses ${count} of your monthly reach.`}
        confirmLabel="Send now"
        isLoading={send.isPending}
        onConfirm={() => void doSend()}
      />
    </div>
  )
}

/**
 * The chosen group as a scrolling list: name, email and phone (masked unless
 * the plan shows them in full), how many notifications each got this month.
 * Tick people to send only to them; the next 30 load as you scroll.
 */
function CustomerPicker({
  audience,
  masked,
  picked,
  onChange,
}: {
  audience: PushAudience
  masked: boolean
  picked: Set<string>
  onChange: (next: Set<string>) => void
}) {
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  useEffect(() => {
    const id = setTimeout(() => setQuery(search.trim()), 300)
    return () => clearTimeout(id)
  }, [search])

  const list = usePushCustomers(audience, query)
  const customers = list.data?.pages.flatMap((p) => p.customers) ?? []
  const total = list.data?.pages[0]?.total ?? 0

  function toggle(id: string, on: boolean) {
    const next = new Set(picked)
    if (on) next.add(id)
    else next.delete(id)
    onChange(next)
  }

  function onScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80 && list.hasNextPage && !list.isFetchingNextPage) {
      void list.fetchNextPage()
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-caption font-medium text-foreground">
          Customers <span className="font-normal text-text-muted">({total})</span>
        </p>
        {picked.size > 0 ? (
          <button type="button" onClick={() => onChange(new Set())} className="text-small font-semibold text-primary hover:underline">
            Clear {picked.size} picked
          </button>
        ) : (
          <span className="text-small text-text-muted">Tick to send only to them</span>
        )}
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" aria-hidden />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={masked ? 'Search by name' : 'Search name, email or phone'}
          aria-label="Search customers"
          className="pl-9"
        />
      </div>
      <div onScroll={onScroll} className="max-h-72 overflow-y-auto rounded-2xl border border-border">
        {list.isLoading ? (
          <div className="flex justify-center p-6">
            <Spinner size={20} label="Loading customers" />
          </div>
        ) : customers.length === 0 ? (
          <p className="p-4 text-center text-small text-text-muted">{query ? 'No one matches.' : 'Nobody in this group yet.'}</p>
        ) : (
          <ul className="divide-y divide-border">
            {customers.map((c) => (
              <li key={c.id}>
                <label className={cn('flex items-start gap-3 px-3 py-2.5', c.capped ? 'opacity-60' : 'cursor-pointer hover:bg-surface-muted')}>
                  <Checkbox
                    className="mt-0.5"
                    checked={picked.has(c.id)}
                    disabled={c.capped}
                    onCheckedChange={(v) => toggle(c.id, v === true)}
                    aria-label={`Pick ${c.name}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-caption font-semibold text-foreground">{c.name}</span>
                      {c.onPhone && <Smartphone className="size-3 shrink-0 text-success" aria-label="Notifications on" />}
                    </span>
                    {c.email && (
                      <span className="flex items-center gap-1 truncate text-small text-text-muted">
                        <Mail className="size-3 shrink-0" aria-hidden /> {c.email}
                      </span>
                    )}
                    {c.phone && (
                      <span className="flex items-center gap-1 text-small text-text-muted">
                        <Phone className="size-3 shrink-0" aria-hidden /> {c.phone}
                      </span>
                    )}
                  </span>
                  <Badge tone={c.capped ? 'warning' : 'neutral'} size="sm" className="shrink-0">
                    {c.capped ? 'Limit reached' : `${c.sentThisMonth} this month`}
                  </Badge>
                </label>
              </li>
            ))}
          </ul>
        )}
        {list.isFetchingNextPage && (
          <div className="flex justify-center p-3">
            <Spinner size={16} label="Loading more" />
          </div>
        )}
      </div>
      {masked && <p className="text-small text-text-muted">Email and phone are partly hidden on your plan.</p>}
    </div>
  )
}
