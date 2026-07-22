import { useState } from 'react'
import { Plus, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import { ComboCard } from './ComboCard'
import { ComboBuilder } from './ComboBuilder'
import { useCombos, useComboActions } from '../hooks/useCombos'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'
import type { Combo } from '../comboTypes'

/** Combos tab on the Products page (Phase 7.3). */
export function CombosPanel() {
  const { data, isLoading, isError, refetch } = useCombos()
  const { remove } = useComboActions()

  const [builderOpen, setBuilderOpen] = useState(false)
  const [editing, setEditing] = useState<Combo | null>(null)
  const [deleting, setDeleting] = useState<Combo | null>(null)

  const combos = data ?? []

  function openCreate() {
    setEditing(null)
    setBuilderOpen(true)
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      await remove.mutateAsync(deleting.id)
      toast.success('Combo deleted')
      setDeleting(null)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center">
        <Spinner size={32} label="Loading combos" />
      </div>
    )
  }
  if (isError) return <ErrorState onRetry={() => void refetch()} />

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button leftIcon={<Plus className="size-5" />} onClick={openCreate}>
          Create combo
        </Button>
      </div>

      {combos.length === 0 ? (
        <EmptyState
          icon={<Layers className="size-7" />}
          title="No combos yet"
          description="Bundle 2–3 products at a special price to boost order value."
          actionLabel="Create combo"
          onAction={openCreate}
        />
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {combos.map((combo) => (
            <StaggerItem key={combo.id}>
              <ComboCard
                combo={combo}
                onEdit={(c) => {
                  setEditing(c)
                  setBuilderOpen(true)
                }}
                onDelete={setDeleting}
              />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <ComboBuilder open={builderOpen} onOpenChange={setBuilderOpen} combo={editing} />

      <ConfirmationDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name ?? 'combo'}?`}
        description="This removes the combo. This can't be undone."
        confirmLabel="Delete"
        destructive
        isLoading={remove.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
