import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  LayoutGrid,
  Loader2,
  Phone,
  Plus,
  RotateCw,
  Save,
  Settings2,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { bookingService } from '@/features/booking/bookingService'
import { FloorLegend, FloorPlan, tableKey } from '@/features/booking/FloorPlan'
import {
  AREA_KINDS,
  OCCASIONS,
  STATUS_LABEL,
  TABLE_TAGS,
  type AdvanceMode,
  type Booking,
  type BookingAddon,
  type BookingSettings,
  type FloorArea,
  type FloorTable,
  type TableShape,
} from '@/features/booking/bookingTypes'

type Tab = 'bookings' | 'floor' | 'settings'
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const t12 = (hm: string) => {
  const [h, m] = hm.split(':').map(Number)
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`
}
const err = (e: unknown, fallback: string) => toast.error(e instanceof ApiError ? e.message : fallback)

/** Table bookings for the shop: today's bookings, the floor plan and the rules. */
export function OwnerBookingsPage() {
  const [tab, setTab] = useState<Tab>('bookings')
  const settings = useQuery({ queryKey: ['owner', 'booking-settings'], queryFn: () => bookingService.settings() })
  const floor = useQuery({ queryKey: ['owner', 'booking-floor'], queryFn: () => bookingService.floor() })
  const placedAreas = (floor.data ?? []).filter((a) => a.kind !== 'unplaced')

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-title font-bold text-foreground">Table bookings</h1>
          <p className="text-caption text-text-secondary">Customers book a table from home — you decide every rule.</p>
        </div>
        {settings.data && (
          <span className={`rounded-full px-3 py-1 text-small font-semibold ${settings.data.enabled ? 'bg-success-soft text-success' : 'bg-surface-muted text-text-secondary'}`}>
            {settings.data.enabled ? '● Booking is ON' : '○ Booking is OFF'}
          </span>
        )}
      </header>

      {settings.data && !settings.data.enabled && (
        <Card padding="md" className="flex flex-wrap items-center gap-3 border-amber-300 bg-amber-50">
          <span className="text-2xl">🪑</span>
          <p className="flex-1 text-small text-amber-900">
            {placedAreas.length === 0 ? 'Start by drawing your floor plan, then switch booking on in Settings.' : 'Your floor plan is ready. Switch booking on in Settings so customers can book.'}
          </p>
          <Button size="sm" onClick={() => setTab(placedAreas.length === 0 ? 'floor' : 'settings')}>{placedAreas.length === 0 ? 'Draw floor plan' : 'Open settings'}</Button>
        </Card>
      )}

      <div className="flex gap-1 rounded-full bg-surface-muted p-1">
        {(
          [
            ['bookings', 'Bookings', CalendarDays],
            ['floor', 'Floor plan', LayoutGrid],
            ['settings', 'Settings', Settings2],
          ] as const
        ).map(([k, label, Icon]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-caption font-semibold transition ${tab === k ? 'bg-surface text-foreground shadow-sm' : 'text-text-secondary'}`}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'bookings' && <BookingsTab areas={placedAreas} />}
      {tab === 'floor' && floor.data && <FloorEditor initial={floor.data} />}
      {tab === 'settings' && settings.data && <SettingsTab initial={settings.data} />}
      {(floor.isLoading || settings.isLoading) && <Loader2 className="size-6 animate-spin text-primary" />}
    </div>
  )
}

/* ================================================================== */
/* Bookings                                                            */
/* ================================================================== */
const STATUS_TONE: Record<Booking['status'], string> = {
  pending: 'bg-amber-100 text-amber-800 ring-amber-300',
  confirmed: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
  seated: 'bg-sky-100 text-sky-800 ring-sky-300',
  completed: 'bg-gray-100 text-gray-700 ring-gray-200',
  declined: 'bg-rose-100 text-rose-700 ring-rose-200',
  cancelled: 'bg-gray-100 text-gray-500 ring-gray-200',
  no_show: 'bg-gray-100 text-gray-500 ring-gray-200',
}

function BookingsTab({ areas }: { areas: FloorArea[] }) {
  const qc = useQueryClient()
  const [date, setDate] = useState(() => ymd(new Date()))
  const [adding, setAdding] = useState(false)
  const [floorAt, setFloorAt] = useState(() => {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, '0')}:${String(Math.floor(d.getMinutes() / 30) * 30).padStart(2, '0')}`
  })
  const day = useQuery({ queryKey: ['owner', 'bookings', date], queryFn: () => bookingService.dayBookings(date), refetchInterval: 30_000 })
  const act = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) => bookingService.setStatus(id, status, reason),
    onSuccess: (b) => {
      toast.success(`Booking ${STATUS_LABEL[b.status].toLowerCase()}`)
      void qc.invalidateQueries({ queryKey: ['owner', 'bookings'] })
    },
    onError: (e) => err(e, 'Could not update the booking.'),
  })

  const shift = (n: number) => {
    const d = new Date(date + 'T00:00')
    d.setDate(d.getDate() + n)
    setDate(ymd(d))
  }
  const items = day.data?.items ?? []
  const live = items.filter((b) => ['pending', 'confirmed', 'seated'].includes(b.status))
  const covers = live.reduce((n, b) => n + b.guests, 0)

  // Tables held at the chosen time, for the floor view.
  const busyAt = useMemo(() => {
    const t = new Date(`${date}T${floorAt}:00`).getTime()
    const m = new Map<string, Booking>()
    for (const b of live) {
      if (new Date(b.startsAt).getTime() <= t && new Date(b.endsAt).getTime() > t) b.tables.forEach((x) => m.set(x.id, b))
    }
    return m
  }, [live, date, floorAt])
  const [viewArea, setViewArea] = useState<string | null>(null)
  const area = areas.find((a) => a.id === viewArea) ?? areas[0]

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => shift(-1)} aria-label="Previous day"><ChevronLeft className="size-4" /></Button>
          <Input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="h-10 w-44" />
          <Button variant="outline" size="sm" onClick={() => shift(1)} aria-label="Next day"><ChevronRight className="size-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => setDate(ymd(new Date()))}>Today</Button>
          <Button size="sm" className="ml-auto" leftIcon={<Plus className="size-4" />} onClick={() => setAdding(true)}>Phone / walk-in</Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Bookings" value={live.length} />
          <Stat label="Guests" value={covers} />
          <Stat label="Waiting for you" value={items.filter((b) => b.status === 'pending').length} tone="text-amber-600" />
        </div>

        {day.isLoading && <Loader2 className="size-6 animate-spin text-primary" />}
        {items.length === 0 && !day.isLoading && (
          <Card padding="lg" className="text-center text-text-secondary">No bookings for this day yet.</Card>
        )}
        {items.map((b) => (
          <Card key={b.id} padding="md" className={`space-y-2 ${['cancelled', 'declined', 'no_show'].includes(b.status) ? 'opacity-60' : ''}`}>
            <div className="flex flex-wrap items-start gap-3">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-400 text-center text-white">
                <span className="text-small font-extrabold leading-tight">{t12(b.time).replace(' ', '\n')}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground">
                  {b.name} {b.occasion && <span title={b.occasion}>{OCCASIONS.find((o) => o.value === b.occasion)?.emoji}</span>}
                </p>
                <p className="text-small text-text-secondary">
                  <Users className="mr-1 inline size-3.5" />
                  {b.guests} guests · Table {b.tables.map((t) => t.label).join(' + ')} · {b.area} · <span className="uppercase">{b.source}</span>
                </p>
                {b.occasionNote && <p className="text-small text-rose-700">“{b.occasionNote}”</p>}
                {b.addons.length > 0 && (
                  <p className="text-small text-text-secondary">{b.addons.map((a) => `${a.emoji ?? '✨'} ${a.name}${a.qty > 1 ? ` ×${a.qty}` : ''}`).join(' · ')}</p>
                )}
                {b.request && <p className="rounded-lg bg-surface-muted px-2 py-1 text-small">📝 {b.request}</p>}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${STATUS_TONE[b.status]}`}>{STATUS_LABEL[b.status]}</span>
                {b.advanceAmount > 0 && (
                  <span className="text-[11px] font-semibold text-text-secondary">
                    Advance ₹{b.advanceAmount} · {b.advanceStatus}
                  </span>
                )}
                <span className="font-mono text-[11px] text-text-muted">{b.code}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {b.phone && (
                <a href={`tel:${b.phone}`} className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-3 py-1.5 text-small font-medium"><Phone className="size-3.5" /> {b.phone}</a>
              )}
              {b.status === 'pending' && (
                <>
                  <Button size="sm" leftIcon={<Check className="size-4" />} onClick={() => act.mutate({ id: b.id, status: 'confirmed' })}>Confirm</Button>
                  <Button size="sm" variant="outline" leftIcon={<X className="size-4" />} onClick={() => {
                    const reason = window.prompt('Reason for the customer (optional)', 'Fully booked at this time') ?? undefined
                    act.mutate({ id: b.id, status: 'declined', reason })
                  }}>Decline</Button>
                </>
              )}
              {b.status === 'confirmed' && (
                <>
                  <Button size="sm" leftIcon={<UserCheck className="size-4" />} onClick={() => act.mutate({ id: b.id, status: 'seated' })}>Guests arrived</Button>
                  <Button size="sm" variant="outline" onClick={() => act.mutate({ id: b.id, status: 'no_show' })}>No-show</Button>
                  <Button size="sm" variant="ghost" onClick={() => window.confirm('Cancel this booking? A paid advance is refunded.') && act.mutate({ id: b.id, status: 'cancelled' })}>Cancel</Button>
                </>
              )}
              {b.status === 'seated' && <Button size="sm" variant="outline" onClick={() => act.mutate({ id: b.id, status: 'completed' })}>Done · table free</Button>}
            </div>
          </Card>
        ))}
      </div>

      {/* Floor at a time */}
      {area && (
        <div className="space-y-2 lg:sticky lg:top-4 lg:self-start">
          <div className="flex flex-wrap items-center gap-2">
            {areas.map((a) => (
              <button key={a.id} type="button" onClick={() => setViewArea(a.id)} className={`rounded-full px-3 py-1.5 text-small font-semibold ${area.id === a.id ? 'bg-foreground text-background' : 'bg-surface-muted'}`}>
                {AREA_KINDS.find((k) => k.value === a.kind)?.emoji} {a.name}
              </button>
            ))}
            <label className="ml-auto flex items-center gap-1 text-small text-text-secondary">
              at <Input type="time" step={1800} value={floorAt} onChange={(e) => setFloorAt(e.target.value)} className="h-9 w-28" />
            </label>
          </div>
          <div className="overflow-hidden rounded-3xl shadow-lg ring-1 ring-black/10">
            <FloorPlan area={area} mode="view" stateOf={(t) => (t.id && busyAt.has(t.id) ? 'booked' : 'free')} />
          </div>
          <FloorLegend />
        </div>
      )}

      {adding && <AddBookingDialog areas={areas} date={date} onClose={() => setAdding(false)} />}
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <Card padding="md">
      <p className="text-small text-text-secondary">{label}</p>
      <p className={`text-title font-bold tabular-nums ${tone ?? 'text-foreground'}`}>{value}</p>
    </Card>
  )
}

function AddBookingDialog({ areas, date, onClose }: { areas: FloorArea[]; date: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [f, setF] = useState({ date, time: '20:00', guests: 2, name: '', phone: '', source: 'phone' as 'phone' | 'walkin', occasion: '' })
  const [tables, setTables] = useState<string[]>([])
  const add = useMutation({
    mutationFn: () =>
      bookingService.addBooking({
        date: f.date,
        time: f.time,
        guests: f.guests,
        tableIds: tables,
        name: f.name.trim(),
        phone: f.phone.trim() || undefined,
        source: f.source,
        occasion: (f.occasion || null) as never,
      }),
    onSuccess: () => {
      toast.success('Booking added')
      void qc.invalidateQueries({ queryKey: ['owner', 'bookings'] })
      onClose()
    },
    onError: (e) => err(e, 'Could not add the booking.'),
  })
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal>
      <Card padding="lg" className="max-h-[90dvh] w-full max-w-lg space-y-3 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Add a phone / walk-in booking</h2>
          <button type="button" onClick={onClose} aria-label="Close"><X className="size-5" /></button>
        </div>
        <div className="flex gap-2">
          {(['phone', 'walkin'] as const).map((s) => (
            <button key={s} type="button" onClick={() => setF({ ...f, source: s })} className={`flex-1 rounded-xl border px-3 py-2 text-small font-semibold ${f.source === s ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}>
              {s === 'phone' ? '📞 Phone call' : '🚶 Walk-in'}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} aria-label="Date" />
          <Input type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} aria-label="Time" />
          <Input type="number" min={1} value={f.guests} onChange={(e) => setF({ ...f, guests: Math.max(1, Number(e.target.value) || 1) })} aria-label="Guests" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Guest name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <Input placeholder="Mobile (optional)" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        </div>
        <select value={f.occasion} onChange={(e) => setF({ ...f, occasion: e.target.value })} className="h-11 w-full rounded-input border border-border bg-surface px-3" aria-label="Occasion">
          <option value="">No occasion</option>
          {OCCASIONS.map((o) => <option key={o.value} value={o.value}>{o.emoji} {o.label}</option>)}
        </select>
        <div>
          <Label>Tables</Label>
          {areas.map((a) => (
            <div key={a.id} className="mt-1">
              <p className="text-small text-text-muted">{a.name}</p>
              <div className="flex flex-wrap gap-1.5">
                {a.tables.map((t) => {
                  const k = t.id!
                  const on = tables.includes(k)
                  return (
                    <button key={k} type="button" onClick={() => setTables((x) => (on ? x.filter((y) => y !== k) : [...x, k]))} className={`rounded-lg border px-2.5 py-1 text-small font-semibold ${on ? 'border-amber-400 bg-amber-100' : 'border-border'}`}>
                      {t.label} · {t.seats}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <Button fullWidth isLoading={add.isPending} disabled={!f.name.trim() || tables.length === 0} onClick={() => add.mutate()}>Add booking</Button>
      </Card>
    </div>
  )
}

/* ================================================================== */
/* Floor plan editor                                                   */
/* ================================================================== */
let keySeq = 0
const newKey = () => `new-${Date.now()}-${keySeq++}`

const TEMPLATES: { name: string; emoji: string; area: Omit<FloorArea, 'id'> }[] = [
  {
    name: 'Café · 6 tables',
    emoji: '☕',
    area: {
      name: 'Café floor', kind: 'indoor', width: 14, height: 9, active: true, tables: [
        { id: null, label: 'W1', seats: 2, shape: 'couple', x: 2, y: 1.6, rotation: 0, tags: ['window', 'couple'], bookable: true },
        { id: null, label: 'W2', seats: 2, shape: 'couple', x: 5, y: 1.6, rotation: 0, tags: ['window'], bookable: true },
        { id: null, label: 'T3', seats: 4, shape: 'square', x: 2.6, y: 5, rotation: 0, tags: [], bookable: true },
        { id: null, label: 'T4', seats: 4, shape: 'square', x: 6, y: 5, rotation: 0, tags: [], bookable: true },
        { id: null, label: 'F5', seats: 6, shape: 'rect', x: 10.4, y: 3, rotation: 90, tags: ['family'], bookable: true },
        { id: null, label: 'S6', seats: 4, shape: 'booth', x: 10.4, y: 7.4, rotation: 0, tags: ['sofa'], bookable: true },
      ],
    },
  },
  {
    name: 'Rooftop · 5 tables',
    emoji: '🌃',
    area: {
      name: 'Rooftop', kind: 'rooftop', width: 14, height: 9, active: true, tables: [
        { id: null, label: 'R1', seats: 2, shape: 'couple', x: 2.2, y: 2.4, rotation: 0, tags: ['view', 'candle-light'], bookable: true },
        { id: null, label: 'R2', seats: 2, shape: 'couple', x: 5.4, y: 2.4, rotation: 0, tags: ['view'], bookable: true },
        { id: null, label: 'R3', seats: 4, shape: 'round', x: 9, y: 2.8, rotation: 0, tags: ['view'], bookable: true },
        { id: null, label: 'R4', seats: 8, shape: 'round', x: 4.4, y: 6.2, rotation: 0, tags: ['party'], bookable: true },
        { id: null, label: 'R5', seats: 6, shape: 'rect', x: 10.2, y: 6.6, rotation: 0, tags: ['family'], bookable: true },
      ],
    },
  },
  {
    name: 'Garden · 6 tables',
    emoji: '🌳',
    area: {
      name: 'Garden', kind: 'garden', width: 16, height: 10, active: true, tables: [1, 2, 3, 4, 5, 6].map((n, i) => ({
        id: null, label: `G${n}`, seats: i < 2 ? 2 : i < 4 ? 4 : 6, shape: (i < 2 ? 'couple' : 'round') as TableShape,
        x: 3 + (i % 3) * 4.6, y: i < 3 ? 3 : 7, rotation: 0, tags: [], bookable: true,
      })),
    },
  },
  {
    name: 'Banquet hall · rounds',
    emoji: '🎊',
    area: {
      name: 'Banquet hall', kind: 'hall', width: 18, height: 12, active: true, tables: Array.from({ length: 8 }).map((_, i) => ({
        id: null, label: `B${i + 1}`, seats: 10, shape: 'round' as TableShape, x: 3 + (i % 4) * 4, y: i < 4 ? 4.5 : 8.8, rotation: 0, tags: ['party'], bookable: true,
      })),
    },
  },
]

function withKeys(areas: FloorArea[]): FloorArea[] {
  return areas.map((a) => ({ ...a, key: a.id ?? newKey(), tables: a.tables.map((t) => ({ ...t, key: t.id ?? newKey() })) }))
}

function FloorEditor({ initial }: { initial: FloorArea[] }) {
  const qc = useQueryClient()
  const [areas, setAreas] = useState<FloorArea[]>(() => withKeys(initial.filter((a) => a.kind !== 'unplaced')))
  const unplaced = initial.find((a) => a.kind === 'unplaced')?.tables ?? []
  const [placedIds, setPlacedIds] = useState<string[]>([])
  const [areaKey, setAreaKey] = useState<string | null>(areas[0]?.key ?? null)
  const [sel, setSel] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const area = areas.find((a) => a.key === areaKey) ?? areas[0]
  const table = area?.tables.find((t) => tableKey(t) === sel)

  useEffect(() => {
    if (!area && areas[0]) setAreaKey(areas[0].key ?? null)
  }, [area, areas])

  const save = useMutation({
    mutationFn: () => bookingService.saveFloor(areas),
    onSuccess: (fresh) => {
      toast.success('Floor plan saved')
      const next = withKeys(fresh.filter((a) => a.kind !== 'unplaced'))
      setAreas(next)
      setAreaKey(next.find((a) => a.name === area?.name)?.key ?? next[0]?.key ?? null)
      setSel(null)
      setDirty(false)
      void qc.invalidateQueries({ queryKey: ['owner', 'booking-floor'] })
    },
    onError: (e) => err(e, 'Could not save the floor plan.'),
  })

  function patchArea(p: Partial<FloorArea>) {
    setAreas((all) => all.map((a) => (a.key === area?.key ? { ...a, ...p } : a)))
    setDirty(true)
  }
  function patchTable(key: string, p: Partial<FloorTable>) {
    setAreas((all) => all.map((a) => (a.key === area?.key ? { ...a, tables: a.tables.map((t) => (tableKey(t) === key ? { ...t, ...p } : t)) } : a)))
    setDirty(true)
  }
  function addArea(tpl?: (typeof TEMPLATES)[number]) {
    const base = tpl?.area ?? { name: `Area ${areas.length + 1}`, kind: 'indoor' as const, width: 12, height: 8, active: true, tables: [] }
    const a: FloorArea = { ...base, id: null, key: newKey(), tables: base.tables.map((t) => ({ ...t, id: null, key: newKey() })) }
    setAreas((all) => [...all, a])
    setAreaKey(a.key!)
    setDirty(true)
  }
  function addTable(shape: TableShape) {
    if (!area) return
    const seats = shape === 'couple' ? 2 : shape === 'rect' ? 6 : 4
    const n = areas.reduce((c, a) => c + a.tables.length, 0) + 1
    const t: FloorTable = { id: null, key: newKey(), label: `T${n}`, seats, shape, x: area.width / 2, y: area.height / 2, rotation: 0, tags: [], bookable: true }
    patchArea({ tables: [...area.tables, t] })
    setSel(t.key!)
  }
  function placeExisting(t: FloorTable) {
    if (!area) return
    patchArea({ tables: [...area.tables, { ...t, key: t.id ?? newKey(), x: area.width / 2, y: area.height / 2, shape: t.shape || 'square' }] })
    setPlacedIds((x) => [...x, t.id!])
  }

  if (areas.length === 0) {
    return (
      <Card padding="lg" className="space-y-4 text-center">
        <p className="text-4xl">🗺️</p>
        <h2 className="text-lg font-bold">Draw your floor plan</h2>
        <p className="text-text-secondary">Start from a ready layout and drag tables to match your shop — takes 2 minutes.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {TEMPLATES.map((t) => (
            <button key={t.name} type="button" onClick={() => addArea(t)} className="rounded-2xl border border-border p-4 text-left transition hover:border-primary hover:bg-primary/5">
              <span className="text-2xl">{t.emoji}</span>
              <p className="font-bold">{t.name}</p>
            </button>
          ))}
        </div>
        <Button variant="outline" onClick={() => addArea()}>Start with an empty area</Button>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {/* Areas */}
      <div className="flex flex-wrap items-center gap-2">
        {areas.map((a) => (
          <button key={a.key} type="button" onClick={() => { setAreaKey(a.key!); setSel(null) }} className={`rounded-full px-3 py-1.5 text-small font-semibold ${a.key === area?.key ? 'bg-foreground text-background' : 'bg-surface-muted'}`}>
            {AREA_KINDS.find((k) => k.value === a.kind)?.emoji} {a.name} <span className="opacity-60">({a.tables.length})</span>
          </button>
        ))}
        <select
          aria-label="Add area"
          value=""
          onChange={(e) => {
            const v = e.target.value
            if (v === 'empty') addArea()
            else if (v) addArea(TEMPLATES[Number(v)])
          }}
          className="h-9 rounded-full border border-dashed border-border bg-surface px-3 text-small"
        >
          <option value="">+ Add area…</option>
          <option value="empty">Empty area</option>
          {TEMPLATES.map((t, i) => <option key={t.name} value={i}>{t.emoji} {t.name}</option>)}
        </select>
        <Button className="ml-auto" size="sm" leftIcon={<Save className="size-4" />} isLoading={save.isPending} disabled={!dirty} onClick={() => save.mutate()}>
          Save floor plan
        </Button>
      </div>

      {area && (
        <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              <span className="self-center text-small text-text-secondary">Add table:</span>
              {(
                [
                  ['couple', '❤️ Couple'],
                  ['square', '◻️ Square'],
                  ['round', '⚪ Round'],
                  ['rect', '▭ Long'],
                  ['booth', '🛋️ Sofa'],
                ] as const
              ).map(([s, l]) => (
                <button key={s} type="button" onClick={() => addTable(s)} className="rounded-full border border-border bg-surface px-3 py-1 text-small font-semibold hover:border-primary">
                  {l}
                </button>
              ))}
            </div>
            <div className="overflow-hidden rounded-3xl shadow-lg ring-1 ring-black/10">
              <FloorPlan
                area={area}
                mode="edit"
                stateOf={(t) => (tableKey(t) === sel ? 'editSelected' : 'edit')}
                onTableClick={(t) => setSel(tableKey(t))}
                onTableMove={(k, x, y) => patchTable(k, { x, y })}
              />
            </div>
            <p className="text-small text-text-muted">Drag tables to move them. Tap a table to change it. Remember to Save.</p>
          </div>

          <div className="space-y-3">
            {table ? (
              <Card padding="md" className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-bold">Table {table.label}</p>
                  <button type="button" onClick={() => setSel(null)} aria-label="Close"><X className="size-4" /></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Name</Label><Input value={table.label} maxLength={10} onChange={(e) => patchTable(sel!, { label: e.target.value })} /></div>
                  <div><Label>Seats</Label><Input type="number" min={1} max={50} value={table.seats} onChange={(e) => patchTable(sel!, { seats: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })} /></div>
                </div>
                <div>
                  <Label>Shape</Label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(['couple', 'square', 'round', 'rect', 'booth'] as TableShape[]).map((s) => (
                      <button key={s} type="button" onClick={() => patchTable(sel!, { shape: s })} className={`rounded-lg border px-2 py-1 text-small capitalize ${table.shape === s ? 'border-primary bg-primary/10' : 'border-border'}`}>
                        {s === 'rect' ? 'long' : s === 'booth' ? 'sofa' : s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Good for</Label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {TABLE_TAGS.map((tag) => {
                      const on = table.tags.includes(tag.value)
                      return (
                        <button key={tag.value} type="button" onClick={() => patchTable(sel!, { tags: on ? table.tags.filter((x) => x !== tag.value) : [...table.tags, tag.value].slice(0, 6) })} className={`rounded-full border px-2 py-0.5 text-small ${on ? 'border-amber-400 bg-amber-100' : 'border-border'}`}>
                          {tag.emoji} {tag.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <label className="flex items-center justify-between text-small">
                  Customers can book it online
                  <Switch checked={table.bookable} onCheckedChange={(v) => patchTable(sel!, { bookable: v })} />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" leftIcon={<RotateCw className="size-4" />} onClick={() => patchTable(sel!, { rotation: (table.rotation + 45) % 360 })}>Rotate</Button>
                  <Button size="sm" variant="outline" leftIcon={<Copy className="size-4" />} onClick={() => {
                    const c = { ...table, id: null, key: newKey(), label: `${table.label}b`, x: Math.min(area.width - 1, (table.x ?? 1) + 1.5) }
                    patchArea({ tables: [...area.tables, c] })
                    setSel(c.key)
                  }}>Copy</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" leftIcon={<Trash2 className="size-4" />} onClick={() => {
                    patchArea({ tables: area.tables.filter((t) => tableKey(t) !== sel) })
                    setSel(null)
                  }}>Remove</Button>
                </div>
              </Card>
            ) : (
              <Card padding="md" className="space-y-3">
                <p className="font-bold">Area</p>
                <div><Label>Name</Label><Input value={area.name} maxLength={60} onChange={(e) => patchArea({ name: e.target.value })} /></div>
                <div>
                  <Label>Look</Label>
                  <div className="mt-1 grid grid-cols-2 gap-1">
                    {AREA_KINDS.map((k) => (
                      <button key={k.value} type="button" onClick={() => patchArea({ kind: k.value })} className={`rounded-lg border px-2 py-1.5 text-left text-small ${area.kind === k.value ? 'border-primary bg-primary/10' : 'border-border'}`}>
                        {k.emoji} {k.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Width (m)</Label><Input type="number" min={4} max={40} value={area.width} onChange={(e) => patchArea({ width: Math.max(4, Math.min(40, Number(e.target.value) || 4)) })} /></div>
                  <div><Label>Depth (m)</Label><Input type="number" min={4} max={40} value={area.height} onChange={(e) => patchArea({ height: Math.max(4, Math.min(40, Number(e.target.value) || 4)) })} /></div>
                </div>
                <label className="flex items-center justify-between text-small">
                  Open for booking
                  <Switch checked={area.active} onCheckedChange={(v) => patchArea({ active: v })} />
                </label>
                <Button size="sm" variant="ghost" className="text-destructive" leftIcon={<Trash2 className="size-4" />} onClick={() => {
                  if (!window.confirm(`Remove ${area.name}? Its tables move to "not placed".`)) return
                  setAreas((all) => all.filter((a) => a.key !== area.key))
                  setDirty(true)
                }}>Remove area</Button>
              </Card>
            )}

            {unplaced.filter((t) => !placedIds.includes(t.id!)).length > 0 && (
              <Card padding="md" className="space-y-2">
                <p className="font-bold">Tables not on the plan yet</p>
                <p className="text-small text-text-secondary">Your existing tables (from table QR). Place them here.</p>
                <div className="flex flex-wrap gap-1.5">
                  {unplaced.filter((t) => !placedIds.includes(t.id!)).map((t) => (
                    <button key={t.id} type="button" onClick={() => placeExisting(t)} className="rounded-lg border border-dashed border-primary px-2.5 py-1 text-small font-semibold text-primary">
                      + {t.label} · {t.seats}
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ================================================================== */
/* Settings — every rule is the shop's choice                          */
/* ================================================================== */
const ADVANCE: { value: AdvanceMode; title: string; text: string }[] = [
  { value: 'none', title: 'No advance', text: 'Free booking — easiest for customers.' },
  { value: 'per_guest', title: 'Per guest', text: 'e.g. ₹100 × guests. Fewer no-shows.' },
  { value: 'fixed', title: 'Fixed amount', text: 'One amount for every booking.' },
  { value: 'addons', title: 'Only the extras', text: 'Pay for cake / decoration in advance.' },
]

function SettingsTab({ initial }: { initial: BookingSettings }) {
  const qc = useQueryClient()
  const [f, setF] = useState(initial)
  const set = <K extends keyof BookingSettings>(k: K, v: BookingSettings[K]) => setF((x) => ({ ...x, [k]: v }))
  const save = useMutation({
    mutationFn: () => bookingService.saveSettings({ ...f, openTime: f.openTime || null, closeTime: f.closeTime || null }),
    onSuccess: (s) => {
      setF(s)
      toast.success('Booking settings saved')
      void qc.invalidateQueries({ queryKey: ['owner', 'booking-settings'] })
    },
    onError: (e) => err(e, 'Could not save.'),
  })
  const num = (k: keyof BookingSettings) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(e.target.value) as never)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card padding="lg" className="space-y-4">
        <label className="flex items-center justify-between gap-4 rounded-xl bg-surface-muted p-3">
          <span>
            <span className="block font-bold">Take table bookings</span>
            <span className="block text-small text-text-secondary">Shows “Book a table” on your shop page and app.</span>
          </span>
          <Switch checked={f.enabled} onCheckedChange={(v) => set('enabled', v)} />
        </label>

        <div>
          <Label>How bookings are confirmed</Label>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {[
              [true, '⚡ Auto-confirm', 'Instantly confirmed. Best for most cafés.'],
              [false, '✋ I confirm each', 'You accept or decline every request.'],
            ].map(([v, t, d]) => (
              <button key={String(v)} type="button" onClick={() => set('autoConfirm', v as boolean)} className={`rounded-2xl border p-3 text-left transition ${f.autoConfirm === v ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'border-border'}`}>
                <p className="font-bold">{t as string}</p>
                <p className="text-small text-text-secondary">{d as string}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Time slots every</Label>
            <select value={f.slotMinutes} onChange={(e) => set('slotMinutes', Number(e.target.value))} className="h-11 w-full rounded-input border border-border bg-surface px-3">
              {[15, 30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} min</option>)}
            </select>
          </div>
          <div><Label>Table kept for (min)</Label><Input type="number" min={30} max={480} value={f.durationMinutes} onChange={num('durationMinutes')} /></div>
          <div><Label>Bookings from (time)</Label><Input type="time" value={f.openTime ?? ''} onChange={(e) => set('openTime', e.target.value || null)} /></div>
          <div><Label>Until (time)</Label><Input type="time" value={f.closeTime ?? ''} onChange={(e) => set('closeTime', e.target.value || null)} /></div>
          <div><Label>Book at least (min before)</Label><Input type="number" min={0} value={f.minNoticeMinutes} onChange={num('minNoticeMinutes')} /></div>
          <div><Label>Up to (days ahead)</Label><Input type="number" min={1} max={180} value={f.maxDaysAhead} onChange={num('maxDaysAhead')} /></div>
          <div><Label>Max guests online</Label><Input type="number" min={1} max={200} value={f.maxGuests} onChange={num('maxGuests')} /></div>
          <div><Label>Free cancel until (hours before)</Label><Input type="number" min={0} max={168} value={f.cancelHours} onChange={num('cancelHours')} /></div>
        </div>
        <p className="text-small text-text-muted">Leave the times empty to use your shop’s opening hours.</p>
      </Card>

      <div className="space-y-4">
        <Card padding="lg" className="space-y-3">
          <Label>Advance payment</Label>
          <div className="grid grid-cols-2 gap-2">
            {ADVANCE.map((a) => (
              <button key={a.value} type="button" onClick={() => set('advanceMode', a.value)} className={`rounded-2xl border p-3 text-left ${f.advanceMode === a.value ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'border-border'}`}>
                <p className="font-bold">{a.title}</p>
                <p className="text-small text-text-secondary">{a.text}</p>
              </button>
            ))}
          </div>
          {(f.advanceMode === 'per_guest' || f.advanceMode === 'fixed') && (
            <div className="grid grid-cols-2 gap-2">
              <div><Label>{f.advanceMode === 'per_guest' ? '₹ per guest' : '₹ per booking'}</Label><Input type="number" min={0} value={f.advanceAmount} onChange={num('advanceAmount')} /></div>
              <div><Label>Hold unpaid table (min)</Label><Input type="number" min={5} max={120} value={f.holdMinutes} onChange={num('holdMinutes')} /></div>
            </div>
          )}
          {f.advanceMode !== 'none' && !f.onlinePayment && (
            <p className="rounded-lg bg-warning-soft px-3 py-2 text-small text-warning">Online payment isn’t connected on Listee yet, so bookings go through without an advance for now.</p>
          )}
        </Card>

        <Card padding="lg" className="space-y-3">
          <Label>Extras customers can add (birthday, anniversary…)</Label>
          <AddonsEditor value={f.addons} onChange={(v) => set('addons', v)} />
          <div><Label>Message on the booking page</Label><Input value={f.note ?? ''} maxLength={300} placeholder="e.g. Tell us the occasion — we will make it special." onChange={(e) => set('note', e.target.value)} /></div>
        </Card>

        <Button fullWidth isLoading={save.isPending} leftIcon={<Save className="size-4" />} onClick={() => save.mutate()}>Save booking settings</Button>
      </div>
    </div>
  )
}

function AddonsEditor({ value, onChange }: { value: BookingAddon[]; onChange: (v: BookingAddon[]) => void }) {
  const presets: BookingAddon[] = [
    { name: 'Birthday cake', price: 499, emoji: '🎂' },
    { name: 'Balloon decoration', price: 499, emoji: '🎈' },
    { name: 'Candle-light setup', price: 299, emoji: '🕯️' },
    { name: 'Flower bouquet', price: 349, emoji: '💐' },
  ]
  return (
    <div className="space-y-2">
      {value.map((a, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input className="w-14 text-center" value={a.emoji ?? ''} maxLength={4} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, emoji: e.target.value } : x)))} aria-label="Emoji" />
          <Input value={a.name} maxLength={60} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} aria-label="Name" />
          <Input className="w-24" type="number" min={0} value={a.price} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) || 0 } : x)))} aria-label="Price" />
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove" className="text-destructive"><Trash2 className="size-4" /></button>
        </div>
      ))}
      <div className="flex flex-wrap gap-1.5">
        {presets.filter((p) => !value.some((v) => v.name === p.name)).map((p) => (
          <button key={p.name} type="button" onClick={() => onChange([...value, p])} className="rounded-full border border-dashed border-border px-2.5 py-1 text-small hover:border-primary">
            + {p.emoji} {p.name}
          </button>
        ))}
        <button type="button" onClick={() => onChange([...value, { name: '', price: 0, emoji: '✨' }])} className="rounded-full border border-dashed border-border px-2.5 py-1 text-small hover:border-primary">+ Your own</button>
      </div>
    </div>
  )
}
