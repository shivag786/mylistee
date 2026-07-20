import { useState } from 'react'
import { MoreHorizontal, Ban, ShieldX, RotateCcw } from 'lucide-react'
import { IconButton } from '@/components/ui/icon-button'
import { Avatar } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/utils/toast'
import { AdminTable, type Column } from '@/features/admin/components/AdminTable'
import { AdminToolbar } from '@/features/admin/components/AdminToolbar'
import { Pagination } from '@/features/admin/components/Pagination'
import { StatusPill } from '@/features/admin/components/StatusPill'
import { useAdminCustomers, useSetCustomerStatus } from '@/features/admin/hooks/useAdmin'
import type { AdminCustomer, ListFilters } from '@/features/admin/types'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'blocked', label: 'Blocked' },
]

export function AdminCustomersPage() {
  const [filters, setFilters] = useState<ListFilters>({ page: 1 })
  const { data, isLoading } = useAdminCustomers(filters)
  const setStatus = useSetCustomerStatus()

  function act(id: string, status: string, message: string) {
    setStatus
      .mutateAsync({ id, status })
      .then(() => toast.success(message))
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Action failed.'))
  }

  const columns: Column<AdminCustomer>[] = [
    {
      key: 'name',
      label: 'Customer',
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={c.name} src={c.avatarUrl ?? undefined} size="sm" />
          <div className="min-w-0">
            <p className="font-medium text-foreground">{c.name}</p>
            <p className="truncate text-small text-text-muted">{c.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'status', label: 'Status', cell: (c) => <StatusPill status={c.status} /> },
    { key: 'activity', label: 'Activity', className: 'tabular-nums', cell: (c) => `${c.spins} spins · ${c.rewards} rewards` },
    {
      key: 'joined',
      label: 'Joined',
      cell: (c) => (c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-10 text-right',
      cell: (c) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton aria-label={`Actions for ${c.name}`} size="sm">
              <MoreHorizontal aria-hidden />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {c.status !== 'active' && (
              <DropdownMenuItem onClick={() => act(c.id, 'active', 'Customer reactivated')}>
                <RotateCcw className="size-4" /> Restore
              </DropdownMenuItem>
            )}
            {c.status !== 'suspended' && (
              <DropdownMenuItem onClick={() => act(c.id, 'suspended', 'Customer suspended')}>
                <Ban className="size-4" /> Suspend
              </DropdownMenuItem>
            )}
            {c.status !== 'blocked' && (
              <DropdownMenuItem onClick={() => act(c.id, 'blocked', 'Customer blocked')}>
                <ShieldX className="size-4" /> Block
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-title font-bold text-foreground">Customers</h1>

      <AdminToolbar
        search={filters.search ?? ''}
        onSearch={(search) => setFilters((f) => ({ ...f, search, page: 1 }))}
        placeholder="Search by name or email…"
        statusOptions={STATUS_OPTIONS}
        status={filters.status}
        onStatus={(status) => setFilters((f) => ({ ...f, status, page: 1 }))}
      />

      <AdminTable
        columns={columns}
        rows={data?.items ?? []}
        getRowKey={(c) => c.id}
        isLoading={isLoading}
        emptyMessage="No customers match your filters."
      />
      {data && <Pagination meta={data.meta} onPage={(page) => setFilters((f) => ({ ...f, page }))} />}
    </div>
  )
}
