import { useMemo, useState } from 'react'
import { CalendarDays, Megaphone, Pause, Pencil, Play, Plus, Repeat2, Utensils, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IconButton } from '@/components/ui/icon-button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import { usePromotionActions, usePromotions } from '../hooks/usePromotions'
import {
  isPromotionOver,
  PROMOTION_STATUS_TONE,
  promotionRunsOn,
  promotionSummary,
  type Promotion,
} from '../promotionTypes'
import { PromotionForm } from './PromotionForm'
import { toast } from '@/utils/toast'
import { cn } from '@/utils/cn'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'

type Filter = 'today' | 'past' | 'all' | 'date'

const FILTERS: { value: Exclude<Filter, 'date'>; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'past', label: 'Past' },
  { value: 'all', label: 'All' },
]

const DAY_CHOICES = [1, 3, 7, 15, 30]

const dateLabel = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(iso)) : null

/** "12 Oct – 15 Oct", "From 12 Oct", "Till 15 Oct". */
function runLabel(p: Promotion): string {
  const from = dateLabel(p.startsAt ?? p.createdAt)
  const to = dateLabel(p.endsAt)
  if (from && to) return from === to ? from : `${from} – ${to}`
  return to ? `Till ${to}` : from ? `From ${from}` : 'No end date'
}

/**
 * The shop's offers, under the Products screen: what runs today, what ran
 * before (or on a picked date), and a one-tap Repeat that runs an old offer
 * again for as many days as the owner chooses.
 */
export function ProductOffersPanel() {
  const { data, isLoading, isError, refetch } = usePromotions()
  const { setStatus } = usePromotionActions()
  const [filter, setFilter] = useState<Filter>('today')
  const [day, setDay] = useState('')
  const [repeatOf, setRepeatOf] = useState<Promotion | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Promotion | null>(null)

  const shown = useMemo(() => {
    const all = data ?? []
    if (filter === 'past') return all.filter((p) => isPromotionOver(p))
    if (filter === 'today') return all.filter((p) => !isPromotionOver(p) && promotionRunsOn(p, new Date()))
    if (filter === 'date' && day) return all.filter((p) => promotionRunsOn(p, new Date(`${day}T12:00:00`)))
    return all
  }, [data, filter, day])

  function toggleStatus(p: Promotion) {
    setStatus.mutate(
      { id: p.id, action: p.status === 'paused' ? 'resume' : 'pause' },
      { onError: (err) => toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic) },
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center">
        <Spinner size={32} label="Loading offers" />
      </div>
    )
  }
  if (isError) return <ErrorState onRetry={() => void refetch()} />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={cn(
              'rounded-full border px-4 py-2 text-caption font-semibold transition-colors',
              filter === f.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-surface text-foreground hover:border-primary/60',
            )}
          >
            {f.label}
          </button>
        ))}
        {/* A picked date shows every offer that ran (or will run) that day. */}
        <label
          className={cn(
            'relative inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-caption font-semibold transition-colors',
            filter === 'date' ? 'border-primary bg-primary-soft text-primary' : 'border-border bg-surface text-foreground',
          )}
        >
          <CalendarDays className="size-4" aria-hidden />
          <input
            type="date"
            value={day}
            aria-label="Offers on a date"
            onChange={(e) => {
              setDay(e.target.value)
              setFilter(e.target.value ? 'date' : 'today')
            }}
            className="w-[7.5rem] bg-transparent outline-none"
          />
          {filter === 'date' && (
            <button
              type="button"
              aria-label="Clear date"
              onClick={() => {
                setDay('')
                setFilter('today')
              }}
            >
              <X className="size-3.5" aria-hidden />
            </button>
          )}
        </label>
        <Button
          size="sm"
          className="ml-auto"
          leftIcon={<Plus className="size-4" />}
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          New offer
        </Button>
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="size-7" />}
          title={filter === 'today' ? 'No offers running today' : filter === 'past' ? 'No past offers yet' : 'No offers here'}
          description={
            filter === 'today'
              ? 'Start one from a product’s “Add offer”, or repeat a past one.'
              : 'Offers you run will show up here.'
          }
          actionLabel={filter === 'today' ? 'See past offers' : undefined}
          onAction={filter === 'today' ? () => setFilter('past') : undefined}
        />
      ) : (
        <Stagger className="grid gap-3 sm:grid-cols-2">
          {shown.map((p) => {
            const over = isPromotionOver(p)
            return (
              <StaggerItem key={p.id}>
                <Card padding="sm" className={cn('flex h-full gap-3', over && 'bg-surface-muted/60')}>
                  <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-muted">
                    {p.productImage ? (
                      <img src={p.productImage} alt="" className={cn('size-full object-cover', over && 'grayscale')} />
                    ) : (
                      <Utensils className="size-5 text-text-muted" aria-hidden />
                    )}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-1 text-body font-semibold text-foreground">{p.name}</p>
                      <Badge tone={p.isActiveNow ? 'success' : PROMOTION_STATUS_TONE[over ? 'expired' : p.status]} size="sm">
                        {p.isActiveNow ? 'Live' : over ? 'Ended' : p.status}
                      </Badge>
                    </div>
                    <p className="text-caption font-semibold text-offer">{promotionSummary(p)}</p>
                    <p className="truncate text-small text-text-muted">
                      {p.productName ?? 'All products'} · {runLabel(p)}
                    </p>
                    <div className="mt-auto flex items-center justify-end gap-1 pt-2">
                      {!over && (
                        <IconButton
                          size="sm"
                          aria-label={p.status === 'paused' ? 'Resume' : 'Pause'}
                          onClick={() => toggleStatus(p)}
                          disabled={setStatus.isPending}
                        >
                          {p.status === 'paused' ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
                        </IconButton>
                      )}
                      {!over && (
                        <IconButton
                          size="sm"
                          aria-label={`Edit ${p.name}`}
                          onClick={() => {
                            setEditing(p)
                            setFormOpen(true)
                          }}
                        >
                          <Pencil className="size-4" aria-hidden />
                        </IconButton>
                      )}
                      <Button
                        size="sm"
                        variant={over ? 'primary' : 'outline'}
                        leftIcon={<Repeat2 className="size-4" />}
                        onClick={() => setRepeatOf(p)}
                      >
                        Repeat
                      </Button>
                    </div>
                  </div>
                </Card>
              </StaggerItem>
            )
          })}
        </Stagger>
      )}

      <RepeatOfferDialog promotion={repeatOf} onClose={() => setRepeatOf(null)} onDone={() => setFilter('today')} />
      <PromotionForm open={formOpen} onOpenChange={setFormOpen} promotion={editing} />
    </div>
  )
}

/** Pick how many days the repeated offer should run: quick chips or a number. */
function RepeatOfferDialog({
  promotion,
  onClose,
  onDone,
}: {
  promotion: Promotion | null
  onClose: () => void
  onDone: () => void
}) {
  const { repeat } = usePromotionActions()
  const [days, setDays] = useState(1)
  const [custom, setCustom] = useState('')

  const chosen = custom ? Math.min(90, Math.max(1, Number(custom) || 1)) : days
  const until = new Date()
  until.setDate(until.getDate() + chosen - 1)

  function submit() {
    if (!promotion) return
    repeat.mutate(
      { id: promotion.id, days: chosen },
      {
        onSuccess: () => {
          toast.success(`${promotion.name} is live for ${chosen} ${chosen === 1 ? 'day' : 'days'}`)
          onClose()
          onDone()
          setCustom('')
          setDays(1)
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic),
      },
    )
  }

  return (
    <Dialog open={promotion !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Repeat offer</DialogTitle>
          {promotion && (
            <DialogDescription>
              {promotion.name} · {promotionSummary(promotion)}
              {promotion.productName && ` on ${promotion.productName}`}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-caption font-semibold text-foreground">Run it for</p>
          <div className="flex flex-wrap gap-2">
            {DAY_CHOICES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setDays(d)
                  setCustom('')
                }}
                aria-pressed={!custom && days === d}
                className={cn(
                  'rounded-full border px-4 py-2 text-caption font-semibold transition-colors',
                  !custom && days === d
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-surface text-foreground hover:border-primary/60',
                )}
              >
                {d === 1 ? 'Today' : `${d} days`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              inputMode="numeric"
              value={custom}
              onChange={(e) => setCustom(e.target.value.replace(/\D/g, '').slice(0, 2))}
              placeholder="Other"
              aria-label="Number of days"
              className="w-24"
            />
            <span className="text-caption text-text-secondary">days (up to 90)</span>
          </div>
          <p className="rounded-xl bg-offer-soft px-3 py-2 text-small text-text-secondary">
            Starts now, ends{' '}
            <span className="font-semibold text-foreground">
              {new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).format(until)}
            </span>{' '}
            at midnight.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={repeat.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} isLoading={repeat.isPending} leftIcon={<Repeat2 className="size-4" />}>
            Start offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
