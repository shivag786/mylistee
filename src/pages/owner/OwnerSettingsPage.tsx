import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BellRing, Bike, ChevronRight, Clock, Link2, PauseCircle, Store, Volume2 } from 'lucide-react'
import { apiClient } from '@/services/apiClient'
import { ApiError } from '@/types/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/utils/toast'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/constants/routes'
import { useOwnerBusiness } from '@/features/owner/hooks/useOwner'
import { PushToggle } from '@/features/notifications/components/PushToggle'
import { setOrderSound, useOrderSound } from '@/features/owner/orderSound'
import { beep } from '@/utils/beep'
import { formatClosedUntil, useCloseShop, usePauseOrders, useReopenShop } from '@/features/owner/availability'
import { useServiceSettings, useUpdateServiceSettings } from '@/features/owner/hooks/useServiceSettings'
import { SERVICE_TYPES } from '@/features/orders/serviceTypes'

/** Owner settings — switches an owner reaches for day to day. */
export function OwnerSettingsPage() {
  const { data: business, isLoading, isError, refetch } = useOwnerBusiness()
  const sound = useOrderSound()
  const pause = usePauseOrders()
  const reopen = useReopenShop()
  const [closing, setClosing] = useState(false)

  if (isLoading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Spinner size={32} label="Loading settings" />
      </div>
    )
  }
  if (isError || !business) return <ErrorState onRetry={() => void refetch()} />

  const closedUntil = business.closedUntil ?? null

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-title font-bold text-foreground">Settings</h1>
        <p className="text-caption text-text-secondary">Notifications and shop availability</p>
      </header>

      <Section title="Notifications">
        <PushToggle
          className="px-4 py-3.5"
          title="Order notifications"
          hint="Get a notification on this phone for every new order, even when the app is closed."
        />
        <TestAlertRow />
        <Row icon={<Volume2 className="size-5" />} title="New order sound" hint="Ring while the app is open. Applies to this device.">
          <Switch
            checked={sound}
            onCheckedChange={(v) => {
              setOrderSound(v)
              if (v) beep()
            }}
            aria-label="New order sound"
          />
        </Row>
      </Section>

      <Section title="Shop availability">
        <Row
          icon={<Store className="size-5" />}
          title="Shop closed"
          tone={closedUntil ? 'danger' : undefined}
          hint={
            closedUntil
              ? `Closed until ${formatClosedUntil(closedUntil)}${business.closedNote ? ` · ${business.closedNote}` : ''}. Opens again by itself.`
              : 'Going on leave or a holiday? Close the shop for a while — customers see until when.'
          }
        >
          <Switch
            checked={Boolean(closedUntil)}
            onCheckedChange={(v) => {
              if (v) setClosing(true)
              else
                reopen.mutate(undefined, {
                  onSuccess: () => toast.success('Shop is open again'),
                  onError: (e) => toast.error(e.message),
                })
            }}
            disabled={reopen.isPending}
            aria-label="Shop closed"
          />
        </Row>
        <Row
          icon={<PauseCircle className="size-5" />}
          title="Show menu only (pause orders)"
          tone={business.ordersPaused ? 'warning' : undefined}
          hint={
            business.ordersPaused
              ? 'Customers see your menu as a catalogue and “We are not taking orders right now”. Switch off when you are ready.'
              : 'Too busy right now? Keep showing your menu but stop new orders for a while.'
          }
        >
          <Switch
            checked={Boolean(business.ordersPaused)}
            onCheckedChange={(v) =>
              pause.mutate(v, {
                onSuccess: () => toast.success(v ? 'New orders paused' : 'Taking orders again'),
                onError: (e) => toast.error(e.message),
              })
            }
            disabled={pause.isPending}
            aria-label="Show menu only (pause orders)"
          />
        </Row>
        <DeliveryRow />
      </Section>

      <Section title="More">
        <LinkRow to={ROUTES.owner.personalLink} icon={<Link2 className="size-5" />} title="Personal link" />
        <LinkRow to={ROUTES.owner.profile} icon={<Clock className="size-5" />} title="Shop hours & details" />
      </Section>

      <CloseShopDialog open={closing} onClose={() => setClosing(false)} />
    </div>
  )
}

const DURATIONS: { label: string; hours: number; pick?: number[]; unit?: string }[] = [
  { label: 'Few hours', hours: 2, pick: [1, 2, 3, 4, 6], unit: 'hours' },
  { label: '1 day', hours: 24 },
  { label: '3 to 5 days', hours: 72, pick: [3, 4, 5], unit: 'days' },
  { label: '1 week', hours: 168 },
  { label: '1 month', hours: 720 },
]

function CloseShopDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const close = useCloseShop()
  const [choice, setChoice] = useState(1)
  const [hours, setHours] = useState(24)
  const [note, setNote] = useState('')

  const option = DURATIONS[choice]
  const until = new Date(Date.now() + hours * 3_600_000).toISOString()

  function pickOption(i: number) {
    setChoice(i)
    setHours(DURATIONS[i].hours)
  }

  function submit() {
    close.mutate(
      { hours, note: note.trim() || undefined },
      {
        onSuccess: (b) => {
          toast.success(`Shop closed until ${formatClosedUntil(b.closedUntil ?? until)}`)
          setNote('')
          onClose()
        },
        onError: (e) => toast.error(e.message),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Close shop for how long?</DialogTitle>
          <DialogDescription>Customers see that you are closed and until when. No orders come in meanwhile.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Duration">
            {DURATIONS.map((d, i) => (
              <button
                key={d.label}
                type="button"
                role="radio"
                aria-checked={choice === i}
                onClick={() => pickOption(i)}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-caption font-semibold transition-colors',
                  choice === i ? 'border-primary bg-primary-soft text-primary' : 'border-border text-foreground hover:border-border-strong',
                )}
              >
                {d.label}
              </button>
            ))}
          </div>

          {option.pick && (
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`How many ${option.unit}`}>
              {option.pick.map((n) => {
                const h = option.unit === 'days' ? n * 24 : n
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={hours === h}
                    onClick={() => setHours(h)}
                    className={cn(
                      'rounded-full border px-3.5 py-1.5 text-small font-semibold',
                      hours === h ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-text-secondary',
                    )}
                  >
                    {n} {option.unit === 'days' ? 'days' : n === 1 ? 'hour' : 'hours'}
                  </button>
                )
              })}
            </div>
          )}

          <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} placeholder="Reason for customers (optional) — e.g. Diwali holiday" />

          <p className="rounded-lg bg-surface-muted px-3 py-2 text-small text-text-secondary">
            Closed until <b className="text-foreground">{formatClosedUntil(until)}</b>, then opens by itself.
          </p>

          <div className="flex gap-2">
            <Button variant="ghost" size="md" onClick={onClose} disabled={close.isPending}>
              Cancel
            </Button>
            <Button variant="danger" size="md" fullWidth isLoading={close.isPending} onClick={submit}>
              Close shop
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-caption font-semibold uppercase tracking-wide text-text-muted">{title}</h2>
      <Card padding="none" elevation="soft" className="divide-y divide-border overflow-hidden">
        {children}
      </Card>
    </section>
  )
}

/** Home delivery on/off in one tap (the charge and other modes live in Tables & service). */
function DeliveryRow() {
  const { data } = useServiceSettings()
  const update = useUpdateServiceSettings()
  if (!data) return null

  const on = data.modes.includes('delivery')

  function toggle(next: boolean) {
    if (!data) return
    // Pickup is the always-on floor (as in Tables & service), so turning delivery
    // off never leaves the shop with no way to order.
    const modes = SERVICE_TYPES.filter((m) => m === 'pickup' || (m === 'delivery' ? next : data.modes.includes(m)))
    const defaultMode = modes.includes(data.defaultMode) ? data.defaultMode : 'pickup'
    update.mutate(
      { modes, defaultMode, deliveryFee: data.deliveryFee },
      {
        onSuccess: () => toast.success(next ? 'Home delivery is on' : 'Home delivery is off'),
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not update delivery.'),
      },
    )
  }

  return (
    <Row
      icon={<Bike className="size-5" />}
      title="Delivery available"
      hint={
        on
          ? `Customers can order home delivery${data.deliveryFee ? ` (₹${data.deliveryFee} charge)` : ' (free)'}.`
          : 'Off — customers order at the shop only. Set the delivery charge in Tables & service.'
      }
    >
      <Switch checked={on} onCheckedChange={toggle} disabled={update.isPending} aria-label="Delivery available" />
    </Row>
  )
}

/** Ring this phone with a sample order alert. The server says so if no phone has alerts on. */
function TestAlertRow() {
  const [sending, setSending] = useState(false)

  async function send() {
    setSending(true)
    try {
      await apiClient.post('business/order-alerts/test')
      toast.success('Test alert sent', 'It should pop up on this phone in a few seconds.')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not send a test alert.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Row icon={<BellRing className="size-5" />} title="Test order alert" hint="Check that a new order rings this phone.">
      <Button size="sm" variant="outline" isLoading={sending} onClick={() => void send()}>
        Send test
      </Button>
    </Row>
  )
}

function Row({
  icon,
  title,
  hint,
  tone,
  children,
}: {
  icon: ReactNode
  title: string
  hint: string
  tone?: 'danger' | 'warning'
  children: ReactNode
}) {
  return (
    <div className={cn('flex items-center gap-3 px-4 py-3.5', tone === 'danger' && 'bg-destructive-soft/40', tone === 'warning' && 'bg-warning-soft/50')}>
      <span
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-xl',
          tone === 'danger' ? 'bg-danger text-danger-foreground' : tone === 'warning' ? 'bg-warning text-warning-foreground' : 'bg-primary-soft text-primary',
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-small text-text-secondary">{hint}</p>
      </div>
      {children}
    </div>
  )
}

function LinkRow({ to, icon, title }: { to: string; icon: ReactNode; title: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-muted">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-muted text-text-secondary">{icon}</span>
      <p className="flex-1 font-semibold text-foreground">{title}</p>
      <ChevronRight className="size-4 text-text-muted" aria-hidden />
    </Link>
  )
}
