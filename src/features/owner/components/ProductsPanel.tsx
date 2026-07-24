import { useMemo, useState } from 'react'
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
import { useProgressiveReveal } from '@/hooks/useProgressiveReveal'
import { useProducts, useProductActions } from '../hooks/useProducts'
import { usePromotions } from '../hooks/usePromotions'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'
import type { Product } from '../productTypes'
import type { Promotion } from '../promotionTypes'

/** Products tab on the Products page (Phase 7.2a). */
export function ProductsPanel() {
  const { data, isLoading, isError, refetch } = useProducts()
  const { remove, toggle } = useProductActions()
  const { data: promotions } = usePromotions()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [offerFor, setOfferFor] = useState<Product | null>(null)
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null)

  const products = data ?? []
  const { visible, hasMore, sentinelRef } = useProgressiveReveal(products, 12)

  // One promotion per product for the card badge — prefer the one running now.
  const promoByProduct = useMemo(() => {
    const map = new Map<string, Promotion>()
    for (const promo of promotions ?? []) {
      if (!promo.productId) continue
      const existing = map.get(promo.productId)
      if (!existing || (promo.isActiveNow && !existing.isActiveNow)) map.set(promo.productId, promo)
    }
    return map
  }, [promotions])

  const promoOpen = offerFor !== null || editingPromo !== null
  const promoProduct =
    offerFor ?? products.find((p) => p.id === editingPromo?.productId) ?? null

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
        <>
          <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {visible.map((product) => (
              <StaggerItem key={product.id}>
                <ProductCard
                  product={product}
                  onEdit={openEdit}
                  onDelete={setDeleting}
                  onToggleVisible={toggleVisible}
                  onSmartOffer={setOfferFor}
                  promotion={promoByProduct.get(product.id) ?? null}
                  onEditOffer={setEditingPromo}
                  busy={toggle.isPending}
                />
              </StaggerItem>
            ))}
          </Stagger>
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-6">
              <Spinner size={22} label="Loading more products" />
            </div>
          )}
        </>
      )}

      <ProductForm open={formOpen} onOpenChange={setFormOpen} product={editing} />

      <PromotionForm
        open={promoOpen}
        onOpenChange={(open) => {
          if (!open) {
            setOfferFor(null)
            setEditingPromo(null)
          }
        }}
        promotion={editingPromo}
        product={promoProduct}
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
