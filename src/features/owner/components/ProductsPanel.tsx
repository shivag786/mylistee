import { useState } from 'react'
import { Plus, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import { ProductCard } from './ProductCard'
import { ProductForm } from './ProductForm'
import { PromotionForm } from './PromotionForm'
import { useProducts, useProductActions } from '../hooks/useProducts'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'
import type { Product } from '../productTypes'

/** Products tab on the Products page (Phase 7.2a). */
export function ProductsPanel() {
  const { data, isLoading, isError, refetch } = useProducts()
  const { remove, toggle } = useProductActions()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [offerFor, setOfferFor] = useState<Product | null>(null)

  const products = data ?? []

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }
  function openEdit(product: Product) {
    setEditing(product)
    setFormOpen(true)
  }

  function toggleVisible(product: Product, value: boolean) {
    toggle.mutate(
      { id: product.id, field: 'is_visible', value },
      { onError: (err) => toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic) },
    )
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      await remove.mutateAsync(deleting.id)
      toast.success('Product deleted')
      setDeleting(null)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center">
        <Spinner size={32} label="Loading products" />
      </div>
    )
  }
  if (isError) return <ErrorState onRetry={() => void refetch()} />

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button leftIcon={<Plus className="size-5" />} onClick={openCreate}>
          Add product
        </Button>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={<Package className="size-7" />}
          title="No products yet"
          description="Add your first product so customers can browse your menu."
          actionLabel="Add product"
          onAction={openCreate}
        />
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <StaggerItem key={product.id}>
              <ProductCard
                product={product}
                onEdit={openEdit}
                onDelete={setDeleting}
                onToggleVisible={toggleVisible}
                onSmartOffer={setOfferFor}
                busy={toggle.isPending}
              />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <ProductForm open={formOpen} onOpenChange={setFormOpen} product={editing} />

      <PromotionForm
        open={offerFor !== null}
        onOpenChange={(open) => !open && setOfferFor(null)}
        promotion={null}
        presetProductId={offerFor?.id ?? null}
        presetProductName={offerFor?.name ?? null}
      />

      <ConfirmationDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name ?? 'product'}?`}
        description="This removes it from your menu. This can't be undone."
        confirmLabel="Delete"
        destructive
        isLoading={remove.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
