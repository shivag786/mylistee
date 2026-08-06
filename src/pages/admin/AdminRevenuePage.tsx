import { useState } from 'react'
import { RotateCcw, TrendingUp, Wallet, CalendarClock, Users, Download } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/utils/toast'
import { adminService } from '@/features/admin/services/adminService'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AdminTable, type Column } from '@/features/admin/components/AdminTable'
import { AdminToolbar } from '@/features/admin/components/AdminToolbar'
import { Pagination } from '@/features/admin/components/Pagination'
import { useAdminPlans, useAdminRevenue } from '@/features/admin/hooks/useAdmin'
import { formatPrice } from '@/features/owner/planDisplay'
import type { RevenueFilters, RevenueRow } from '@/features/admin/types'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'Expired' },
]

const STATUS_TONE: Record<RevenueRow['status'], 'success' | 'neutral' | 'warning'> = {
  active: 'success',
  cancelled: 'neutral',
  expired: 'warning',
}

function cycleLabel(interval: string): string {
  return { month: 'Monthly', quarter: 'Quarterly', year: 'Yearly', lifetime: 'Lifetime' }[interval] ?? interval
}

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
}

export function AdminRevenuePage() {
  const [filters, setFilters] = useState<RevenueFilters>({ page: 1 })
  const { data, isLoading, isFetching } = useAdminRevenue(filters)
  const { data: plans } = useAdminPlans()

  const s = data?.summary
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      await adminService.downloadReport('revenue')
    } catch {
      toast.error('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const columns: Column<RevenueRow>[] = [
    {
      key: 'business',
      label: 'Business',
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{r.businessName ?? '—'}</p>
          <p className="text-small text-text-muted">{r.planName}</p>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      className: 'tabular-nums',
      cell: (r) => (
        <div>
          <p className="font-medium text-foreground">{formatPrice(r.price, r.currency)}</p>
          <p className="text-small text-text-muted">{cycleLabel(r.interval)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      cell: (r) => (
        <div className="flex items-center gap-2">
          <Badge tone={STATUS_TONE[r.status]} size="sm">{r.status}</Badge>
          {r.autoRenew && r.status === 'active' && <span className="text-small text-text-muted">auto-renews</span>}
        </div>
      ),
    },
    { key: 'started', label: 'Started', className: 'tabular-nums', cell: (r) => fmtDate(r.startedAt) },
    {
      key: 'ends',
      label: 'Renews / ends',
      className: 'tabular-nums',
      cell: (r) => fmtDate(r.endsAt),
    },
    {
      key: 'paid',
      label: 'Total paid',
      className: 'tabular-nums text-right',
      cell: (r) => <span className="font-semibold text-foreground">{formatPrice(r.totalPaid, r.currency)}</span>,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-title font-bold text-foreground">Revenue</h1>
          {isFetching && <RotateCcw className="size-4 animate-spin text-text-muted" aria-hidden />}
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Download className="size-4" />}
          onClick={() => void handleExport()}
          isLoading={exporting}
        >
          Export CSV
        </Button>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile icon={Wallet} label="Total revenue" value={s ? formatPrice(s.totalRevenue) : '—'} />
        <KpiTile icon={TrendingUp} label="This month" value={s ? formatPrice(s.thisMonthRevenue) : '—'} />
        <KpiTile icon={CalendarClock} label="MRR" value={s ? formatPrice(s.mrr) : '—'} />
        <KpiTile icon={Users} label="Active plans" value={s ? String(s.activeSubscriptions) : '—'} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[200px] flex-1">
          <AdminToolbar
            search={filters.search ?? ''}
            onSearch={(search) => setFilters((f) => ({ ...f, search, page: 1 }))}
            placeholder="Search business…"
            statusOptions={STATUS_OPTIONS}
            status={filters.status}
            onStatus={(status) => setFilters((f) => ({ ...f, status, page: 1 }))}
          />
        </div>
        <Select
          value={filters.plan ?? 'all'}
          onValueChange={(v) => setFilters((f) => ({ ...f, plan: v === 'all' ? undefined : v, page: 1 }))}
        >
          <SelectTrigger className="w-40"><SelectValue placeholder="All plans" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            {(plans ?? []).map((p) => (
              <SelectItem key={p.key} value={p.key}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.sort ?? 'newest'}
          onValueChange={(v) => setFilters((f) => ({ ...f, sort: v as RevenueFilters['sort'], page: 1 }))}
        >
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="revenue">Top paying</SelectItem>
            <SelectItem value="price">Highest price</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AdminTable
        columns={columns}
        rows={data?.rows ?? []}
        getRowKey={(r) => r.id}
        isLoading={isLoading}
        emptyMessage="No plan purchases match your filters."
      />
      {data && <Pagination meta={data.meta} onPage={(page) => setFilters((f) => ({ ...f, page }))} />}
    </div>
  )
}

function KpiTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wallet
  label: string
  value: string
}) {
  return (
    <Card padding="md" className="space-y-1">
      <p className="inline-flex items-center gap-1.5 text-caption text-text-muted">
        <Icon className="size-4" aria-hidden /> {label}
      </p>
      <p className="text-subtitle font-bold text-foreground">{value}</p>
    </Card>
  )
}

export default AdminRevenuePage
