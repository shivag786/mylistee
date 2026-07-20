import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { AdminTable, type Column } from '@/features/admin/components/AdminTable'
import { AdminToolbar } from '@/features/admin/components/AdminToolbar'
import { Pagination } from '@/features/admin/components/Pagination'
import { useAuditLogs } from '@/features/admin/hooks/useAdmin'
import type { AuditLog, ListFilters } from '@/features/admin/types'

export function AdminAuditLogsPage() {
  const [filters, setFilters] = useState<ListFilters>({ page: 1 })
  const { data, isLoading } = useAuditLogs(filters)

  const columns: Column<AuditLog>[] = [
    { key: 'action', label: 'Action', cell: (l) => <Badge tone="neutral" size="sm">{l.action}</Badge> },
    {
      key: 'description',
      label: 'Details',
      cell: (l) => (
        <div className="min-w-0">
          <p className="text-foreground">{l.description ?? '—'}</p>
          {l.subjectType && <p className="text-small text-text-muted">{l.subjectType} #{l.subjectId}</p>}
        </div>
      ),
    },
    { key: 'actor', label: 'By', cell: (l) => l.actorName },
    { key: 'ip', label: 'IP', className: 'tabular-nums', cell: (l) => l.ipAddress ?? '—' },
    {
      key: 'time',
      label: 'When',
      cell: (l) => (l.createdAt ? new Date(l.createdAt).toLocaleString() : '—'),
    },
  ]

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-title font-bold text-foreground">Audit logs</h1>
        <p className="text-caption text-text-secondary">An immutable trail of every admin action</p>
      </header>

      <AdminToolbar
        search={filters.search ?? ''}
        onSearch={(search) => setFilters((f) => ({ ...f, search, page: 1 }))}
        placeholder="Filter by action (e.g. business.suspend)…"
      />

      <AdminTable
        columns={columns}
        rows={data?.items ?? []}
        getRowKey={(l) => l.id}
        isLoading={isLoading}
        emptyMessage="No audit entries yet."
      />
      {data && <Pagination meta={data.meta} onPage={(page) => setFilters((f) => ({ ...f, page }))} />}
    </div>
  )
}
