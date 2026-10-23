import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Confetti } from '@/components/motion/Confetti'
import { AlertTriangle, CalendarClock, Copy, CreditCard, History, Gift, Link2, Mail, Share2, ShieldCheck, Store } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { toast } from '@/utils/toast'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/constants/routes'
import { useOwnerBusiness } from '@/features/owner/hooks/useOwner'
import { isCheckoutCancelled } from '@/features/owner/hooks/usePlanCheckout'
import { PersonalLinkHistory } from '@/features/owner/components/PersonalLinkHistory'
import {
  expiryAfterAdding,
  useBuyPersonalLinkPack,
  usePersonalLink,
  useTogglePersonalLink,
  type PersonalLinkPack,
} from '@/features/owner/personalLink'

const PACK_LABEL: Record<PersonalLinkPack['key'], string> = {
  month: '1 Month',
  quarter: '3 Months',
  year: '1 Year',
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })

/**
 * Personal link — the owner's own shop link. Customers who open it (or scan the
 * QR) see only this shop. Switch on → free trial → buy day packs.
 */
export function PersonalLinkPage() {
  const { data: state, isLoading, isError, refetch } = usePersonalLink()
  const { data: business } = useOwnerBusiness()
  const toggle = useTogglePersonalLink()
  const { buy, isPending: buying, activePack } = useBuyPersonalLinkPack()
  // Bumped on every activation so the confetti replays.
  const [party, setParty] = useState(0)

  if (isLoading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Spinner size={32} label="Loading personal link" />
      </div>
    )
  }
  if (isError || !state) return <ErrorState onRetry={() => void refetch()} />

  const link = business ? `${window.location.origin}${ROUTES.businessProfile(business.slug)}` : ''
  const pendingLinks = state.history.filter((g) => g.status === 'pending' && g.linkUrl)
  const expiringSoon = state.active && state.daysLeft <= 2
  const needsPack = state.enabled && !state.active

  function onToggle(next: boolean) {
    toggle.mutate(next, {
      onSuccess: (s) => {
        if (!next) toast.success('Personal link switched off')
        else if (s.active && s.onTrial) {
          toast.success(`Free trial started — ${s.daysLeft} days`)
          setParty((n) => n + 1)
        }
        else if (s.active) toast.success('Personal link is live')
        else toast.info('Your free trial is over — choose a pack below to go live')
      },
      onError: (e) => toast.error(e.message),
    })
  }

  function onBuy(pack: PersonalLinkPack) {
    buy(pack.key, {
      onSuccess: (s) => {
        toast.success(`Payment successful — ${s.daysLeft} days active`)
        setParty((n) => n + 1)
      },
      onError: (e) => {
        if (!isCheckoutCancelled(e)) toast.error(e.message)
      },
    })
  }

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: business?.name, url: link })
      else {
        await navigator.clipboard.writeText(link)
        toast.success('Link copied')
      }
    } catch {
      /* dismissed */
    }
  }

  return (
    <div className="space-y-5">
      {party > 0 && <Confetti key={party} count={90} />}
      <header>
        <h1 className="text-title font-bold text-foreground">Personal link</h1>
        <p className="text-caption text-text-secondary">
          Your own shop link — customers who open it or scan your QR see <b>only your shop</b>.
        </p>
      </header>

      {/* Status + switch */}
      <Card
        padding="lg"
        elevation="soft"
        className={cn(
          'space-y-4',
          state.active && !expiringSoon && 'border-success/40 bg-success-soft/40',
          expiringSoon && 'border-warning/50 bg-warning-soft/50',
          needsPack && 'border-danger/40 bg-destructive-soft/40',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'grid size-11 shrink-0 place-items-center rounded-full',
                state.active ? 'bg-success text-success-foreground' : 'bg-surface-muted text-text-muted',
              )}
            >
              <Link2 className="size-5" aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-foreground">
                {state.active ? 'Personal link is ON' : state.enabled ? 'Personal link is paused' : 'Personal link is OFF'}
              </p>
              <p className="text-small text-text-secondary">
                {state.active
                  ? state.onTrial
                    ? 'Free trial running'
                    : 'Paid pack running'
                  : state.trialAvailable
                    ? `Switch on to start your ${state.trialDays}-day free trial`
                    : state.enabled
                      ? 'No days left — choose a pack below'
                      : 'Switch on to use your remaining days or buy a pack'}
              </p>
            </div>
          </div>
          <Switch
            checked={state.enabled}
            onCheckedChange={onToggle}
            disabled={toggle.isPending}
            aria-label="Personal link"
          />
        </div>

        {state.active && state.expiresAt && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface p-3 text-center ring-1 ring-border">
              <p className={cn('text-display font-bold leading-none', expiringSoon ? 'text-warning' : 'text-success')}>
                {state.daysLeft}
              </p>
              <p className="mt-1 text-small text-text-secondary">{state.daysLeft === 1 ? 'day left' : 'days left'}</p>
            </div>
            <div className="flex flex-col justify-center rounded-xl bg-surface p-3 ring-1 ring-border">
              <p className="inline-flex items-center gap-1 text-small text-text-muted">
                <CalendarClock className="size-3.5" aria-hidden /> Expires on
              </p>
              <p className="text-caption font-semibold text-foreground">{formatDate(state.expiresAt)}</p>
            </div>
          </div>
        )}

        {expiringSoon && (
          <p className="flex items-start gap-2 rounded-lg bg-surface px-3 py-2 text-small text-foreground ring-1 ring-warning/40">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            Expiring soon — renew now so customers keep seeing only your shop. New days are added on top.
          </p>
        )}

        {state.enabled && link && (
          <div className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 ring-1 ring-border">
            <p className="min-w-0 flex-1 truncate text-small text-text-secondary">{link}</p>
            <Button size="sm" variant="ghost" leftIcon={<Copy className="size-4" />} onClick={() => void navigator.clipboard.writeText(link).then(() => toast.success('Link copied'))}>
              Copy
            </Button>
            <Button size="sm" variant="outline" leftIcon={<Share2 className="size-4" />} onClick={() => void share()}>
              Share
            </Button>
          </div>
        )}
      </Card>

      {/* Payment requests sent by Listee */}
      {pendingLinks.map((g) => (
        <Card key={g.id} padding="md" elevation="soft" className="flex flex-wrap items-center gap-3 border-2 border-primary/40">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
            <CreditCard className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">Payment request: {g.days} days for ₹{g.amount}</p>
            <p className="text-small text-text-secondary">
              Sent by Listee{g.note ? ` · ${g.note}` : ''}. Valid till{' '}
              <b>{formatDate(expiryAfterAdding(state.expiresAt, g.days).toISOString())}</b> once paid.
            </p>
          </div>
          <Button size="md" onClick={() => window.location.assign(g.linkUrl!)}>
            Pay ₹{g.amount}
          </Button>
        </Card>
      ))}

      {/* Packs */}
      <section className="space-y-3">
        <div>
          <h2 className="text-body-lg font-bold text-foreground">
            {state.active ? 'Add more days' : 'Choose a pack'}
          </h2>
          <p className="text-small text-text-secondary">
            Just ₹5 a day. Pay once with UPI, card or net banking — your link goes live instantly.
            {state.active && ` You have ${state.daysLeft} days left — new days are added after them.`}
          </p>
        </div>

        {!state.paymentsLive && (
          <p className="rounded-lg bg-warning-soft px-3 py-2 text-small text-foreground">
            Online payments are not set up yet. Please contact support to buy a pack.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          {state.packs.map((pack) => {
            const best = pack.key === 'year'
            const save = Math.round(pack.regularPrice - pack.price)
            return (
              <Card
                key={pack.key}
                padding="md"
                elevation="soft"
                className={cn('relative flex flex-col gap-2', best && 'border-2 border-primary')}
              >
                {best && (
                  <Badge tone="primary" className="absolute -top-2.5 left-3 bg-primary text-primary-foreground">
                    Best value
                  </Badge>
                )}
                <p className="text-caption font-semibold text-text-secondary">{PACK_LABEL[pack.key]}</p>
                <p className="flex items-baseline gap-2">
                  <span className="text-title font-bold text-foreground">₹{pack.price}</span>
                  {save > 0 && <span className="text-small text-text-muted line-through">₹{pack.regularPrice}</span>}
                </p>
                <p className="text-small text-text-secondary">
                  {pack.days} days · ₹{pack.perDay}/day
                </p>
                <p className="text-small text-text-secondary">
                  Valid till{' '}
                  <span className="font-semibold text-foreground">
                    {expiryAfterAdding(state.active ? state.expiresAt : null, pack.days).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </p>
                {save > 0 && (
                  <Badge tone="success" className="w-fit">
                    Save ₹{save}
                  </Badge>
                )}
                <Button
                  className="mt-auto"
                  size="md"
                  variant={best ? 'primary' : 'outline'}
                  fullWidth
                  disabled={!state.paymentsLive || buying}
                  isLoading={buying && activePack === pack.key}
                  onClick={() => onBuy(pack)}
                >
                  Pay ₹{pack.price}
                </Button>
              </Card>
            )
          })}
        </div>
      </section>

      {state.history.length > 0 && (
        <Card padding="lg" className="space-y-2">
          <p className="inline-flex items-center gap-2 font-semibold text-foreground">
            <History className="size-4 text-text-muted" aria-hidden /> Package history
          </p>
          <PersonalLinkHistory items={state.history} />
        </Card>
      )}

      {/* What it does */}
      <Card padding="lg" className="space-y-3">
        <p className="font-semibold text-foreground">How it works</p>
        <ul className="space-y-2.5 text-small text-text-secondary">
          <Step icon={<Gift className="size-4" />}>
            Switch on → <b>{state.trialDays} days free</b> (one time per shop).
          </Step>
          <Step icon={<Store className="size-4" />}>
            Customers who open your link or scan your QR see <b>only your shop</b> — no other shops, no distractions.
          </Step>
          <Step icon={<ShieldCheck className="size-4" />}>
            After the trial, choose a pack. Days are added on top of what is left — nothing is lost.
          </Step>
          <Step icon={<CalendarClock className="size-4" />}>
            We remind you 2 days before it runs out. If it expires, your link still works but shows the full Listee app.
          </Step>
        </ul>
      </Card>

      {business && !business.email && (
        <Card padding="md" className="flex items-start gap-3">
          <Mail className="mt-0.5 size-5 shrink-0 text-info" aria-hidden />
          <div className="text-small text-text-secondary">
            <p className="font-semibold text-foreground">Get expiry reminders on email too</p>
            Add your email in{' '}
            <Link to={ROUTES.owner.profile} className="font-semibold text-primary hover:underline">
              Business profile
            </Link>
            . App notifications come either way.
          </div>
        </Card>
      )}
    </div>
  )
}

function Step({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">{icon}</span>
      <span>{children}</span>
    </li>
  )
}

