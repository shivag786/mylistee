import { useParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, ChevronRight, Loader2, Users } from 'lucide-react'
import { bookingService } from '@/features/booking/bookingService'
import { STATUS_LABEL, type Booking } from '@/features/booking/bookingTypes'
import { BookingTicket } from '@/pages/customer/BookTablePage'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'

const TONE: Record<Booking['status'], string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  seated: 'bg-sky-100 text-sky-800',
  completed: 'bg-gray-100 text-gray-700',
  declined: 'bg-rose-100 text-rose-700',
  cancelled: 'bg-gray-100 text-gray-500',
  no_show: 'bg-gray-100 text-gray-500',
}

/** The customer's table bookings, newest first. */
export function MyBookingsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['my-bookings'], queryFn: () => bookingService.mine() })
  const now = Date.now()
  const upcoming = (data ?? []).filter((b) => new Date(b.endsAt).getTime() > now && ['pending', 'confirmed', 'seated'].includes(b.status))
  const past = (data ?? []).filter((b) => !upcoming.includes(b))

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <h1 className="font-heading text-2xl font-extrabold">My table bookings</h1>
      {isLoading && <Loader2 className="size-6 animate-spin text-primary" />}
      {data && data.length === 0 && (
        <div className="rounded-3xl bg-gradient-to-br from-rose-50 to-amber-50 p-8 text-center">
          <p className="text-4xl">🪑</p>
          <p className="mt-2 font-bold">No bookings yet</p>
          <p className="text-text-secondary">Open a shop and tap “Book a table”.</p>
        </div>
      )}
      {upcoming.length > 0 && <List title="Upcoming" items={upcoming} />}
      {past.length > 0 && <List title="Past" items={past} dim />}
    </div>
  )
}

function List({ title, items, dim }: { title: string; items: Booking[]; dim?: boolean }) {
  return (
    <section>
      <h2 className="mb-2 text-small font-semibold uppercase tracking-wider text-text-muted">{title}</h2>
      <div className="space-y-2">
        {items.map((b) => (
          <Link key={b.id} to={`/bookings/${b.id}`} className={`flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:shadow-md ${dim ? 'opacity-75' : ''}`}>
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-400 text-white">
              <span className="text-center leading-none">
                <span className="block text-xl font-extrabold">{new Date(b.startsAt).getDate()}</span>
                <span className="text-[11px] uppercase">{new Date(b.startsAt).toLocaleDateString('en-IN', { month: 'short' })}</span>
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{b.business?.name}</p>
              <p className="text-small text-text-secondary">
                <CalendarDays className="mr-1 inline size-3.5" />
                {new Date(b.startsAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })} · <Users className="mx-1 inline size-3.5" />
                {b.guests} · Table {b.tables.map((t) => t.label).join('+')}
              </p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${TONE[b.status]}`}>{STATUS_LABEL[b.status]}</span>
            <ChevronRight className="size-4 text-text-muted" />
          </Link>
        ))}
      </div>
    </section>
  )
}

/** One booking: the ticket, plus pay / cancel. */
export function BookingDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const { data: b, isLoading } = useQuery({ queryKey: ['my-bookings', id], queryFn: () => bookingService.one(id), enabled: !!id })
  const cancel = useMutation({
    mutationFn: () => bookingService.cancel(id),
    onSuccess: () => {
      toast.success('Booking cancelled')
      void qc.invalidateQueries({ queryKey: ['my-bookings'] })
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not cancel.'),
  })

  if (isLoading || !b) return <div className="grid min-h-dvh place-items-center"><Loader2 className="size-8 animate-spin text-primary" /></div>

  const freeCancel = new Date(b.freeCancelUntil).getTime() > Date.now()
  return (
    <div className="relative">
      <BookingTicket booking={b} shopSlug={b.business?.slug ?? ''} shopName={b.business?.name ?? ''} />
      {['pending', 'confirmed'].includes(b.status) && (
        <div className="mx-auto -mt-6 max-w-md px-4 pb-10">
          <button
            type="button"
            disabled={cancel.isPending}
            onClick={() => {
              const msg = b.advanceStatus === 'paid' && !freeCancel ? 'Cancel now? The advance will not be refunded (it is past the free-cancellation time).' : 'Cancel this booking?'
              if (window.confirm(msg)) cancel.mutate()
            }}
            className="w-full rounded-xl bg-white/90 py-3 font-semibold text-rose-600 shadow"
          >
            Cancel booking
          </button>
          {b.advanceStatus === 'paid' && (
            <p className="mt-2 text-center text-small text-white/90">
              {freeCancel ? `Free cancellation until ${new Date(b.freeCancelUntil).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}` : 'Past the free-cancellation time.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
