import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BellRing,
  CalendarDays,
  Check,
  Clock,
  Lightbulb,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SegmentedControl } from '@/components/navigation/SegmentedControl'
import { ErrorState } from '@/components/feedback/ErrorState'
import { SkeletonList } from '@/components/feedback/skeletons'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { cn } from '@/utils/cn'
import { productKeys } from '@/features/owner/hooks/useProducts'
import {
  aiAdvisorService,
  type AdvisorEdits,
  type AdvisorKind,
  type AdvisorState,
  type AdvisorSuggestion,
} from '@/features/owner/services/aiAdvisorService'

const TYPE_LABEL: Record<string, string> = {
  percent: '% off',
  flat: '₹ off',
  combo: 'Combo',
  bogo: 'Buy & get free',
  happy_hour: 'Happy hour',
  win_back: 'Win back',
  first_order: 'First order',
  loyalty: 'Loyalty',
  review_request: 'Reviews',
  slow_hour_push: 'Slow hours',
  item_highlight: 'Item highlight',
}

const SEGMENT_LABEL: Record<string, string> = {
  everyone: 'Followers + customers',
  followers: 'Followers',
  customers: 'Past customers',
  lapsed: 'Not ordered in 30 days',
}

const DAY: Record<string, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' }

const hour = (h: number) => `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`
const rupees = (n: number | null | undefined) => `₹${Math.round(Number(n ?? 0)).toLocaleString('en-IN')}`
const time12 = (t?: string | null) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'AM' : 'PM'}`
}

/**
 * AI Growth Advisor — two tabs:
 *  • Sales ideas (AI Sales Manager): offers, combos and discounts from the
 *    last 30 days of sales.
 *  • Customer growth: win-back, first order, loyalty and review campaigns
 *    sent as a push notification.
 * Every idea shows the numbers behind it and the safety fixes applied; nothing
 * goes live until the owner approves it.
 */
export function AiAdvisorPage() {
  usePageTitle('AI growth advisor')
  const [kind, setKind] = useState<AdvisorKind>('sales')
  const qc = useQueryClient()
  const key = ['owner', 'ai-advisor', kind]
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: key, queryFn: () => aiAdvisorService.get(kind) })

  const refresh = useMutation({
    mutationFn: () => aiAdvisorService.refresh(kind),
    onSuccess: (res) => {
      toast.success(`${res.suggestions.length} new ideas ready`)
      void qc.invalidateQueries({ queryKey: key })
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Could not get new ideas. Try again later.'),
  })

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="inline-flex items-center gap-2 text-title font-bold text-foreground">
            <Sparkles className="size-6 text-primary" aria-hidden /> AI growth advisor
          </h1>
          <p className="text-caption text-text-secondary">
            Ideas from your own sales and customers. Nothing goes live until you approve it.
          </p>
        </div>
        {data?.available && data.inPlan && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={cn('size-4', refresh.isPending && 'animate-spin')} />}
            isLoading={refresh.isPending}
            disabled={data.refreshesLeft === 0}
            onClick={() => refresh.mutate()}
          >
            Refresh ideas ({data.refreshesLeft} left today)
          </Button>
        )}
      </header>

      <SegmentedControl<AdvisorKind>
        ariaLabel="Sales or customers"
        options={[
          { value: 'sales', label: 'Sales ideas' },
          { value: 'growth', label: 'Customer growth' },
        ]}
        value={kind}
        onChange={setKind}
      />

      {isLoading ? (
        <SkeletonList rows={3} />
      ) : isError || !data ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <AdvisorBody data={data} refreshing={refresh.isPending} onRefresh={() => refresh.mutate()} />
      )}
    </div>
  )
}

function AdvisorBody({ data, refreshing, onRefresh }: { data: AdvisorState; refreshing: boolean; onRefresh: () => void }) {
  if (!data.available) {
    return <Notice icon={Sparkles} text="AI ideas are switched off right now. Please check back later." />
  }
  if (!data.inPlan) {
    return <Notice icon={ShieldCheck} text="The AI assistant is not in your plan. Upgrade your plan to get AI sales and customer ideas." />
  }

  return (
    <div className="space-y-4">
      {data.stats && <StatsCard kind={data.kind} stats={data.stats} generatedAt={data.generatedAt} />}

      {data.suggestions.length === 0 ? (
        <Card padding="lg" className="space-y-3 text-center">
          <Lightbulb className="mx-auto size-10 text-primary" aria-hidden />
          <p className="text-body font-semibold text-foreground">No new ideas right now</p>
          <p className="text-caption text-text-secondary">
            Fresh ideas arrive every night. Want some now? Tap below — it takes a few seconds.
          </p>
          <Button className="mx-auto" isLoading={refreshing} disabled={data.refreshesLeft === 0} onClick={onRefresh} leftIcon={<Sparkles className="size-5" />}>
            Get ideas now
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.suggestions.map((s) => (
            <SuggestionCard key={s.id} s={s} />
          ))}
        </div>
      )}

      {data.history.length > 0 && (
        <section className="space-y-2 pt-2">
          <h2 className="text-body font-bold text-foreground">Earlier ideas</h2>
          {data.history.map((s) => (
            <HistoryRow key={s.id} s={s} />
          ))}
        </section>
      )}
    </div>
  )
}

function Notice({ icon: Icon, text }: { icon: typeof Sparkles; text: string }) {
  return (
    <Card padding="lg" className="flex items-start gap-3">
      <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
      <p className="text-caption text-text-secondary">{text}</p>
    </Card>
  )
}

function StatsCard({ kind, stats, generatedAt }: { kind: AdvisorKind; stats: AdvisorState['stats']; generatedAt: string | null }) {
  if (!stats) return null
  const tiles =
    kind === 'sales'
      ? [
          ['Orders', String(stats.orders ?? 0)],
          ['Revenue', rupees(stats.revenue)],
          ['Avg. bill', rupees(stats.aov)],
          ['Top pair', stats.topPairs?.[0] ? `${stats.topPairs[0].a} + ${stats.topPairs[0].b}` : '—'],
        ]
      : [
          ['Customers', String(stats.uniqueCustomers ?? 0)],
          ['Come back', `${stats.repeatRatePercent ?? 0}%`],
          ['Lapsed', String(stats.lapsedCustomers ?? 0)],
          ['Busiest', (stats.peakHours ?? []).slice(0, 2).map(hour).join(', ') || '—'],
        ]
  return (
    <Card padding="md" className="space-y-2">
      <p className="flex items-center gap-1.5 text-small font-semibold text-text-secondary">
        <TrendingUp className="size-4 text-primary" aria-hidden /> Your last {stats.windowDays ?? 30} days
        {generatedAt && <span className="font-normal text-text-muted">· ideas from {new Date(generatedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tiles.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-surface-muted/70 px-3 py-2">
            <p className="text-small text-text-muted">{label}</p>
            <p className="truncate text-body font-bold text-foreground" title={value}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}

function describe(s: AdvisorSuggestion): string[] {
  const d = s.details
  const out: string[] = []
  if (s.kind === 'sales') {
    const qty = (id: number) => Number(d.quantities?.[String(id)] ?? 1)
    if (s.products.length) out.push(s.products.map((p) => `${qty(p.id) > 1 ? `${qty(p.id)} × ` : ''}${p.name} (${rupees(p.price)})`).join(', '))
    if (s.type === 'combo') out.push(`Combo price ${rupees(d.value)} instead of ${rupees(d.itemsTotal)}`)
    else if (s.type === 'bogo') out.push(`Buy ${d.buyQty} get ${d.getQty} free`)
    else if (s.type === 'flat') out.push(`${rupees(d.value)} off${s.products.length ? ' each' : ' the bill'}`)
    else out.push(`${d.value}% off${s.products.length ? '' : ' the bill'}`)
    if (d.minOrder) out.push(`Minimum bill ${rupees(d.minOrder)}`)
    if (d.timeFrom) out.push(`${time12(d.timeFrom)} – ${time12(d.timeTo)}`)
    if (d.days?.length) out.push(d.days.map((x) => DAY[x] ?? x).join(', '))
    out.push(`For ${d.validityDays} days`)
  } else {
    out.push(`To: ${SEGMENT_LABEL[d.segment ?? 'everyone']}`)
    if (d.offer) out.push(`Coupon: ${d.offer.kind === 'flat' ? `${rupees(d.offer.value)} off` : `${d.offer.value}% off`}${d.offer.minOrder ? ` above ${rupees(d.offer.minOrder)}` : ''}, ${d.offer.validityDays} days`)
    if (d.sendTime) out.push(`Best time ${time12(d.sendTime)}`)
  }
  return out
}

function SuggestionCard({ s }: { s: AdvisorSuggestion }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(s.title)
  const [message, setMessage] = useState(s.message ?? '')
  const [value, setValue] = useState(String(s.kind === 'growth' ? (s.details.offer?.value ?? '') : (s.details.value ?? '')))
  const [validity, setValidity] = useState(String(s.details.validityDays ?? s.details.offer?.validityDays ?? 7))
  const d = s.details

  const done = async () => {
    await qc.invalidateQueries({ queryKey: ['owner', 'ai-advisor'] })
    void qc.invalidateQueries({ queryKey: productKeys.products })
  }
  const approve = useMutation({
    mutationFn: (extra: AdvisorEdits) => {
      const edits: AdvisorEdits = { ...extra }
      if (editing) {
        edits.title = title
        edits.message = message
        if (s.kind === 'sales') {
          if (value !== '') edits.value = Number(value)
          edits.validityDays = Number(validity) || 7
        } else if (d.offer && value !== '') {
          edits.offer = { type: d.offer.kind, value: Number(value), minOrder: d.offer.minOrder, validityDays: Number(validity) || d.offer.validityDays }
        }
      }
      return aiAdvisorService.approve(s.id, edits)
    },
    onSuccess: async (res) => {
      toast.success('Approved', res.result?.summary)
      await done()
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Could not approve. Please try again.'),
  })
  const dismiss = useMutation({
    mutationFn: () => aiAdvisorService.dismiss(s.id),
    onSuccess: done,
  })

  const Icon = s.kind === 'growth' ? (s.type === 'review_request' ? Users : BellRing) : Lightbulb

  return (
    <Card padding="md" className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-small font-bold uppercase tracking-wide text-primary">{TYPE_LABEL[s.type] ?? s.type}</p>
          <h3 className="text-body font-bold text-foreground">{s.title}</h3>
          {(d.expectedImpact || d.expectedResult) && (
            <p className="text-small font-semibold text-success">Expected: {d.expectedImpact || d.expectedResult}</p>
          )}
        </div>
      </div>

      {editing ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`t-${s.id}`}>Title</Label>
            <Input id={`t-${s.id}`} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`m-${s.id}`}>{s.kind === 'growth' ? 'Notification text' : 'Message for customers'}</Label>
            <Textarea id={`m-${s.id}`} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={s.kind === 'growth' ? 180 : 300} rows={3} />
            {s.kind === 'growth' && d.offer && <p className="text-small text-text-muted">Write {'{CODE}'} where the coupon code should appear.</p>}
          </div>
          {(s.kind === 'sales' ? s.type !== 'bogo' : Boolean(d.offer)) && (
            <div className="space-y-1.5">
              <Label htmlFor={`v-${s.id}`}>
                {s.type === 'combo' ? 'Combo price (₹)' : (s.kind === 'growth' ? d.offer?.kind : s.type) === 'flat' ? '₹ off' : '% off'}
              </Label>
              <Input id={`v-${s.id}`} inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value.replace(/[^\d.]/g, ''))} />
            </div>
          )}
          {(s.kind === 'sales' || d.offer) && (
            <div className="space-y-1.5">
              <Label htmlFor={`d-${s.id}`}>Runs for (days)</Label>
              <Input id={`d-${s.id}`} inputMode="numeric" value={validity} onChange={(e) => setValidity(e.target.value.replace(/\D/g, ''))} />
            </div>
          )}
          <p className="text-small text-text-muted sm:col-span-2">Safety limits still apply: at most 30% off, combos at least 80% of the items’ price.</p>
        </div>
      ) : (
        <>
          {s.message && (
            <div className="rounded-2xl bg-surface-muted/70 px-4 py-3">
              {s.kind === 'growth' && d.pushTitle && <p className="text-caption font-bold text-foreground">{d.pushTitle}</p>}
              <p className="text-caption text-foreground">“{s.message}”</p>
            </div>
          )}
          <ul className="flex flex-wrap gap-1.5">
            {describe(s).map((t) => (
              <li key={t} className="rounded-full border border-border px-2.5 py-1 text-small text-text-secondary">
                {t}
              </li>
            ))}
          </ul>
        </>
      )}

      {s.reasoning && (
        <p className="flex gap-2 text-small text-text-secondary">
          <TrendingUp className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span>
            <span className="font-semibold text-foreground">Why: </span>
            {s.reasoning}
          </span>
        </p>
      )}
      {(d.adjustments?.length ?? 0) > 0 && (
        <ul className="space-y-1 rounded-xl bg-warning/10 px-3 py-2 text-small text-foreground">
          {d.adjustments?.map((a) => (
            <li key={a} className="flex gap-1.5">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden /> {a}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="ghost" size="sm" leftIcon={<X className="size-4" />} onClick={() => dismiss.mutate()} disabled={approve.isPending} isLoading={dismiss.isPending}>
          Not now
        </Button>
        <Button variant="outline" size="sm" leftIcon={<Pencil className="size-4" />} onClick={() => setEditing((e) => !e)} disabled={approve.isPending}>
          {editing ? 'Done editing' : 'Edit'}
        </Button>
        {s.kind === 'growth' && (
          <Button variant="outline" size="sm" leftIcon={<BellRing className="size-4" />} isLoading={approve.isPending} onClick={() => approve.mutate({ sendNow: true })}>
            Approve & send now
          </Button>
        )}
        <Button size="sm" leftIcon={s.kind === 'growth' ? <Clock className="size-4" /> : <Check className="size-4" />} isLoading={approve.isPending} onClick={() => approve.mutate({})}>
          {s.kind === 'growth' ? `Approve${d.sendTime ? ` · send ${time12(d.sendTime)}` : ''}` : 'Approve & go live'}
        </Button>
      </div>
    </Card>
  )
}

function HistoryRow({ s }: { s: AdvisorSuggestion }) {
  const push = s.result?.push
  const status =
    s.status === 'dismissed'
      ? 'Skipped'
      : s.kind === 'growth'
        ? push?.status === 'sent'
          ? `Sent to ${push.recipients ?? 0}`
          : push?.status === 'failed'
            ? `Not sent: ${push.error ?? ''}`
            : s.sendAt
              ? `Sends ${new Date(s.sendAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}`
              : 'Approved'
        : 'Live'
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-surface px-4 py-3">
      <CalendarDays className="size-4 shrink-0 text-text-muted" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-caption font-semibold text-foreground">{s.title}</p>
        <p className="truncate text-small text-text-muted">
          {s.result?.coupon ? `Coupon ${s.result.coupon} · ` : ''}
          {s.result?.summary ?? ''}
        </p>
      </div>
      <span
        className={cn(
          'shrink-0 rounded-full px-2.5 py-0.5 text-small font-semibold',
          s.status === 'dismissed' ? 'bg-surface-muted text-text-muted' : push?.status === 'failed' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success',
        )}
      >
        {status}
      </span>
    </div>
  )
}
