import { Link } from 'react-router-dom'
import { ChevronRight, Link2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import { usePersonalLink } from '../personalLink'

/** Dashboard tile: personal link on or off at a glance, one tap to manage. */
export function PersonalLinkCard() {
  const { data: s } = usePersonalLink()
  if (!s) return null

  const [badge, tone, line] = s.active
    ? (['On', 'success', 'Customers see only your shop'] as const)
    : (['Free', 'primary', 'Customers see only your shop — free, never expires'] as const)

  return (
    <Link
      to={ROUTES.owner.personalLink}
      className="block rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      <Card
        elevation="soft"
        interactive
        className={cn('flex items-center gap-3', !s.active && 'bg-gradient-to-br from-gold-soft to-primary-soft')}
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
