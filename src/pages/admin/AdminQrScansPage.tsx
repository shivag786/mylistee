import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { StatTile } from '@/features/admin/components/InsightBits'
import { useQrScans } from '@/features/admin/insights'

/** Which shop posters get scanned: per day, top shops, by category and city. */
export function AdminQrScansPage() {
  const [days, setDays] = useState(30)
  const { data, isFetching } = useQrScans(days)
  const max = Math.max(1, ...(data?.series ?? []).map((d) => d.scans))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-title font-bold text-foreground">QR scans</h1>
          {isFetching && <RotateCcw className="size-4 animate-spin text-text-muted" aria-hidden />}
        </div>
        <div className="flex gap-1 rounded-full bg-surface-muted p-1">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-full px-3 py-1 text-small ${days === d ? 'bg-surface font-semibold text-foreground shadow-sm' : 'text-text-secondary'}`}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatTile label={`Scans (${days}d)`} value={data?.totalScans ?? '…'} />
        <StatTile label="Signed-in scanners" value={data?.uniqueCustomers ?? '…'} />
        <StatTile label="Shops scanned" value={data?.shopsScanned ?? '…'} tone="text-success" />
        <StatTile label="Shops with 0 scans" value={data?.shopsNotScanned ?? '…'} tone="text-warning" />
        <StatTile label="All-time scans" value={data?.allTimeScans ?? '…'} />
      </div>

      <Card elevation="soft" padding="lg">
        <h2 className="mb-3 font-semibold text-foreground">Scans per day</h2>
        <div className="flex h-40 items-end gap-[2px]" role="img" aria-label="Scans per day chart">
          {(data?.series ?? []).map((d) => (
            <div key={d.date} className="group relative flex-1">
              <div className="w-full rounded-t bg-primary/80 group-hover:bg-primary" style={{ height: `${(d.scans / max) * 150 + (d.scans ? 2 : 0)}px` }} />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[11px] text-background group-hover:block">
                {new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}: {d.scans}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card elevation="soft" padding="lg">
          <h2 className="mb-3 font-semibold text-foreground">Top shops</h2>
          {(data?.topShops ?? []).length === 0 ? (
            <p className="text-small text-text-muted">No scans in this period.</p>
          ) : (
            <ol className="divide-y divide-border">
              {data?.topShops.map((s, i) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="mr-2 text-text-muted tabular-nums">{i + 1}.</span>
                    <span className="font-medium text-foreground">{s.name}</span>
                    <span className="block pl-6 text-small text-text-muted">{[s.category, s.city].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className="text-right text-small tabular-nums">
                    <b className="text-foreground">{s.scans}</b> scans
                    <span className="block text-text-muted">{s.customers} customers</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
        <div className="space-y-4">
          <Breakdown title="By category" rows={(data?.byCategory ?? []).map((r) => ({ label: r.category, value: r.scans }))} />
          <Breakdown title="By city" rows={(data?.byCity ?? []).map((r) => ({ label: r.city, value: r.scans }))} />
        </div>
      </div>
    </div>
  )
}

function Breakdown({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <Card elevation="soft" padding="lg">
      <h2 className="mb-3 font-semibold text-foreground">{title}</h2>
      {rows.length === 0 && <p className="text-small text-text-muted">No data yet.</p>}
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex justify-between text-small">
              <span className="text-foreground">{r.label}</span>
              <span className="tabular-nums text-text-secondary">{r.value}</span>
            </div>
            <div className="mt-0.5 h-1.5 rounded-full bg-surface-muted">
              <div className="h-1.5 rounded-full bg-primary" style={{ width: `${(r.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
