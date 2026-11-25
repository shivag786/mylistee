import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Gift, Plus, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { apiClient } from '@/services/apiClient'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/utils/toast'
import { cn } from '@/utils/cn'

interface AiPack {
  id: string
  name: string
  answers: number
  price: number
  perAnswer: number | null
  isActive: boolean
  position: number
}

interface ShopUsage {
  id: string
  name: string
  city: string | null
  plan: string | null
  planLimit: number | null
  planUsed: number
  addonUsed: number
  scans: number
  calls: number
  credits: number
  lastUsed: string | null
}

interface AiAdmin {
  enabled: boolean
  provider: string
  model: string | null
  ideasPerAnswer: number
  today: number
  month: number
  bySource: { plan: number; addon: number; scan: number; system: number; refresh: number }
  daily: { day: string; calls: number }[]
  shops: ShopUsage[]
  packs: AiPack[]
  packSales: { monthCount: number; monthAmount: number; totalAmount: number; creditsOutstanding: number }
}

const KEY = ['admin', 'ai'] as const
const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.')

/**
 * Admin → AI usage & packs: who uses how much AI, calls per day (to watch the
 * provider's free daily quota), the add-on packs sold with Razorpay, and how
 * many ideas one AI answer holds. The answers each plan gets a month are set
 * on the plan (Plans → Limits → AI answers / month).
 */
export function AdminAiPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: KEY,
    queryFn: () => apiClient.get<AiAdmin>('admin/ai'),
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Spinner size={32} label="Loading AI usage" />
      </div>
    )
  }
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-title font-bold text-foreground">AI usage &amp; packs</h1>
        <p className="text-caption text-text-secondary">
          {data.enabled ? `AI is on · ${data.provider === 'openai' ? 'OpenAI' : 'Google Gemini'}${data.model ? ` · ${data.model}` : ''}` : 'AI is switched off (Settings → AI assistant).'}{' '}
          · Monthly AI answers per plan are set in{' '}
          <a href={ROUTES.admin.plans} className="font-medium text-primary hover:underline">
            Plans
          </a>
          .
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="AI calls today" value={String(data.today)} />
        <Tile label="AI calls this month" value={String(data.month)} />
        <Tile label="Pack sales this month" value={inr(data.packSales.monthAmount)} hint={`${data.packSales.monthCount} packs · ${inr(data.packSales.totalAmount)} all time`} />
        <Tile label="Bought answers not used yet" value={String(data.packSales.creditsOutstanding)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <DailyCalls daily={data.daily} />
        <Card elevation="soft" padding="lg" className="space-y-3">
          <p className="text-caption font-semibold text-foreground">This month by type</p>
          <ul className="space-y-2 text-caption">
            <SourceRow label="Owner answers from plan" value={data.bySource.plan} />
            <SourceRow label="Owner answers from bought packs" value={data.bySource.addon} />
            <SourceRow label="Menu scans" value={data.bySource.scan} />
            <SourceRow label="Nightly AI ideas" value={data.bySource.system} />
            <SourceRow label="Ideas refreshed by owners" value={data.bySource.refresh} />
          </ul>
          <IdeasPerAnswer current={data.ideasPerAnswer} />
        </Card>
      </div>

      <Packs packs={data.packs} />
      <Shops shops={data.shops} />
    </div>
  )
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card elevation="soft" padding="md" className="space-y-1">
      <p className="text-small text-text-secondary">{label}</p>
      <p className="text-title font-bold text-foreground">{value}</p>
      {hint && <p className="text-small text-text-muted">{hint}</p>}
    </Card>
  )
}

function SourceRow({ label, value }: { label: string; value: number }) {
  return (
    <li className="flex justify-between gap-2">
      <span className="text-text-secondary">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </li>
  )
}

/** One series: AI calls per day for 14 days (watch the provider's daily quota). */
function DailyCalls({ daily }: { daily: AiAdmin['daily'] }) {
  const max = Math.max(1, ...daily.map((d) => d.calls))
  const label = (day: string) => new Date(day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

  return (
    <Card elevation="soft" padding="lg" className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-caption font-semibold text-foreground">AI calls per day</p>
        <p className="text-small text-text-muted">last 14 days · highest {max}</p>
      </div>
      <div className="flex h-40 items-end gap-1.5 border-b border-border" role="img" aria-label="AI calls per day for the last 14 days">
        {daily.map((d) => (
          <div key={d.day} className="group relative flex h-full flex-1 items-end" title={`${label(d.day)}: ${d.calls} calls`}>
            <div
              className="w-full rounded-t-[4px] bg-primary/80 transition-colors group-hover:bg-primary"
              style={{ height: `${d.calls === 0 ? 0 : Math.max(3, (d.calls / max) * 100)}%` }}
            />
            <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] text-background group-hover:block">
              {label(d.day)} · {d.calls}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-text-muted">
        <span>{label(daily[0]?.day ?? '')}</span>
        <span>Today</span>
      </div>
      <table className="sr-only">
        <caption>AI calls per day</caption>
        <tbody>
          {daily.map((d) => (
            <tr key={d.day}>
              <th scope="row">{d.day}</th>
              <td>{d.calls}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

function IdeasPerAnswer({ current }: { current: number }) {
  const qc = useQueryClient()
  const [value, setValue] = useState(String(current))
  const save = useMutation({
    mutationFn: () => apiClient.put('admin/ai/settings', { ideasPerAnswer: Number(value) }),
    onSuccess: () => {
      toast.success('Saved')
      void qc.invalidateQueries({ queryKey: KEY })
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  return (
    <div className="space-y-1.5 border-t border-border pt-3">
      <Label htmlFor="ideas-per-answer">Ideas in one AI answer</Label>
      <div className="flex gap-2">
        <Input id="ideas-per-answer" type="number" min={1} max={10} value={value} onChange={(e) => setValue(e.target.value)} className="h-10 w-24" />
        <Button size="sm" variant="outline" onClick={() => save.mutate()} isLoading={save.isPending} disabled={Number(value) === current}>
          Save
        </Button>
      </div>
      <p className="text-small text-text-muted">Offer ideas, combos, messages and AI growth ideas give this many at a time (1–10).</p>
    </div>
  )
}

function Packs({ packs }: { packs: AiPack[] }) {
  const qc = useQueryClient()
  const [draft, setDraft] = useState({ name: '', answers: '', price: '' })
  const refresh = () => void qc.invalidateQueries({ queryKey: KEY })

  const add = useMutation({
    mutationFn: () => apiClient.post('admin/ai/packs', { name: draft.name.trim(), answers: Number(draft.answers), price: Number(draft.price) }),
    onSuccess: () => {
      toast.success('AI pack added')
      setDraft({ name: '', answers: '', price: '' })
      refresh()
    },
    onError: (e) => toast.error(errMsg(e)),
  })
  const update = useMutation({
    mutationFn: (p: { id: string; body: Partial<{ isActive: boolean; name: string; answers: number; price: number }> }) =>
      apiClient.patch(`admin/ai/packs/${p.id}`, p.body),
    onSuccess: refresh,
    onError: (e) => toast.error(errMsg(e)),
  })
  const remove = useMutation({
    mutationFn: (id: string) => apiClient.delete(`admin/ai/packs/${id}`),
    onSuccess: () => {
      toast.success('AI pack deleted')
      refresh()
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  const canAdd = draft.name.trim() !== '' && Number(draft.answers) > 0 && Number(draft.price) > 0

  return (
    <Card elevation="soft" padding="lg" className="space-y-4">
      <div>
        <p className="text-body font-semibold text-foreground">Add-on packs</p>
        <p className="text-small text-text-secondary">
          Shops buy these with Razorpay when their monthly AI answers run out. Bought answers are used after the plan’s and never expire.
        </p>
      </div>

      {packs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-caption">
            <thead>
              <tr className="border-b border-border text-left text-small text-text-secondary">
                <th className="py-2 font-medium">Pack</th>
                <th className="py-2 text-right font-medium">Answers</th>
                <th className="py-2 text-right font-medium">Price</th>
                <th className="py-2 text-right font-medium">Per answer</th>
                <th className="py-2 text-center font-medium">On sale</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {packs.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="py-2.5 font-medium text-foreground">{p.name}</td>
                  <td className="py-2.5 text-right">{p.answers}</td>
                  <td className="py-2.5 text-right">{inr(p.price)}</td>
                  <td className="py-2.5 text-right text-text-secondary">{p.perAnswer !== null ? inr(p.perAnswer) : '—'}</td>
                  <td className="py-2.5 text-center">
                    <Switch
                      checked={p.isActive}
                      aria-label={`${p.name} on sale`}
                      onCheckedChange={(v) => update.mutate({ id: p.id, body: { isActive: v } })}
                    />
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      aria-label={`Delete ${p.name}`}
                      className="rounded-md p-1.5 text-text-muted hover:bg-surface-muted hover:text-destructive"
                      onClick={() => window.confirm(`Delete “${p.name}”? Shops that bought it keep their answers.`) && remove.mutate(p.id)}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-[1fr_120px_120px_auto] sm:items-end">
        <div className="space-y-1">
          <Label htmlFor="pack-name">Pack name</Label>
          <Input id="pack-name" placeholder="e.g. 100 AI answers" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pack-answers">Answers</Label>
          <Input id="pack-answers" type="number" min={1} value={draft.answers} onChange={(e) => setDraft({ ...draft, answers: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pack-price">Price (₹)</Label>
          <Input id="pack-price" type="number" min={1} value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
        </div>
        <Button size="md" leftIcon={<Plus className="size-4" />} onClick={() => add.mutate()} isLoading={add.isPending} disabled={!canAdd}>
          Add pack
        </Button>
      </div>
    </Card>
  )
}

function Shops({ shops }: { shops: ShopUsage[] }) {
  const qc = useQueryClient()
  const [giving, setGiving] = useState<ShopUsage | null>(null)
  const [answers, setAnswers] = useState('')
  const [note, setNote] = useState('')
  const give = useMutation({
    mutationFn: () => apiClient.post<{ credits: number }>('admin/ai/credits', { businessId: giving?.id, answers: Number(answers), note: note.trim() || null }),
    onSuccess: (r) => {
      toast.success(`${giving?.name} now has ${r.credits} bought answers`)
      setGiving(null)
      setAnswers('')
      setNote('')
      void qc.invalidateQueries({ queryKey: KEY })
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  return (
    <Card elevation="soft" padding="lg" className="space-y-3">
      <div>
        <p className="text-body font-semibold text-foreground">Shops using AI this month</p>
        <p className="text-small text-text-secondary">Most active first. “Give” adds free answers to a shop (a negative number takes them back).</p>
      </div>
      {shops.length === 0 ? (
        <p className="py-6 text-center text-caption text-text-muted">No shop has used AI this month yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-caption">
            <thead>
              <tr className="border-b border-border text-left text-small text-text-secondary">
                <th className="py-2 font-medium">Shop</th>
                <th className="py-2 font-medium">Plan</th>
                <th className="py-2 text-right font-medium">Plan answers used</th>
                <th className="py-2 text-right font-medium">Pack answers used</th>
                <th className="py-2 text-right font-medium">Bought left</th>
                <th className="py-2 text-right font-medium">Menu scans</th>
                <th className="py-2 text-right font-medium">Last used</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {shops.map((s) => {
                const full = s.planLimit !== null && s.planUsed >= s.planLimit
                return (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="py-2.5">
                      <p className="font-medium text-foreground">{s.name}</p>
                      {s.city && <p className="text-small text-text-muted">{s.city}</p>}
                    </td>
                    <td className="py-2.5 text-text-secondary">{s.plan ?? '—'}</td>
                    <td className={cn('py-2.5 text-right', full && 'font-semibold text-warning')}>
                      {s.planUsed} / {s.planLimit ?? '∞'}
                    </td>
                    <td className="py-2.5 text-right">{s.addonUsed}</td>
                    <td className="py-2.5 text-right">{s.credits}</td>
                    <td className="py-2.5 text-right">{s.scans}</td>
                    <td className="py-2.5 text-right text-text-secondary">
                      {s.lastUsed ? new Date(s.lastUsed).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                    <td className="py-2.5 text-right">
                      <Button size="sm" variant="ghost" leftIcon={<Gift className="size-4" />} onClick={() => setGiving(s)}>
                        Give
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {giving && (
        <div className="space-y-3 rounded-xl border border-border bg-surface-muted p-4">
          <p className="text-caption font-semibold text-foreground">Give AI answers to {giving.name}</p>
          <div className="grid gap-3 sm:grid-cols-[120px_1fr_auto_auto] sm:items-end">
            <div className="space-y-1">
              <Label htmlFor="give-answers">Answers</Label>
              <Input id="give-answers" type="number" value={answers} onChange={(e) => setAnswers(e.target.value)} placeholder="25" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="give-note">Note (optional)</Label>
              <Input id="give-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Launch gift" />
            </div>
            <Button size="md" onClick={() => give.mutate()} isLoading={give.isPending} disabled={!Number(answers)}>
              Save
            </Button>
            <Button size="md" variant="ghost" onClick={() => setGiving(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
