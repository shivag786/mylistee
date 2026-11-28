import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, CalendarPlus, Check, ChevronRight, Clock, Loader2, Minus, Phone, Plus, Share2, Sparkles, Users } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { SignInDialog } from '@/features/auth/components/SignInDialog'
import { loadRazorpay } from '@/features/payments/razorpay'
import { generateQrDataUrl } from '@/utils/qr'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { bookingService } from '@/features/booking/bookingService'
import { FloorLegend, FloorPlan, tableKey, type TableState } from '@/features/booking/FloorPlan'
import { AREA_KINDS, OCCASIONS, STATUS_LABEL, TABLE_TAGS, type Booking, type FloorTable, type Occasion, type RazorpaySession } from '@/features/booking/bookingTypes'

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const time12 = (hm: string) => {
  const [h, m] = hm.split(':').map(Number)
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`
}
const dayPart = (hm: string) => {
  const h = Number(hm.slice(0, 2))
  return h < 12 ? 'Morning' : h < 16 ? 'Afternoon' : h < 19 ? 'Evening' : 'Night'
}

/** Book a table from home: when, who, which table on the floor plan, extras, done. */
export function BookTablePage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const page = useQuery({ queryKey: ['booking', slug], queryFn: () => bookingService.page(slug), enabled: !!slug })
  const s = page.data?.settings

  const days = useMemo(() => {
    const out: Date[] = []
    const n = Math.min(s?.maxDaysAhead ?? 14, 30)
    for (let i = 0; i <= n; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      out.push(d)
    }
    return out
  }, [s?.maxDaysAhead])

  const [date, setDate] = useState(() => ymd(new Date()))
  const [guests, setGuests] = useState(2)
  const [occasion, setOccasion] = useState<Occasion | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [areaId, setAreaId] = useState<string | null>(null)
  const [picked, setPicked] = useState<string[]>([])
  const [addons, setAddons] = useState<Record<string, number>>({})
  const [note, setNote] = useState('')
  const [request, setRequest] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [signIn, setSignIn] = useState(false)
  const [done, setDone] = useState<Booking | null>(null)

  useEffect(() => {
    if (user) {
      setName((n) => n || user.name || '')
      setPhone((p) => p || user.phone || '')
    }
  }, [user])

  const avail = useQuery({
    queryKey: ['booking', slug, 'availability', date],
    queryFn: () => bookingService.availability(slug, date),
    enabled: !!s?.enabled,
    refetchInterval: 60_000,
  })

  const areas = page.data?.areas ?? []
  const area = areas.find((a) => a.id === areaId) ?? areas[0]
  const allTables = areas.flatMap((a) => a.tables)
  const slot = avail.data?.slots.find((x) => x.time === time)
  const free = new Set(slot?.free ?? [])
  const pickedTables = allTables.filter((t) => picked.includes(tableKey(t)))
  const seatsPicked = pickedTables.reduce((n, t) => n + t.seats, 0)
  const enoughSeats = seatsPicked >= guests

  // A time is offered when its free tables can seat everyone.
  const fits = (free: string[]) => {
    const seats = allTables.filter((t) => free.includes(tableKey(t))).map((t) => t.seats)
    return { single: seats.filter((n) => n >= guests).length, total: seats.reduce((a, b) => a + b, 0) }
  }

  // Changing the date, time or guests drops tables that no longer fit.
  useEffect(() => setPicked((p) => p.filter((k) => free.has(k))), [time, date]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setTime(null), [date])

  const addonList = s?.addons ?? []
  const addonsTotal = addonList.reduce((n, a) => n + (addons[a.name] ?? 0) * a.price, 0)
  const advance = !s
    ? 0
    : s.advanceMode === 'per_guest'
      ? s.advanceAmount * guests
      : s.advanceMode === 'fixed'
        ? s.advanceAmount
        : s.advanceMode === 'addons'
          ? addonsTotal
          : 0
  const payNow = advance > 0 && !!s?.onlinePayment

  function stateOf(t: FloorTable): TableState {
    const k = tableKey(t)
    if (!time) return 'free'
    if (!free.has(k)) return 'booked'
    if (picked.includes(k)) return 'selected'
    if (t.seats < guests && !enoughSeats && picked.length === 0) return 'small'
    return 'free'
  }

  function toggle(t: FloorTable) {
    if (!time) {
      toast.info('Pick a time first')
      return
    }
    const k = tableKey(t)
    setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : p.length >= 4 ? p : [...p, k]))
  }

  function pickBest() {
    if (!time) return
    const pool = (area?.tables ?? []).filter((t) => free.has(tableKey(t)) && t.seats >= guests).sort((a, b) => a.seats - b.seats)
    const best = pool[0] ?? allTables.filter((t) => free.has(tableKey(t)) && t.seats >= guests).sort((a, b) => a.seats - b.seats)[0]
    if (!best) {
      toast.info('No single table fits — pick two tables next to each other.')
      return
    }
    setAreaId(areas.find((a) => a.tables.includes(best))?.id ?? null)
    setPicked([tableKey(best)])
  }

  const book = useMutation({
    mutationFn: async () => {
      const res = await bookingService.create(slug, {
        date,
        time: time!,
        guests,
        tableIds: picked,
        occasion,
        occasionNote: note.trim() || undefined,
        addons: Object.entries(addons)
          .filter(([, q]) => q > 0)
          .map(([n, q]) => ({ name: n, qty: q })),
        request: request.trim() || undefined,
        name: name.trim(),
        phone: phone.trim(),
      })
      if (!res.checkout) return res.booking
      return payAdvance(res.booking, res.checkout)
    },
    onSuccess: (b) => {
      setDone(b)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    onError: (e) => {
      if (e instanceof Error && e.message === 'dismissed') {
        toast.info('Payment not completed — your table is held for a few minutes. Open My bookings to pay.')
        return
      }
      toast.error(e instanceof ApiError ? e.message : 'Could not book. Please try again.')
      void avail.refetch()
    },
  })

  async function payAdvance(b: Booking, session: RazorpaySession): Promise<Booking> {
    const Razorpay = await loadRazorpay()
    const r = await new Promise<{ razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }>((resolve, reject) => {
      const rz = new Razorpay({
        key: session.keyId,
        amount: session.amount,
        currency: session.currency,
        name: session.name,
        description: session.description,
        image: session.logo ?? undefined,
        order_id: session.orderId,
        prefill: session.prefill,
        theme: { color: session.themeColor ?? undefined },
        handler: resolve,
        modal: { confirm_close: true, ondismiss: () => reject(new Error('dismissed')) },
      })
      rz.on('payment.failed', () => undefined)
      rz.open()
    })
    return bookingService.verify(b.id, { razorpayOrderId: r.razorpay_order_id, razorpayPaymentId: r.razorpay_payment_id, razorpaySignature: r.razorpay_signature })
  }

  function submit() {
    if (!isAuthenticated) {
      setSignIn(true)
      return
    }
    if (!time || picked.length === 0) return toast.error('Pick a time and a table')
    if (!enoughSeats) return toast.error(`Your tables seat ${seatsPicked} — add another table for ${guests} guests`)
    if (name.trim().length < 2 || phone.replace(/\D/g, '').length < 10) return toast.error('Enter your name and a 10-digit mobile number')
    book.mutate()
  }

  if (page.isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }
  if (!page.data || !s?.enabled || areas.length === 0) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background p-6 text-center">
        <div>
          <p className="text-4xl">🪑</p>
          <h1 className="mt-3 text-xl font-bold">Table booking isn’t open here yet</h1>
          <p className="mt-1 text-text-secondary">Call the shop to book a table.</p>
          <Link to={ROUTES.businessProfile(slug)} className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground">Back to shop</Link>
        </div>
      </div>
    )
  }

  if (done) return <BookingTicket booking={done} shopSlug={slug} shopName={page.data.business.name} />

  const step = !time ? 2 : picked.length === 0 ? 3 : 4

  return (
    <div className="min-h-dvh bg-gradient-to-b from-amber-50 via-background to-background pb-40">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <button type="button" onClick={() => navigate(-1)} className="grid size-10 place-items-center rounded-full hover:bg-black/5" aria-label="Back">
            <ArrowLeft className="size-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-small text-text-secondary">Book a table at</p>
            <h1 className="truncate font-heading text-lg font-extrabold">{page.data.business.name}</h1>
          </div>
          <div className="ml-auto flex gap-1">
            {[1, 2, 3, 4].map((n) => (
              <span key={n} className={`h-1.5 w-6 rounded-full transition ${n <= step ? 'bg-gradient-to-r from-rose-500 to-amber-400' : 'bg-black/10'}`} />
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 pt-5">
        {/* 1 · When & who */}
        <Section n={1} title="When, how many & why">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
            {days.map((d, i) => {
              const v = ymd(d)
              const on = v === date
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setDate(v)}
                  className={`flex w-16 shrink-0 flex-col items-center rounded-2xl border py-2.5 transition ${
                    on ? 'border-transparent bg-gradient-to-b from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/30' : 'border-black/10 bg-white hover:border-black/30'
                  }`}
                >
                  <span className="text-[11px] font-semibold uppercase opacity-80">{i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                  <span className="text-xl font-extrabold">{d.getDate()}</span>
                  <span className="text-[11px] opacity-80">{d.toLocaleDateString('en-IN', { month: 'short' })}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl bg-white p-3 ring-1 ring-black/5">
            <span className="flex items-center gap-2 font-semibold"><Users className="size-5 text-rose-500" /> Guests</span>
            <div className="flex items-center gap-3">
              <button type="button" aria-label="Fewer guests" onClick={() => setGuests((g) => Math.max(1, g - 1))} className="grid size-9 place-items-center rounded-full bg-black/5 hover:bg-black/10"><Minus className="size-4" /></button>
              <motion.span key={guests} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="w-8 text-center text-xl font-extrabold tabular-nums">{guests}</motion.span>
              <button type="button" aria-label="More guests" onClick={() => setGuests((g) => Math.min(s.maxGuests, g + 1))} className="grid size-9 place-items-center rounded-full bg-black/5 hover:bg-black/10"><Plus className="size-4" /></button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {OCCASIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setOccasion(occasion === o.value ? null : o.value)}
                className={`flex flex-col items-center gap-1 rounded-2xl border p-2.5 text-small font-semibold transition ${
                  occasion === o.value ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-300' : 'border-black/10 bg-white hover:border-black/30'
                }`}
              >
                <span className="text-2xl">{o.emoji}</span>
                {o.label}
              </button>
            ))}
          </div>
        </Section>

        {/* 2 · Time */}
        <Section n={2} title="Pick a time">
          {avail.isLoading && <p className="text-text-secondary">Checking free tables…</p>}
          {avail.data && avail.data.slots.length === 0 && <p className="rounded-xl bg-white p-4 text-text-secondary ring-1 ring-black/5">{avail.data.closedReason}</p>}
          {(['Morning', 'Afternoon', 'Evening', 'Night'] as const).map((part) => {
            const list = (avail.data?.slots ?? []).filter((x) => dayPart(x.time) === part)
            if (list.length === 0) return null
            return (
              <div key={part} className="mb-3">
                <p className="mb-1.5 text-small font-semibold text-text-muted">{part}</p>
                <div className="flex flex-wrap gap-2">
                  {list.map((x) => {
                    const f = fits(x.free)
                    const ok = f.single > 0 || f.total >= guests
                    const on = time === x.time
                    return (
                      <button
                        key={x.time}
                        type="button"
                        disabled={!ok}
                        onClick={() => setTime(x.time)}
                        className={`rounded-xl border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-35 ${
                          on ? 'border-transparent bg-gray-900 text-white shadow-lg' : 'border-black/10 bg-white hover:border-black/30'
                        }`}
                      >
                        <span className="block font-bold">{time12(x.time)}</span>
                        <span className={`block text-[11px] ${on ? 'text-white/70' : f.single > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {!ok ? 'Full' : f.single > 0 ? `${f.single} table${f.single > 1 ? 's' : ''} free` : 'Join tables'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </Section>

        {/* 3 · Table on the floor plan */}
        <Section n={3} title="Choose your table" aside={time ? <button type="button" onClick={pickBest} className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-small font-bold text-amber-800"><Sparkles className="size-4" /> Best pick</button> : null}>
          <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
            {areas.map((a) => {
              const k = AREA_KINDS.find((x) => x.value === a.kind)
              const freeHere = a.tables.filter((t) => free.has(tableKey(t))).length
              const on = (area?.id ?? null) === a.id
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAreaId(a.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 font-semibold transition ${on ? 'bg-gray-900 text-white shadow' : 'bg-white ring-1 ring-black/10'}`}
                >
                  <span className="text-lg">{k?.emoji ?? '🍽️'}</span>
                  {a.name}
                  {time && <span className={`rounded-full px-1.5 text-[11px] ${on ? 'bg-white/20' : 'bg-emerald-100 text-emerald-700'}`}>{freeHere} free</span>}
                </button>
              )
            })}
          </div>

          {area && (
            <AnimatePresence mode="wait">
              <motion.div
                key={area.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-black/10"
              >
                {/* Bigger on phones: swipe sideways, so tables are easy to tap. */}
                <div className="overflow-x-auto [scrollbar-width:none]">
                  <div className="min-w-[620px] sm:min-w-0">
                    <FloorPlan area={area} stateOf={stateOf} onTableClick={toggle} />
                  </div>
                </div>
                {!time && (
                  <div className="absolute inset-0 grid place-items-center bg-black/35 backdrop-blur-[2px]">
                    <p className="rounded-full bg-white px-4 py-2 font-semibold shadow-lg"><Clock className="mr-1 inline size-4" /> Pick a time to see free tables</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
          <p className="mt-2 text-center text-[11px] text-text-muted sm:hidden">← swipe to see the whole {area?.name} →</p>
          <div className="mt-2"><FloorLegend /></div>

          <AnimatePresence>
            {pickedTables.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 space-y-2">
                {pickedTables.map((t) => (
                  <div key={tableKey(t)} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-amber-200">
                    <span className="grid size-11 place-items-center rounded-xl bg-amber-400 font-extrabold text-white">{t.label}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{t.seats} seats · {areas.find((a) => a.tables.includes(t))?.name}</p>
                      <p className="flex flex-wrap gap-1 text-small text-text-secondary">
                        {t.tags.map((tag) => {
                          const x = TABLE_TAGS.find((y) => y.value === tag)
                          return <span key={tag} className="rounded-full bg-black/5 px-2">{x ? `${x.emoji} ${x.label}` : tag}</span>
                        })}
                      </p>
                    </div>
                    <button type="button" className="text-small font-semibold text-rose-600" onClick={() => toggle(t)}>Remove</button>
                  </div>
                ))}
                <p className={`text-small font-semibold ${enoughSeats ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {enoughSeats ? `✓ ${seatsPicked} seats for ${guests} guests` : `${seatsPicked} of ${guests} seats — tap another table to join`}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </Section>

        {/* 4 · Make it special + details */}
        {(addonList.length > 0 || occasion) && (
          <Section n={4} title={occasion === 'birthday' ? 'Make the birthday special 🎉' : occasion === 'anniversary' ? 'Make it romantic 💕' : 'Make it special'}>
            {(occasion === 'birthday' || occasion === 'anniversary') && (
              <input
                className="mb-3 h-12 w-full rounded-xl border border-black/10 bg-white px-4"
                placeholder={occasion === 'birthday' ? 'Name on the cake, e.g. Happy Birthday Riya' : 'A message, e.g. Happy 5th anniversary'}
                value={note}
                maxLength={120}
                onChange={(e) => setNote(e.target.value)}
              />
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              {addonList.map((a) => {
                const q = addons[a.name] ?? 0
                return (
                  <div key={a.name} className={`flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 transition ${q ? 'ring-2 ring-rose-300' : 'ring-black/5'}`}>
                    <span className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-rose-100 to-amber-100 text-2xl">{a.emoji || '✨'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold leading-tight">{a.name}</p>
                      <p className="text-small text-text-secondary">{inr(a.price)}</p>
                    </div>
                    {q === 0 ? (
                      <button type="button" onClick={() => setAddons((x) => ({ ...x, [a.name]: 1 }))} className="rounded-full bg-gray-900 px-3 py-1.5 text-small font-bold text-white">Add</button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button type="button" aria-label="Less" onClick={() => setAddons((x) => ({ ...x, [a.name]: q - 1 }))} className="grid size-8 place-items-center rounded-full bg-black/5"><Minus className="size-3.5" /></button>
                        <span className="w-4 text-center font-bold">{q}</span>
                        <button type="button" aria-label="More" onClick={() => setAddons((x) => ({ ...x, [a.name]: Math.min(10, q + 1) }))} className="grid size-8 place-items-center rounded-full bg-black/5"><Plus className="size-3.5" /></button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Section>
        )}

        <Section n={addonList.length > 0 || occasion ? 5 : 4} title="Your details">
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="h-12 rounded-xl border border-black/10 bg-white px-4" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="h-12 rounded-xl border border-black/10 bg-white px-4" placeholder="Mobile number" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <textarea className="mt-2 h-20 w-full rounded-xl border border-black/10 bg-white p-3" placeholder="Anything the shop should know? (high chair, surprise, allergies…)" value={request} maxLength={1000} onChange={(e) => setRequest(e.target.value)} />
          {s.note && <p className="mt-2 rounded-xl bg-amber-50 p-3 text-small text-amber-900">💬 {s.note}</p>}
          <ul className="mt-3 space-y-1 text-small text-text-secondary">
            <li>• {s.autoConfirm ? 'Confirmed instantly.' : 'The shop confirms your booking — you get a notification.'}</li>
            <li>• Your table is kept for {s.durationMinutes} minutes.</li>
            {advance > 0 && <li>• Free cancellation until {s.cancelHours} hours before.{payNow ? ` After that the ${inr(advance)} advance is not refunded.` : ''}</li>}
          </ul>
        </Section>
      </main>

      {/* Sticky summary + action */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1 text-small">
            <p className="truncate font-bold">
              {new Date(date + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              {time ? ` · ${time12(time)}` : ''} · {guests} guests
            </p>
            <p className="truncate text-text-secondary">
              {pickedTables.length ? `Table ${pickedTables.map((t) => t.label).join(' + ')}` : 'No table yet'}
              {addonsTotal > 0 ? ` · Extras ${inr(addonsTotal)}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={book.isPending || !time || picked.length === 0}
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-6 font-bold text-white shadow-lg shadow-rose-500/30 transition disabled:opacity-40"
          >
            {book.isPending ? <Loader2 className="size-5 animate-spin" /> : null}
            {!isAuthenticated ? 'Sign in to book' : payNow ? `Pay ${inr(advance)} & book` : 'Book table'}
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <SignInDialog open={signIn} onOpenChange={setSignIn} reason="Sign in to book your table — it takes a few seconds." onSignedIn={() => setSignIn(false)} />
    </div>
  )
}

function Section({ n, title, aside, children }: { n: number; title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white/70 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-amber-400 text-small font-extrabold text-white">{n}</span>
        <h2 className="text-lg font-extrabold">{title}</h2>
        <div className="ml-auto">{aside}</div>
      </div>
      {children}
    </section>
  )
}

/** The booking ticket: status, QR code, calendar, share. */
export function BookingTicket({ booking: b, shopSlug, shopName }: { booking: Booking; shopSlug: string; shopName: string }) {
  const [qr, setQr] = useState<string | null>(null)
  useEffect(() => {
    void generateQrDataUrl(`LISTEE-BOOKING:${b.code}`, 360).then(setQr)
  }, [b.code])
  const when = new Date(b.startsAt)
  const end = new Date(b.endsAt)
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const gcal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Table at ${shopName}`)}&dates=${fmt(when)}/${fmt(end)}&details=${encodeURIComponent(`Booking ${b.code} · ${b.guests} guests · Table ${b.tables.map((t) => t.label).join(' + ')}`)}`
  const share = `https://wa.me/?text=${encodeURIComponent(`Table booked at ${shopName} 🎉\n${when.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} · ${b.guests} guests\nBooking ${b.code}`)}`
  const confirmed = b.status === 'confirmed'

  return (
    <div className="min-h-dvh bg-gradient-to-br from-rose-500 via-orange-500 to-amber-400 px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 18 }} className="mx-auto max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="relative bg-gray-900 px-6 pb-8 pt-7 text-center text-white">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className={`mx-auto grid size-16 place-items-center rounded-full ${confirmed ? 'bg-emerald-500' : 'bg-amber-400'}`}>
            {confirmed ? <Check className="size-9" strokeWidth={3} /> : <Clock className="size-8" />}
          </motion.div>
          <h1 className="mt-4 font-heading text-2xl font-extrabold">{confirmed ? 'Table booked!' : b.advanceStatus === 'due' ? 'Almost there' : 'Request sent'}</h1>
          <p className="mt-1 text-white/70">{confirmed ? 'See you soon 🎉' : b.advanceStatus === 'due' ? 'Pay the advance to hold your table.' : 'The shop will confirm shortly — you’ll get a notification.'}</p>
          <span className="absolute -bottom-4 -left-4 size-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-500" />
          <span className="absolute -bottom-4 -right-4 size-8 rounded-full bg-orange-400" />
        </div>
        <div className="space-y-4 px-6 py-6">
          <div className="text-center">
            <p className="text-small text-text-muted">{shopName}</p>
            <p className="text-xl font-extrabold">{when.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <p className="text-lg font-bold text-rose-600">{when.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Fact label="Guests" value={String(b.guests)} />
            <Fact label="Table" value={b.tables.map((t) => t.label).join('+')} />
            <Fact label="Area" value={b.area ?? '—'} />
          </div>
          {b.addons.length > 0 && (
            <p className="rounded-xl bg-rose-50 p-3 text-small">{b.addons.map((a) => `${a.emoji ?? '✨'} ${a.name}${a.qty > 1 ? ` ×${a.qty}` : ''}`).join(' · ')}</p>
          )}
          <div className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-black/10 p-3">
            {qr ? <img src={qr} alt="Booking QR" className="size-24" /> : <div className="size-24" />}
            <div>
              <p className="text-small text-text-muted">Show at the counter</p>
              <p className="font-mono text-2xl font-extrabold tracking-[0.2em]">{b.code}</p>
              <p className="text-small font-semibold">{STATUS_LABEL[b.status]}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <a href={gcal} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-black/5 py-3 font-semibold"><CalendarPlus className="size-4" /> Calendar</a>
            <a href={share} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-semibold text-white"><Share2 className="size-4" /> Share</a>
          </div>
          <div className="flex gap-2">
            <Link to="/bookings" className="flex-1 rounded-xl bg-gray-900 py-3 text-center font-semibold text-white">My bookings</Link>
            <Link to={ROUTES.businessProfile(shopSlug)} className="flex-1 rounded-xl border border-black/10 py-3 text-center font-semibold">See menu</Link>
          </div>
          {b.business?.phone && (
            <a href={`tel:${b.business.phone}`} className="flex items-center justify-center gap-2 text-small text-text-secondary"><Phone className="size-4" /> Call the shop</a>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/[0.04] p-2">
      <p className="text-[11px] text-text-muted">{label}</p>
      <p className="truncate font-bold">{value}</p>
    </div>
  )
}

