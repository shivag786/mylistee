import { useState } from 'react'
import { Plus, Tag, Pencil, Trash2, Archive, RotateCcw, Ticket, Sparkles, Lightbulb } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  useOfferSuggestions,
} from '@/features/owner/hooks/useOwner'
import { OfferForm, type OfferSeed } from '@/features/owner/components/OfferForm'
import { OfferStatusBadge } from '@/features/owner/components/OfferStatusBadge'
import type { Offer, OfferFormValues, OfferType } from '@/features/owner/types'
import type { OfferSuggestion } from '@/features/owner/services/ownerService'

export function OffersPage() {
  const { data: offers, isLoading, isError, refetch } = useOffers()
  const create = useCreateOffer()
  const update = useUpdateOffer()
  const setStatus = useSetOfferStatus()
  const remove = useDeleteOffer()

  const [editing, setEditing] = useState<Offer | null>(null)
  const [creating, setCreating] = useState(false)
  const [seed, setSeed] = useState<OfferSeed | undefined>(undefined)
  const [deleting, setDeleting] = useState<Offer | null>(null)
  const [showIdeas, setShowIdeas] = useState(false)
  const suggestions = useOfferSuggestions(showIdeas)

  function applySuggestion(s: OfferSuggestion) {
    setSeed({ title: s.title, type: s.type as OfferType, rewardValue: s.rewardValue ?? '' })
    setShowIdeas(false)
    setCreating(true)
  }

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
        <div className="flex items-center gap-2">
          <Button
            size="md"
            variant="outline"
            leftIcon={<Lightbulb className="size-4" />}
            onClick={() => setShowIdeas(true)}
          >
            Need ideas?
          </Button>
          <Button size="md" leftIcon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
            New offer
          </Button>
        </div>
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
      <Sheet
        open={creating}
        onOpenChange={(open) => {
          setCreating(open)
          if (!open) setSeed(undefined)
        }}
      >
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>New offer</SheetTitle>
            <SheetDescription>This becomes a reward on your spinner.</SheetDescription>
          </SheetHeader>
          <div className="p-4">
            <OfferForm
              key={seed?.title ?? 'blank'}
              seed={seed}
              onSubmit={handleCreate}
              onDone={() => setCreating(false)}
              submitting={create.isPending}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Suggestions */}
      <Sheet open={showIdeas} onOpenChange={setShowIdeas}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Lightbulb className="size-5 text-premium" aria-hidden />
              Offer ideas
            </SheetTitle>
            <SheetDescription>
              Tailored to your business. Tap one to prefill a new offer.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-3 p-4">
            {suggestions.isLoading ? (
              <div className="flex justify-center py-10">
                <Spinner size={28} label="Thinking of ideas" />
              </div>
            ) : suggestions.isError ? (
              <ErrorState onRetry={() => void suggestions.refetch()} />
            ) : (
              <>
                {suggestions.data?.aiEnabled && (
                  <p className="flex items-center gap-1.5 text-caption text-premium">
                    <Sparkles className="size-4" aria-hidden /> Includes AI-tailored ideas
                  </p>
                )}
                {suggestions.data?.suggestions.map((s, i) => (
                  <Card key={`${s.title}-${i}`} className="space-y-2" padding="md">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-body font-semibold text-foreground">{s.title}</p>
                      <SuggestionSourceBadge source={s.source} />
                    </div>
                    <p className="text-caption text-text-secondary">{s.reason}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-caption text-text-muted">
                        {s.rewardValue ? `Reward: ${s.rewardValue}` : ''}
                      </span>
                      <Button size="sm" onClick={() => applySuggestion(s)}>
                        Use this
                      </Button>
                    </div>
                  </Card>
                ))}
              </>
            )}
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

function SuggestionSourceBadge({ source }: { source: string }) {
  if (source === 'ai') return <Badge tone="premium">AI</Badge>
  if (source === 'analytics') return <Badge tone="info">For you</Badge>
  return <Badge tone="neutral">Template</Badge>
}
