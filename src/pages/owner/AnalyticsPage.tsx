import { useState } from 'react'
import {
  Eye,
  Sparkles,
  Gift,
  BadgeCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  type LucideIcon,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Reveal } from '@/components/motion/Reveal'
import { SegmentedControl } from '@/components/navigation/SegmentedControl'
import { Sparkline } from '@/components/charts/Sparkline'
import { TrendChart, type TrendPoint } from '@/components/charts/TrendChart'
import { MeterBar } from '@/components/charts/MeterBar'
import { BarList, type BarListItem } from '@/components/charts/BarList'
import { useCountUp } from '@/hooks/useCountUp'
import { useAnalytics } from '@/features/owner/hooks/useOwner'
import type { AnalyticsData, AnalyticsMetricKey } from '@/features/owner/types'
import { cn } from '@/utils/cn'

interface MetricDef {
  key: AnalyticsMetricKey
  label: string
  icon: LucideIcon
  color: string
}

const METRICS: MetricDef[] = [
  { key: 'visits', label: 'Visits', icon: Eye, color: 'var(--chart-1)' },
  { key: 'spins', label: 'Spins', icon: Sparkles, color: 'var(--chart-2)' },
  { key: 'rewards', label: 'Rewards', icon: Gift, color: 'var(--chart-3)' },
  { key: 'redemptions', label: 'Redeemed', icon: BadgeCheck, color: 'var(--chart-4)' },
]

const RANGES = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
] as const

function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function AnalyticsPage() {
  const [days, setDays] = useState('30')
  const [metric, setMetric] = useState<AnalyticsMetricKey>('spins')
  const { data, isLoading, isError, refetch, isFetching } = useAnalytics(Number(days))

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-title font-bold text-foreground">Analytics</h1>
          <p className="text-caption text-text-secondary">How your rewards are performing</p>
        </div>
        <SegmentedControl
          options={RANGES.map((r) => ({ value: r.value, label: r.label }))}
          value={days}
          onChange={setDays}
          size="sm"
          ariaLabel="Date range"
        />
      </header>

      {isLoading ? (
        <div className="flex min-h-[50dvh] items-center justify-center">
          <Spinner size={32} label="Loading analytics" />
        </div>
      ) : isError || !data ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <AnalyticsContent
          data={data}
          metric={metric}
          onMetric={setMetric}
          isRefreshing={isFetching}
        />
      )}
    </div>
  )
}

interface ContentProps {
  data: AnalyticsData
  metric: AnalyticsMetricKey
  onMetric: (m: AnalyticsMetricKey) => void
  isRefreshing: boolean
}

function AnalyticsContent({ data, metric, onMetric, isRefreshing }: ContentProps) {
  const { summary, series, topOffers } = data
  const hasActivity = summary.visits.value + summary.spins.value > 0

  if (!hasActivity) {
    return (
      <EmptyState
        icon={<BarChart3 className="size-7" aria-hidden />}
        title="No activity yet"
        description="Share your QR code so customers can visit and spin. Your visits, spins and redemptions will appear here."
      />
    )
  }

  const activeMetric = METRICS.find((m) => m.key === metric) ?? METRICS[0]
  const trendData: TrendPoint[] = series.map((p) => ({
    label: formatShortDate(p.date),
    value: p[metric],
  }))

  const topOfferItems: BarListItem[] = topOffers.map((o) => ({
    label: o.title,
    value: o.rewards,
    sublabel: `${o.redemptions} redeemed · ${o.redemptionRate}% rate`,
  }))

  return (
    <div className={cn('space-y-5 transition-opacity', isRefreshing && 'opacity-60')}>
      {/* KPI tiles */}
      <section aria-label="Key metrics" className="grid grid-cols-2 gap-3">
        {METRICS.map((m) => (
          <MetricTile key={m.key} def={m} data={data} />
        ))}
      </section>

      {/* Trend chart */}
      <Reveal>
        <Card elevation="soft" className="space-y-4" padding="md">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-body-lg font-semibold text-foreground">Daily trend</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {METRICS.map((m) => {
              const isActive = m.key === metric
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => onMetric(m.key)}
                  aria-pressed={isActive}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1 text-small font-medium transition-colors',
                    isActive
                      ? 'border-transparent text-foreground'
                      : 'border-border text-text-secondary hover:text-foreground',
                  )}
                  style={isActive ? { backgroundColor: `color-mix(in srgb, ${m.color} 16%, transparent)` } : undefined}
                >
                  <span className="size-2 rounded-full" style={{ backgroundColor: m.color }} aria-hidden />
                  {m.label}
                </button>
              )
            })}
          </div>
          <TrendChart
            data={trendData}
            color={activeMetric.color}
            seriesLabel={activeMetric.label}
          />
        </Card>
      </Reveal>

      {/* Conversion */}
      <Reveal>
        <Card elevation="soft" className="space-y-4" padding="md">
          <h2 className="text-body-lg font-semibold text-foreground">Conversion &amp; loyalty</h2>
          <MeterBar
            label="Visit → spin rate"
            value={summary.spinConversionRate}
            color="var(--chart-2)"
            caption="Share of visitors who spun the wheel"
          />
          <MeterBar
            label="Reward redemption rate"
            value={summary.redemptionRate}
            color="var(--chart-4)"
            caption="Rewards that were actually redeemed in store"
          />
          <MeterBar
            label="Repeat customer rate"
            value={summary.repeatCustomerRate}
            color="var(--primary)"
            caption={`${summary.uniqueCustomers} customers in this period`}
          />
        </Card>
      </Reveal>

      {/* Top offers */}
      <Reveal>
        <Card elevation="soft" className="space-y-4" padding="md">
          <h2 className="text-body-lg font-semibold text-foreground">Top offers</h2>
          {topOfferItems.length > 0 ? (
            <BarList items={topOfferItems} color="var(--chart-3)" />
          ) : (
            <p className="py-4 text-center text-caption text-text-muted">
              No rewards won in this period yet.
            </p>
          )}
        </Card>
      </Reveal>
    </div>
  )
}

function MetricTile({ def, data }: { def: MetricDef; data: AnalyticsData }) {
  const { key, label, icon: Icon, color } = def
  const trend = data.summary[key]
  const value = useCountUp(trend.value)
  const spark = data.series.map((p) => p[key])

  return (
    <Card className="flex flex-col gap-2" elevation="soft" padding="md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-caption text-text-secondary">{label}</p>
          <p className="text-title font-bold text-foreground">{value}</p>
        </div>
        <span
          className="grid size-9 place-items-center rounded-full"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
        >
          <Icon className="size-5" aria-hidden />
        </span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <DeltaBadge changePct={trend.changePct} />
        <Sparkline values={spark} color={color} className="h-7 w-20" />
      </div>
    </Card>
  )
}

function DeltaBadge({ changePct }: { changePct: number | null }) {
  if (changePct === null || changePct === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-small text-text-muted">
        <Minus className="size-3.5" aria-hidden />
        No change
      </span>
    )
  }
  const up = changePct > 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-small font-medium',
        up ? 'text-success' : 'text-danger',
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {up ? '+' : '−'}
      {Math.abs(changePct)}%
      <span className="sr-only">vs previous period</span>
    </span>
  )
}
