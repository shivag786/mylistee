import { Link } from 'react-router-dom'
import { ChevronRight, Link2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import { usePersonalLink } from '../personalLink'

/** Dashboard tile: personal link status at a glance, days left, one tap to manage. */
export function PersonalLinkCard() {
  const { data: s } = usePersonalLink()
  if (!s) return null

  const soon = s.active && s.daysLeft <= 2
  const [badge, tone, line] = s.active
    ? ([
        `${s.daysLeft} ${s.daysLeft === 1 ? 'day' : 'days'} left`,
        soon ? 'warning' : 'success',
        soon ? 'Expiring soon — renew now' : s.onTrial ? 'Free trial running' : 'Customers see only your shop',
      ] as const)
    : s.trialAvailable
      ? ([`${s.trialDays} days free`, 'primary', 'Customers see only your shop — try it free'] as const)
      : (['Off', 'neutral', `From ₹${s.packs[0]?.price ?? 150} / ${s.packs[0]?.days ?? 30} days`] as const)

  return (
    <Link
      to={ROUTES.owner.personalLink}
      className="block rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      <Card
        elevation="soft"
        interactive
        className={cn(
          'flex items-center gap-3',
          soon ? 'border-warning/50 bg-warning-soft/50' : !s.active && 'bg-gradient-to-br from-gold-soft to-primary-soft',
        )}
      >
        <span
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-xl',
            s.active ? 'bg-success text-success-foreground' : 'bg-primary text-primary-foreground',
          )}
        >
          <Link2 className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">Personal link</p>
          <p className="truncate text-small text-text-secondary">{line}</p>
        </div>
        <Badge tone={tone} size="md">
          {badge}
        </Badge>
        <ChevronRight className="size-4 shrink-0 text-text-muted" aria-hidden />
      </Card>
    </Link>
  )
}
