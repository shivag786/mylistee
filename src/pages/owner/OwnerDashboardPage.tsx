import { Link } from 'react-router-dom'
import {
  Users,
  Sparkles,
  Gift,
  BadgeCheck,
  QrCode,
  Store,
  Tag,
  ScanLine,
  type LucideIcon,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { MetricCard } from '@/components/data/MetricCard'
import { Reveal } from '@/components/motion/Reveal'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useDashboard } from '@/features/owner/hooks/useOwner'
import { OnboardingChecklist } from '@/features/owner/components/OnboardingChecklist'
import type { DashboardMetrics } from '@/features/owner/types'

interface MetricDef {
  key: keyof DashboardMetrics
  label: string
  icon: LucideIcon
  /** True for metrics whose data lands in a later milestone. */
  soon?: boolean
}

const METRICS: MetricDef[] = [
  { key: 'todayVisitors', label: "Today's visitors", icon: Users },
  { key: 'todaySpins', label: "Today's spins", icon: Sparkles },
  { key: 'todayRewards', label: 'Rewards won', icon: Gift },
  { key: 'todayRedemptions', label: 'Redemptions', icon: BadgeCheck },
]

export function OwnerDashboardPage() {
  const { user } = useAuth()
  const { data, isLoading, isError, refetch } = useDashboard()

  if (isLoading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <Spinner size={32} label="Loading dashboard" />
      </div>
    )
  }

  if (isError || !data) {
    return <ErrorState onRetry={() => void refetch()} />
  }

  const firstName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-5">
      <div>
        <p className="text-caption text-text-secondary">Welcome back,</p>
        <h1 className="text-title font-bold text-foreground">{firstName} 👋</h1>
      </div>

      <OnboardingChecklist items={data.onboarding} />

      <section aria-label="Today at a glance" className="space-y-3">
        <h2 className="text-body-lg font-semibold text-foreground">Today at a glance</h2>
        <div className="grid grid-cols-2 gap-3">
          {METRICS.map((m) => (
            <MetricCard
              key={m.key}
              label={m.label}
              value={data.metrics[m.key]}
              icon={m.icon}
              muted={m.soon}
              hint={m.soon ? 'Available soon' : undefined}
            />
          ))}
        </div>
      </section>

      <section aria-label="Quick actions" className="space-y-3">
        <h2 className="text-body-lg font-semibold text-foreground">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickAction to={ROUTES.owner.redeem} icon={ScanLine} label="Redeem reward" />
          <QuickAction to={ROUTES.owner.offers} icon={Tag} label="Manage offers" />
          <QuickAction to={ROUTES.owner.qr} icon={QrCode} label="Download QR" />
          <QuickAction to={ROUTES.owner.profile} icon={Store} label="Edit profile" />
        </div>
      </section>

      <Reveal>
        <Link
          to={ROUTES.owner.subscription}
          className="block rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <Card className="flex items-center justify-between" elevation="soft" interactive>
            <div>
              <p className="text-caption text-text-secondary">Current plan</p>
              <p className="text-body-lg font-semibold text-foreground">{data.plan.name}</p>
            </div>
            <Badge tone="neutral">
              {data.plan.maxActiveOffers === null
                ? 'Unlimited offers'
                : `Up to ${data.plan.maxActiveOffers} offers`}
            </Badge>
          </Card>
        </Link>
      </Reveal>
    </div>
  )
}

interface QuickActionProps {
  icon: LucideIcon
  label: string
  to?: string
  soon?: boolean
}

function QuickAction({ icon: Icon, label, to, soon }: QuickActionProps) {
  const content = (
    <Card
      elevation="soft"
      padding="md"
      className="flex h-full flex-col items-start gap-3"
      interactive={!soon}
    >
      <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="flex items-center gap-2 text-body font-medium text-foreground">
        {label}
        {soon && <Badge tone="neutral" size="sm">Soon</Badge>}
      </span>
    </Card>
  )

  if (soon || !to) {
    return (
      <div aria-disabled className="cursor-not-allowed opacity-70">
        {content}
      </div>
    )
  }

  return (
    <Link to={to} className="rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
      {content}
    </Link>
  )
}
