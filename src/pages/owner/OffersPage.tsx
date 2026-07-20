import { useState } from 'react'
import { Plus, Tag, Pencil, Trash2, Archive, RotateCcw, Ticket } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import {
  useOffers,
  useCreateOffer,
  useUpdateOffer,
  useDeleteOffer,
  useSetOfferStatus,
} from '@/features/owner/hooks/useOwner'
import { OfferForm } from '@/features/owner/components/OfferForm'
import { OfferStatusBadge } from '@/features/owner/components/OfferStatusBadge'
import type { Offer, OfferFormValues } from '@/features/owner/types'

export function OffersPage() {
  const { data: offers, isLoading, isError, refetch } = useOffers()
  const create = useCreateOffer()
  const update = useUpdateOffer()
  const setStatus = useSetOfferStatus()
  const remove = useDeleteOffer()

  const [editing, setEditing] = useState<Offer | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Offer | null>(null)

  const activeCount = offers?.filter((o) => o.status === 'active').length ?? 0

  if (isLoading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <Spinner size={32} label="Loading offers" />
      </div>
    )
  }
  if (isError || !offers) {
    return <ErrorState onRetry={() => void refetch()} />
  }

  async function handleCreate(values: OfferFormValues) {
    await create.mutateAsync(values)
  }
  async function handleUpdate(values: OfferFormValues) {
    if (!editing) return
    await update.mutateAsync({ id: editing.id, values })
  }
  async function toggleArchive(offer: Offer) {
    const next = offer.status === 'archived' ? 'active' : 'archived'
    try {
      await setStatus.mutateAsync({ id: offer.id, status: next })
      toast.success(next === 'archived' ? 'Offer archived' : 'Offer activated')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not update the offer.')
    }
  }
  async function confirmDelete() {
    if (!deleting) return
    try {
      await remove.mutateAsync(deleting.id)
      toast.success('Offer deleted')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not delete the offer.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-title font-bold text-foreground">Offers</h1>
          <p className="text-caption text-text-secondary">{activeCount}/3 active on the free plan</p>
        </div>
        <Button size="md" leftIcon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
          New offer
        </Button>
      </div>

      {offers.length === 0 ? (
        <EmptyState
          icon={<Tag className="size-7" />}
          title="No offers yet"
          description="Create your first offer — it becomes a reward customers can win on your spinner."
          actionLabel="Create offer"
          onAction={() => setCreating(true)}
        />
      ) : (
        <Stagger className="space-y-3">
          {offers.map((offer) => (
            <StaggerItem key={offer.id}>
              <Card padding="none" className="overflow-hidden">
                <div className="flex gap-3 p-4">
                  <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary-soft text-primary">
                    {offer.imageUrl ? (
                      <img src={offer.imageUrl} alt="" loading="lazy" className="size-full object-cover" />
                    ) : (
                      <Ticket className="size-6" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-body font-semibold text-foreground">{offer.title}</p>
                      <OfferStatusBadge status={offer.status} />
                    </div>
                    <p className="text-caption text-text-secondary">
                      {offer.typeLabel}
                      {offer.rewardValue ? ` · ${offer.rewardValue}` : ''}
                    </p>
                    <p className="mt-1 text-small text-text-muted">
                      {offer.startsAt} → {offer.endsAt}
                      {offer.remainingQuantity != null ? ` · ${offer.remainingQuantity} left` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1 border-t border-border/60 px-2 py-1.5">
                  <IconButton aria-label="Edit offer" variant="ghost" onClick={() => setEditing(offer)}>
                    <Pencil className="size-4" aria-hidden />
                  </IconButton>
                  <IconButton
                    aria-label={offer.status === 'archived' ? 'Activate offer' : 'Archive offer'}
                    variant="ghost"
                    onClick={() => void toggleArchive(offer)}
                  >
                    {offer.status === 'archived' ? (
                      <RotateCcw className="size-4" aria-hidden />
                    ) : (
                      <Archive className="size-4" aria-hidden />
                    )}
                  </IconButton>
                  <IconButton aria-label="Delete offer" variant="ghost" onClick={() => setDeleting(offer)}>
                    <Trash2 className="size-4 text-danger" aria-hidden />
                  </IconButton>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {/* Create */}
      <Sheet open={creating} onOpenChange={setCreating}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>New offer</SheetTitle>
            <SheetDescription>This becomes a reward on your spinner.</SheetDescription>
          </SheetHeader>
          <div className="p-4">
            <OfferForm onSubmit={handleCreate} onDone={() => setCreating(false)} submitting={create.isPending} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit */}
      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit offer</SheetTitle>
            <SheetDescription>Update your offer details.</SheetDescription>
          </SheetHeader>
          <div className="p-4">
            {editing && (
              <OfferForm
                offer={editing}
                onSubmit={handleUpdate}
                onDone={() => setEditing(null)}
                submitting={update.isPending}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmationDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this offer?"
        description="This permanently removes the offer. Rewards already won by customers are unaffected."
        confirmLabel="Delete"
        destructive
        isLoading={remove.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
