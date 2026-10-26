import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import { planModuleLabel } from '../planDisplay'
import type { ModuleAccess } from '../types'

/**
 * "This is not in your plan" — shown on a module's page when the shop's plan
 * leaves it out, its trial days ran out, or the plan itself ended. What the
 * owner set up before stays; it just cannot be changed until they upgrade.
 */
export function PlanLockCard({
  module,
  access,
  readOnly,
  className,
}: {
  module: string
  access: ModuleAccess
  /** The page below still shows what they had. */
  readOnly?: boolean
  className?: string
}) {
  const label = planModuleLabel(module)
  const title =
    access.reason === 'expired'
      ? 'Your plan has ended'
      : access.reason === 'days'
        ? `Your ${label} trial is over`
        : `${label} is not in your plan`
  const body =
    access.reason === 'expired'
      ? `Your shop and menu stay live. Choose a plan to use ${label} again.`
      : `Upgrade to use ${label}.${readOnly ? ' What you set up before is still here.' : ''}`

  return (
    <Card padding="md" className={cn('flex flex-wrap items-center gap-3 border-premium/40 bg-premium-soft', className)}>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-premium text-white">
        <Lock className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-small text-text-secondary">{body}</p>
      </div>
      <Button asChild size="sm">
        <Link to={ROUTES.owner.subscription}>See plans</Link>
      </Button>
    </Card>
  )
}
