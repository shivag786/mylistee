import { useState } from 'react'
import { Ban, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/utils/toast'
import { AdminTable, type Column } from '@/features/admin/components/AdminTable'
import { AdminToolbar } from '@/features/admin/components/AdminToolbar'
import { Pagination } from '@/features/admin/components/Pagination'
import { StatusPill } from '@/features/admin/components/StatusPill'
import { useAdminOffers, useSetOfferStatus } from '@/features/admin/hooks/useAdmin'
import type { AdminOffer, ListFilters } from '@/features/admin/types'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
]

export function AdminOffersPage() {
  const [filters, setFilters] = useState<ListFilters>({ page: 1 })
  const { data, isLoading } = useAdminOffers(filters)
  const setStatus = useSetOfferStatus()

  function act(id: string, status: string, message: string) {
    setStatus
      .mutateAsync({ id, status })
      .then(() => toast.success(message))
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Action failed.'))
  }

  const columns: Column<AdminOffer>[] = [
    {
      key: 'title',
      label: 'Offer',
      cell: (o) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{o.title}</p>
          <p className="text-small text-text-muted">{o.businessName ?? '—'}</p>
        </div>
      ),
    },
    { key: 'type', label: 'Type', className: 'capitalize', cell: (o) => o.type.replace(/_/g, ' ') },
    { key: 'status', label: 'Status', cell: (o) => <StatusPill status={o.status} /> },
    {
      key: 'window',
      label: 'Window',
      cell: (o) => `${o.startsAt ?? '—'} → ${o.endsAt ?? '—'}`,
    },
    {
      key: 'actions',
      label: '',
      className: 'w-28 text-right',
      cell: (o) =>
        o.status === 'archived' ? (
          <Button variant="outline" size="sm" onClick={() => act(o.id, 'active', 'Offer restored')} leftIcon={<RotateCcw className="size-4" />}>
            Restore
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => act(o.id, 'archived', 'Offer suspended')} leftIcon={<Ban className="size-4" />}>
            Suspend
          </Button>
        ),
    },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-title font-bold text-foreground">Offers</h1>

      <AdminToolbar
        search={filters.search ?? ''}
        onSearch={(search) => setFilters((f) => ({ ...f, search, page: 1 }))}
        placeholder="Search offers or businesses…"
        statusOptions={STATUS_OPTIONS}
        status={filters.status}
        onStatus={(status) => setFilters((f) => ({ ...f, status, page: 1 }))}
      />

      <AdminTable
        columns={columns}
        rows={data?.items ?? []}
        getRowKey={(o) => o.id}
        isLoading={isLoading}
        emptyMessage="No offers match your filters."
      />
      {data && <Pagination meta={data.meta} onPage={(page) => setFilters((f) => ({ ...f, page }))} />}
    </div>
  )
}
