import { useState } from 'react'
import { ExternalLink, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ROUTES } from '@/constants/routes'
import { AdminTable, type Column } from '@/features/admin/components/AdminTable'
import { AdminToolbar } from '@/features/admin/components/AdminToolbar'
import { Pagination } from '@/features/admin/components/Pagination'
import {
  useAdminPersonalLinks,
  type AdminPersonalLinkRow,
  type PersonalLinkFilters,
  type PersonalLinkStatusFilter,
} from '@/features/admin/personalLinks'

const STATUS_OPTIONS = [
  { value: 'on', label: 'On' },
  { value: 'off', label: 'Off' },
]

/** Admin: which shops have their personal link on. Free for every shop, never expires. */
export function AdminPersonalLinksPage() {
  const [filters, setFilters] = useState<PersonalLinkFilters>({ page: 1 })
  const { data, isLoading, isFetching } = useAdminPersonalLinks(filters)

  const columns: Column<AdminPersonalLinkRow>[] = [
    {
      key: 'shop',
      label: 'Shop',
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{r.name}</p>
          <p className="truncate text-small text-text-muted">{[r.ownerName, r.phone].filter(Boolean).join(' · ') || '—'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Personal link',
      cell: (r) => <Badge tone={r.enabled ? 'success' : 'neutral'}>{r.enabled ? 'On' : 'Off'}</Badge>,
    },
    {
      key: 'link',
      label: '',
      className: 'text-right',
      cell: (r) => (
        <a
          href={ROUTES.businessProfile(r.slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
        >
          Open <ExternalLink className="size-3.5" aria-hidden />
        </a>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-title font-bold text-foreground">Personal links</h1>
        {isFetching && <RotateCcw className="size-4 animate-spin text-text-muted" aria-hidden />}
      </div>
      <p className="text-caption text-text-secondary">
        Free for every shop and never expires — owners switch it on themselves. Here you can see who uses it.
      </p>

      <AdminToolbar
        search={filters.search ?? ''}
        onSearch={(search) => setFilters((f) => ({ ...f, search, page: 1 }))}
        placeholder="Search shop, owner or phone…"
        statusOptions={STATUS_OPTIONS}
        status={filters.status}
        onStatus={(status) => setFilters((f) => ({ ...f, status: status as PersonalLinkStatusFilter, page: 1 }))}
      />

      <AdminTable
        columns={columns}
        rows={data?.items ?? []}
        getRowKey={(r) => r.id}
        isLoading={isLoading}
        emptyMessage="No shops match your filters."
      />
      {data && <Pagination meta={data.meta} onPage={(page) => setFilters((f) => ({ ...f, page }))} />}
    </div>
  )
}
