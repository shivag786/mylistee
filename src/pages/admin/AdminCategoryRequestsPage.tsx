import { useState } from 'react'
import { Check, X, Inbox, Store } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import { useCategoryRequests, useCategoryRequestActions } from '@/features/admin/hooks/useAdmin'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'
import type { CategoryRequestItem } from '@/features/admin/types'

const TABS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
] as const

const STATUS_TONE: Record<CategoryRequestItem['status'], 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
}

export function AdminCategoryRequestsPage() {
  usePageTitle('Category requests')
  const [status, setStatus] = useState<string>('pending')
  const { data, isLoading, isError, refetch } = useCategoryRequests(status)
  const { approve, reject } = useCategoryRequestActions()

  const requests = data?.items ?? []

  async function handleApprove(request: CategoryRequestItem) {
    try {
      await approve.mutateAsync(request.id)
      toast.success(`Added “${request.name}”`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic)
    }
  }

  async function handleReject(request: CategoryRequestItem) {
    try {
      await reject.mutateAsync({ id: request.id })
      toast.success('Request declined')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic)
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-title font-bold text-foreground">Category requests</h1>
        <p className="text-caption text-text-secondary">
          Business owners can request categories that don't exist yet. Approving adds them to the
          master list instantly.
        </p>
      </header>

      <Tabs value={status} onValueChange={setStatus}>
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex min-h-[40dvh] items-center justify-center">
          <Spinner size={32} label="Loading requests" />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<Inbox className="size-7" />}
          title={`No ${status} requests`}
          description={
            status === 'pending'
              ? "You're all caught up. New requests will appear here."
              : `No ${status} requests to show.`
          }
        />
      ) : (
        <Stagger className="space-y-3">
          {requests.map((request) => (
            <StaggerItem key={request.id}>
              <Card className="flex flex-wrap items-center gap-4" padding="md">
                <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-image bg-surface-muted">
                  {request.sampleImageUrl ? (
                    <img
                      src={request.sampleImageUrl}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <Store className="size-6 text-text-muted" aria-hidden />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-body font-semibold text-foreground">{request.name}</p>
                    <Badge tone={STATUS_TONE[request.status]}>{request.status}</Badge>
                  </div>
                  <p className="text-small text-text-muted">
                    {request.businessName ? `${request.businessName} · ` : ''}
                    {request.requestedBy ?? 'Unknown owner'}
                  </p>
                  {request.reviewNote && (
                    <p className="mt-1 text-small text-text-secondary">Note: {request.reviewNote}</p>
                  )}
                </div>

                {request.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<X className="size-4" />}
                      onClick={() => void handleReject(request)}
                      disabled={approve.isPending || reject.isPending}
                    >
                      Decline
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      leftIcon={<Check className="size-4" />}
                      onClick={() => void handleApprove(request)}
                      disabled={approve.isPending || reject.isPending}
                    >
                      Approve
                    </Button>
                  </div>
                )}
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  )
}
