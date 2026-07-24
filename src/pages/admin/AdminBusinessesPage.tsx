import { useState } from 'react'
import { MoreHorizontal, Check, Ban, RotateCcw, X, BadgeCheck, Star, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/utils/toast'
import { AdminTable, type Column } from '@/features/admin/components/AdminTable'
import { AdminToolbar } from '@/features/admin/components/AdminToolbar'
import { Pagination } from '@/features/admin/components/Pagination'
import { StatusPill } from '@/features/admin/components/StatusPill'
import { BusinessEditSheet } from '@/features/admin/components/BusinessEditSheet'
import { BusinessImageCell } from '@/features/admin/components/BusinessImageCell'
import { useAdminBusinesses, useBusinessActions } from '@/features/admin/hooks/useAdmin'
import type { AdminBusiness, ListFilters } from '@/features/admin/types'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'rejected', label: 'Rejected' },
]

export function AdminBusinessesPage() {
  const [filters, setFilters] = useState<ListFilters>({ page: 1 })
  const [editing, setEditing] = useState<AdminBusiness | null>(null)
  const { data, isLoading, isFetching } = useAdminBusinesses(filters)
  const { setStatus, verify, feature, uploadImage } = useBusinessActions()

  function handleUpload(id: string, type: 'logo' | 'cover', file: File) {
    act(uploadImage.mutateAsync({ id, type, image: file }), `${type === 'logo' ? 'Logo' : 'Banner'} updated`)
  }

  function act(promise: Promise<unknown>, message: string) {
    promise.then(() => toast.success(message)).catch((e) => toast.error(e instanceof Error ? e.message : 'Action failed.'))
  }

  function toggleActive(b: AdminBusiness, next: boolean) {
    act(
      setStatus.mutateAsync({ id: b.id, status: next ? 'active' : 'suspended' }),
      next ? 'Business activated' : 'Business suspended',
    )
  }

  const columns: Column<AdminBusiness>[] = [
    {
      key: 'name',
      label: 'Business',
      cell: (b) => (
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Pencil className="size-4" />}
            onClick={() => setEditing(b)}
          >
            Edit
          </Button>
          <div className="min-w-0">
            <p className="font-medium text-foreground">{b.name}</p>
            <p className="text-small text-text-muted">{b.ownerName ?? b.ownerEmail ?? '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'category', label: 'Category', cell: (b) => b.category ?? '—' },
    {
      key: 'logo',
      label: 'Logo',
      cell: (b) => (
        <BusinessImageCell business={b} type="logo" onUpload={handleUpload} pending={uploadImage.isPending} />
      ),
    },
    {
      key: 'banner',
      label: 'Banner',
      cell: (b) => (
        <BusinessImageCell business={b} type="cover" onUpload={handleUpload} pending={uploadImage.isPending} />
      ),
    },
    {
      key: 'login',
      label: 'Owner login',
      cell: (b) =>
        b.ownerMobile ? (
          <div className="tabular-nums">
            <p className="font-medium text-foreground">{b.ownerMobile}</p>
            <p className="text-small text-text-muted">
              PIN {b.ownerPin ?? <span className="italic">—</span>}
            </p>
          </div>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: 'status',
      label: 'Status',
      cell: (b) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={b.status === 'active'}
            onCheckedChange={(v) => toggleActive(b, v)}
            disabled={setStatus.isPending}
            aria-label={`${b.status === 'active' ? 'Suspend' : 'Activate'} ${b.name}`}
          />
          <StatusPill status={b.status} />
          {b.verified && <Badge tone="info" size="sm">Verified</Badge>}
          {b.featured && <Badge tone="premium" size="sm">Featured</Badge>}
        </div>
      ),
    },
    {
      key: 'activity',
      label: 'Activity',
      className: 'tabular-nums',
      cell: (b) => `${b.totalVisits} visits · ${b.totalSpins} spins`,
    },
    {
      key: 'actions',
      label: '',
      className: 'w-10 text-right',
      cell: (b) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton aria-label={`Actions for ${b.name}`} size="sm">
              <MoreHorizontal aria-hidden />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {b.status !== 'active' && (
              <DropdownMenuItem onClick={() => act(setStatus.mutateAsync({ id: b.id, status: 'active' }), 'Business approved')}>
                <Check className="size-4" /> Approve / activate
              </DropdownMenuItem>
            )}
            {b.status !== 'suspended' && (
              <DropdownMenuItem onClick={() => act(setStatus.mutateAsync({ id: b.id, status: 'suspended' }), 'Business suspended')}>
                <Ban className="size-4" /> Suspend
              </DropdownMenuItem>
            )}
            {b.status !== 'rejected' && (
              <DropdownMenuItem onClick={() => act(setStatus.mutateAsync({ id: b.id, status: 'rejected' }), 'Business rejected')}>
                <X className="size-4" /> Reject
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => act(verify.mutateAsync(b.id), b.verified ? 'Verification removed' : 'Business verified')}>
              <BadgeCheck className="size-4" /> {b.verified ? 'Remove verification' : 'Verify'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => act(feature.mutateAsync(b.id), b.featured ? 'Unfeatured' : 'Featured')}>
              <Star className="size-4" /> {b.featured ? 'Unfeature' : 'Feature'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-title font-bold text-foreground">Businesses</h1>
        {isFetching && <RotateCcw className="size-4 animate-spin text-text-muted" aria-hidden />}
      </div>

      <AdminToolbar
        search={filters.search ?? ''}
        onSearch={(search) => setFilters((f) => ({ ...f, search, page: 1 }))}
        placeholder="Search businesses…"
        statusOptions={STATUS_OPTIONS}
        status={filters.status}
        onStatus={(status) => setFilters((f) => ({ ...f, status, page: 1 }))}
      />

      <AdminTable
        columns={columns}
        rows={data?.items ?? []}
        getRowKey={(b) => b.id}
        isLoading={isLoading}
        emptyMessage="No businesses match your filters."
      />
      {data && <Pagination meta={data.meta} onPage={(page) => setFilters((f) => ({ ...f, page }))} />}

      <BusinessEditSheet
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        business={editing}
      />
    </div>
  )
}
