import { useState } from 'react'
import { Plus, Megaphone, Pause, Play, Pencil, Package } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconButton } from '@/components/ui/icon-button'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import { PromotionForm } from '@/features/owner/components/PromotionForm'
import { PlanUsageBanner } from '@/features/owner/components/PlanUsageBanner'
import { usePromotions, usePromotionActions } from '@/features/owner/hooks/usePromotions'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'
import { PROMOTION_STATUS_TONE, type Promotion } from '@/features/owner/promotionTypes'

function summary(p: Promotion): string {
  if (p.type === 'bogo') return `Buy ${p.buyQty ?? 1} get ${p.getQty ?? 1}`
  const amount = p.discountType === 'flat' ? `₹${p.value ?? 0} off` : `${p.value ?? 0}% off`
  if (p.type === 'quantity_discount') return `${amount} above ${p.minQty ?? 2} units`
  if (p.type === 'happy_hour' && p.dailyStartTime && p.dailyEndTime) {
    return `${amount} · ${p.dailyStartTime.slice(0, 5)}–${p.dailyEndTime.slice(0, 5)}`
  }
  return amount
}

export function GrowSalesPage() {
  usePageTitle('Grow sales')
  const { data, isLoading, isError, refetch } = usePromotions()
  const { setStatus } = usePromotionActions()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Promotion | null>(null)

  const promotions = data ?? []

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function toggleStatus(p: Promotion) {
    const action = p.status === 'paused' ? 'resume' : 'pause'
    setStatus.mutate(
      { id: p.id, action },
      { onError: (err) => toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic) },
    )
  }


  if (isLoading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Spinner size={32} label="Loading promotions" />
      </div>
    )
  }
  if (isError) return <ErrorState onRetry={() => void refetch()} />

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-title font-bold text-foreground">Grow sales</h1>
          <p className="text-caption text-text-secondary">
            Create a promotion once — it starts and stops on its own.
          </p>
        </div>
        <Button leftIcon={<Plus className="size-5" />} onClick={openCreate}>
          New promotion
        </Button>
      </header>

      <PlanUsageBanner metric="activePromotions" />

      {promotions.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="size-7" />}
          title="No promotions yet"
          description="Run a discount, happy hour, or flash sale to bring customers in."
          actionLabel="New promotion"
          onAction={openCreate}
        />
      ) : (
        <Stagger className="space-y-3">
          {promotions.map((p) => (
            <StaggerItem key={p.id}>
              <Card className="flex flex-wrap items-center gap-4" padding="md">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-body font-semibold text-foreground">{p.name}</p>
                    <Badge tone={PROMOTION_STATUS_TONE[p.status]}>{p.status}</Badge>
                    {p.isActiveNow && <Badge tone="success">Live now</Badge>}
                  </div>
                  <p className="text-caption text-text-secondary">
                    {p.typeLabel} · {summary(p)}
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-small text-text-muted">
                    <Package className="size-3" aria-hidden />
                    {p.productName ?? 'All products'}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {p.status !== 'expired' && (
                    <IconButton
                      aria-label={p.status === 'paused' ? 'Resume' : 'Pause'}
                      size="sm"
                      onClick={() => toggleStatus(p)}
                      disabled={setStatus.isPending}
                    >
                      {p.status === 'paused' ? (
                        <Play className="size-4" aria-hidden />
                      ) : (
                        <Pause className="size-4" aria-hidden />
                      )}
                    </IconButton>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Pencil className="size-4" />}
                    onClick={() => {
                      setEditing(p)
                      setFormOpen(true)
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <PromotionForm open={formOpen} onOpenChange={setFormOpen} promotion={editing} />
    </div>
  )
}
