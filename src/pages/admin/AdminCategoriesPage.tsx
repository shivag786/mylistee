import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Grid3x3, Home, Search } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { IconButton } from '@/components/ui/icon-button'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import { CategoryFormSheet } from '@/features/admin/components/CategoryFormSheet'
import { useAdminCategories, useCategoryActions } from '@/features/admin/hooks/useAdmin'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'
import type { AdminCategory } from '@/features/admin/types'

export function AdminCategoriesPage() {
  usePageTitle('Categories')
  const { data, isLoading, isError, refetch } = useAdminCategories()
  const { remove, reorder, setVisibility } = useCategoryActions()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<AdminCategory | null>(null)
  const [deleting, setDeleting] = useState<AdminCategory | null>(null)

  const categories = useMemo(() => data ?? [], [data])

  function openCreate() {
    setEditing(null)
    setSheetOpen(true)
  }

  function openEdit(category: AdminCategory) {
    setEditing(category)
    setSheetOpen(true)
  }

  function toggleVisibility(
    category: AdminCategory,
    payload: { showOnHomepage?: boolean; showInSearch?: boolean },
  ) {
    setVisibility.mutate(
      { id: category.id, payload },
      { onError: (err) => toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic) },
    )
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...categories]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    reorder.mutate(next.map((c) => c.id))
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      await remove.mutateAsync(deleting.id)
      toast.success('Category deleted')
      setDeleting(null)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Spinner size={32} label="Loading categories" />
      </div>
    )
  }
  if (isError) return <ErrorState onRetry={() => void refetch()} />

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-title font-bold text-foreground">Categories</h1>
          <p className="text-caption text-text-secondary">
            The master list used across the platform. Reorder to set display priority.
          </p>
        </div>
        <Button leftIcon={<Plus className="size-5" />} onClick={openCreate}>
          New category
        </Button>
      </header>

      {categories.length === 0 ? (
        <EmptyState
          icon={<Grid3x3 className="size-7" />}
          title="No categories yet"
          description="Create your first category so businesses can classify themselves."
          actionLabel="New category"
          onAction={openCreate}
        />
      ) : (
        <Stagger className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category, index) => (
            <StaggerItem key={category.id}>
              <Card className="flex h-full flex-col gap-3" padding="md">
                <div className="flex items-center gap-3">
                  <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-muted">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={category.altText ?? category.name}
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    ) : (
                      <Grid3x3 className="size-6 text-text-muted" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body font-semibold text-foreground">{category.name}</p>
                    <p className="text-small text-text-muted">
                      Position {category.position} · {category.businessCount}{' '}
                      {category.businessCount === 1 ? 'business' : 'businesses'}
                    </p>
                  </div>
                  <Badge tone={category.status === 'active' ? 'success' : 'neutral'}>
                    {category.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="space-y-1.5 rounded-xl bg-surface-muted/50 px-3 py-2">
                  <label className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-caption font-medium text-text-secondary">
                      <Home className="size-3.5" aria-hidden /> Show on homepage
                    </span>
                    <Switch
                      checked={category.showOnHomepage}
                      onCheckedChange={(v) => toggleVisibility(category, { showOnHomepage: v })}
                      disabled={setVisibility.isPending}
                      aria-label={`Show ${category.name} on homepage`}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-caption font-medium text-text-secondary">
                      <Search className="size-3.5" aria-hidden /> Show in search
                    </span>
                    <Switch
                      checked={category.showInSearch}
                      onCheckedChange={(v) => toggleVisibility(category, { showInSearch: v })}
                      disabled={setVisibility.isPending}
                      aria-label={`Show ${category.name} in search`}
                    />
                  </label>
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
                  <div className="flex items-center gap-1">
                    <IconButton
                      aria-label="Move up"
                      size="sm"
                      disabled={index === 0 || reorder.isPending}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp className="size-4" aria-hidden />
                    </IconButton>
                    <IconButton
                      aria-label="Move down"
                      size="sm"
                      disabled={index === categories.length - 1 || reorder.isPending}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown className="size-4" aria-hidden />
                    </IconButton>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Pencil className="size-4" />}
                      onClick={() => openEdit(category)}
                    >
                      Edit
                    </Button>
                    <IconButton
                      aria-label={`Delete ${category.name}`}
                      size="sm"
                      onClick={() => setDeleting(category)}
                    >
                      <Trash2 className="size-4 text-destructive" aria-hidden />
                    </IconButton>
                  </div>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <CategoryFormSheet open={sheetOpen} onOpenChange={setSheetOpen} category={editing} />

      <ConfirmationDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name ?? 'category'}?`}
        description="Businesses in this category will become uncategorised. This can't be undone."
        confirmLabel="Delete"
        destructive
        isLoading={remove.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
