import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Store,
  Users,
  Tag,
  IndianRupee,
  Sparkles,
  BadgeCheck,
  CreditCard,
  Clock,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { MetricCard } from '@/components/data/MetricCard'
import { TrendChart, type TrendPoint } from '@/components/charts/TrendChart'
import { SegmentedControl } from '@/components/navigation/SegmentedControl'
import { Reveal } from '@/components/motion/Reveal'
import { ROUTES } from '@/constants/routes'
import { useAdminDashboard } from '@/features/admin/hooks/useAdmin'
import { formatPrice } from '@/features/owner/planDisplay'

interface StatDef {
  key: string
  label: string
  icon: LucideIcon
  value: (s: Record<string, number>) => number
  hint?: (s: Record<string, number>) => string | undefined
}

const STATS: StatDef[] = [
  { key: 'businesses', label: 'Businesses', icon: Store, value: (s) => s.totalBusinesses, hint: (s) => `${s.verifiedBusinesses} verified` },
  { key: 'customers', label: 'Customers', icon: Users, value: (s) => s.totalCustomers, hint: (s) => `${s.activeCustomers} active` },
  { key: 'activeOffers', label: 'Active offers', icon: Tag, value: (s) => s.activeOffers },
  { key: 'subscriptions', label: 'Subscriptions', icon: CreditCard, value: (s) => s.activeSubscriptions },
  { key: 'spinsToday', label: 'Spins today', icon: Sparkles, value: (s) => s.spinsToday },
  { key: 'redemptionsToday', label: 'Redeemed today', icon: BadgeCheck, value: (s) => s.redemptionsToday },
  { key: 'pending', label: 'Pending approvals', icon: Clock, value: (s) => s.pendingApprovals },
]

export function AdminDashboardPage() {
  const { data, isLoading, isError, refetch } = useAdminDashboard()
  const [series, setSeries] = useState<'customers' | 'businesses'>('customers')

  if (isLoading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <Spinner size={32} label="Loading dashboard" />
      </div>
    )
  }
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />

  const { stats, growth, health } = data
  const trend: TrendPoint[] = growth.map((g) => ({
    label: new Date(`${g.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: g[series],
  }))

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-title font-bold text-foreground">Platform overview</h1>
          <p className="text-caption text-text-secondary">Everything happening across Listee</p>
        </div>
        <HealthPills health={health} />
      </header>

      {/* Revenue highlight */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Reveal>
          <Card elevation="soft" className="flex items-center justify-between" padding="md">
            <div>
              <p className="text-caption text-text-secondary">Revenue (all time)</p>
              <p className="text-title font-bold text-foreground">{formatPrice(stats.revenueTotal)}</p>
            </div>
            <span className="grid size-11 place-items-center rounded-full bg-success-soft text-success">
              <IndianRupee className="size-5" aria-hidden />
            </span>
          </Card>
        </Reveal>
        <Reveal>
          <Card elevation="soft" className="flex items-center justify-between" padding="md">
            <div>
              <p className="text-caption text-text-secondary">Revenue this month</p>
              <p className="text-title font-bold text-foreground">{formatPrice(stats.revenueThisMonth)}</p>
            </div>
            <span className="grid size-11 place-items-center rounded-full bg-primary-soft text-primary">
              <CreditCard className="size-5" aria-hidden />
            </span>
          </Card>
        </Reveal>
      </div>

      {/* Stat grid */}
      <section aria-label="Key stats" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATS.map((s) => (
          <MetricCard
            key={s.key}
            label={s.label}
            value={s.value(stats as unknown as Record<string, number>)}
            icon={s.icon}
            hint={s.hint?.(stats as unknown as Record<string, number>)}
          />
        ))}
      </section>

      {/* Growth */}
      <Reveal>
        <Card elevation="soft" className="space-y-4" padding="md">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-body-lg font-semibold text-foreground">Growth (30 days)</h2>
            <SegmentedControl
              options={[
                { value: 'customers', label: 'Customers' },
                { value: 'businesses', label: 'Businesses' },
              ]}
              value={series}
              onChange={setSeries}
              size="sm"
              ariaLabel="Growth series"
            />
          </div>
          <TrendChart
            data={trend}
            color={series === 'customers' ? 'var(--chart-1)' : 'var(--chart-2)'}
            seriesLabel={series === 'customers' ? 'New customers' : 'New businesses'}
          />
        </Card>
      </Reveal>

      {/* Pending + fraud shortcuts */}
      <div className="grid gap-3 sm:grid-cols-2">
        {stats.pendingApprovals > 0 && (
          <Link to={ROUTES.admin.businesses} className="block">
            <Card interactive elevation="soft" className="flex items-center gap-3" padding="md">
              <span className="grid size-10 place-items-center rounded-full bg-warning-soft text-warning">
                <Clock className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-body font-medium text-foreground">{stats.pendingApprovals} pending approvals</p>
                <p className="text-caption text-text-secondary">Review new businesses</p>
              </div>
            </Card>
          </Link>
        )}
        <Link to={ROUTES.admin.fraud} className="block">
          <Card interactive elevation="soft" className="flex items-center gap-3" padding="md">
            <span className="grid size-10 place-items-center rounded-full bg-danger-soft text-danger">
              <ShieldAlert className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-body font-medium text-foreground">Fraud signals</p>
              <p className="text-caption text-text-secondary">Review suspicious activity</p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  )
}

function HealthPills({ health }: { health: { database: string; cache: string; queue: string } }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone={health.database === 'ok' ? 'success' : 'danger'} size="sm">
        DB: {health.database}
      </Badge>
      <Badge tone="neutral" size="sm">Cache: {health.cache}</Badge>
      <Badge tone="neutral" size="sm">Queue: {health.queue}</Badge>
    </div>
  )
}
