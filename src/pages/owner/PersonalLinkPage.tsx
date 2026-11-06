import { useState } from 'react'
import { Confetti } from '@/components/motion/Confetti'
import { Copy, Infinity as InfinityIcon, Link2, Share2, Store } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { toast } from '@/utils/toast'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/constants/routes'
import { useOwnerBusiness } from '@/features/owner/hooks/useOwner'
import { usePersonalLink, useTogglePersonalLink } from '@/features/owner/personalLink'

/**
 * Personal link — the owner's own shop link. Customers who open it (or scan the
 * QR) see only this shop. Free, and it never expires — just switch it on.
 */
export function PersonalLinkPage() {
  const { data: state, isLoading, isError, refetch } = usePersonalLink()
  const { data: business } = useOwnerBusiness()
  const toggle = useTogglePersonalLink()
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

  function onToggle(next: boolean) {
    toggle.mutate(next, {
      onSuccess: () => {
        if (next) {
          toast.success('Personal link is live')
          setParty((n) => n + 1)
        } else {
          toast.success('Personal link switched off')
        }
      },
      onError: (e) => toast.error(e.message),
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

      <Card padding="lg" elevation="soft" className={cn('space-y-4', state.active && 'border-success/40 bg-success-soft/40')}>
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
              <p className="font-semibold text-foreground">{state.active ? 'Personal link is ON' : 'Personal link is OFF'}</p>
              <p className="text-small text-text-secondary">
                {state.active ? 'Free · never expires' : 'Switch on — it is free and never expires'}
              </p>
            </div>
          </div>
          <Switch checked={state.enabled} onCheckedChange={onToggle} disabled={toggle.isPending} aria-label="Personal link" />
        </div>

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

      <Card padding="lg" className="space-y-3">
        <p className="font-semibold text-foreground">How it works</p>
        <ul className="space-y-2.5 text-small text-text-secondary">
          <Step icon={<Store className="size-4" />}>
            Customers who open your link or scan your QR see <b>only your shop</b> — no other shops, no distractions.
          </Step>
          <Step icon={<InfinityIcon className="size-4" />}>
            <b>Free and never expires.</b> It stays on until you switch it off.
          </Step>
          <Step icon={<Share2 className="size-4" />}>
            Put it in your WhatsApp status, Instagram bio and Google listing.
          </Step>
        </ul>
      </Card>
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
