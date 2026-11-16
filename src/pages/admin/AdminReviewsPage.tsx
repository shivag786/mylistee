import { useState } from 'react'
import { EyeOff, Eye, Flag, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/utils/toast'
import { AdminTable, type Column } from '@/features/admin/components/AdminTable'
import { AdminToolbar } from '@/features/admin/components/AdminToolbar'
import { Pagination } from '@/features/admin/components/Pagination'
import { StatusPill } from '@/features/admin/components/StatusPill'
import { useAdminReviews, useSetReviewStatus } from '@/features/admin/hooks/useAdmin'
import type { AdminReview, ListFilters } from '@/features/admin/types'

const STATUS_OPTIONS = [
  { value: 'reported', label: 'Reported' },
  { value: 'published', label: 'Published' },
  { value: 'hidden', label: 'Hidden' },
]

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  offensive: 'Offensive',
  fake: 'Fake',
  personal_info: 'Personal details',
  other: 'Other',
}

export function AdminReviewsPage() {
  const [filters, setFilters] = useState<ListFilters>({ page: 1 })
  const { data, isLoading } = useAdminReviews(filters)
  const setStatus = useSetReviewStatus()

  function act(id: string, status: string, message: string) {
    setStatus
      .mutateAsync({ id, status })
      .then(() => toast.success(message))
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Action failed.'))
  }

  const columns: Column<AdminReview>[] = [
    {
      key: 'review',
      label: 'Review',
      cell: (r) => (
        <div className="min-w-0 max-w-md">
          {r.rating !== null ? (
            <div className="flex items-center gap-1 text-star">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={i < r.rating! ? 'size-3.5 fill-current' : 'size-3.5 text-border'} aria-hidden />
              ))}
            </div>
          ) : (
            <p className="text-small text-text-muted">No star rating</p>
          )}
          <p className="mt-0.5 line-clamp-2 text-foreground">{r.comment || <span className="text-text-muted">No comment</span>}</p>
          {(r.reportsCount ?? 0) > 0 && (
            <p className="mt-1 flex items-center gap-1 text-small font-semibold text-danger">
              <Flag className="size-3.5" aria-hidden />
              Reported {r.reportsCount}×
              <span className="font-normal text-text-muted">
                ·{' '}
                {Object.entries(r.reportReasons ?? {})
                  .map(([reason, n]) => `${REASON_LABELS[reason] ?? reason}${n > 1 ? ` (${n})` : ''}`)
                  .join(', ')}
              </span>
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'context',
      label: 'From → business',
      cell: (r) => (
        <div>
          <p className="text-foreground">{r.customerName ?? '—'}</p>
          <p className="text-small text-text-muted">{r.businessName ?? '—'}</p>
        </div>
      ),
    },
    { key: 'status', label: 'Status', cell: (r) => <StatusPill status={r.status} /> },
    {
      key: 'actions',
      label: '',
      className: 'w-24 text-right',
      cell: (r) =>
        r.status === 'hidden' ? (
          <Button variant="outline" size="sm" onClick={() => act(r.id, 'published', 'Review restored')} leftIcon={<Eye className="size-4" />}>
            Restore
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => act(r.id, 'hidden', 'Review hidden')} leftIcon={<EyeOff className="size-4" />}>
            Hide
          </Button>
        ),
    },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-title font-bold text-foreground">Reviews</h1>

      <AdminToolbar
        search=""
        onSearch={() => {}}
        placeholder="Filter reviews"
        statusOptions={STATUS_OPTIONS}
        status={filters.status}
        onStatus={(status) => setFilters((f) => ({ ...f, status, page: 1 }))}
      />

      <AdminTable
        columns={columns}
        rows={data?.items ?? []}
        getRowKey={(r) => r.id}
        isLoading={isLoading}
        emptyMessage="No reviews to moderate."
      />
      {data && <Pagination meta={data.meta} onPage={(page) => setFilters((f) => ({ ...f, page }))} />}
    </div>
  )
}
