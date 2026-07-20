import { ShieldAlert, Users, Network } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useAdminFraud } from '@/features/admin/hooks/useAdmin'

export function AdminFraudPage() {
  const { data, isLoading, isError, refetch } = useAdminFraud()

  if (isLoading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Spinner size={32} label="Analysing" />
      </div>
    )
  }
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />

  const nothing = data.excessiveSpins.length === 0 && data.sharedIps.length === 0

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-title font-bold text-foreground">Fraud signals</h1>
        <p className="text-caption text-text-secondary">
          Heuristics over the last 7 days — review before acting
        </p>
      </header>

      {nothing ? (
        <EmptyState
          icon={<ShieldAlert className="size-7" aria-hidden />}
          title="No suspicious activity"
          description="Nothing crossed the fraud thresholds in the last 7 days."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card elevation="soft" className="space-y-3" padding="md">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-danger" aria-hidden />
              <h2 className="text-body-lg font-semibold text-foreground">Excessive spinning</h2>
            </div>
            {data.excessiveSpins.length === 0 ? (
              <p className="py-3 text-caption text-text-muted">None flagged.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.excessiveSpins.map((r, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{r.name}</p>
                      <p className="truncate text-small text-text-muted">{r.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-caption tabular-nums text-foreground">{r.spins} spins</span>
                      <Badge tone={r.risk === 'high' ? 'danger' : 'warning'} size="sm">{r.risk}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card elevation="soft" className="space-y-3" padding="md">
            <div className="flex items-center gap-2">
              <Network className="size-4 text-danger" aria-hidden />
              <h2 className="text-body-lg font-semibold text-foreground">Shared devices / IPs</h2>
            </div>
            {data.sharedIps.length === 0 ? (
              <p className="py-3 text-caption text-text-muted">None flagged.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.sharedIps.map((r, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate font-medium tabular-nums text-foreground">{r.ip}</p>
                      <p className="text-small text-text-muted">{r.accounts} accounts · {r.spins} spins</p>
                    </div>
                    <Badge tone={r.risk === 'high' ? 'danger' : 'warning'} size="sm">{r.risk}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
