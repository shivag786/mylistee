import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Package, ScanLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import { ProductCard } from './ProductCard'
import { ProductForm } from './ProductForm'
import { PromotionForm } from './PromotionForm'
import { QuickOfferSheet } from './QuickOfferSheet'
import { MenuScanSheet } from './MenuScanSheet'
import { useProgressiveReveal } from '@/hooks/useProgressiveReveal'
import { useProducts, useProductActions } from '../hooks/useProducts'
import { usePromotions } from '../hooks/usePromotions'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'
import type { Product } from '../productTypes'
import { isPromotionOver, type Promotion } from '../promotionTypes'

/** Products tab on the Products page (Phase 7.2a). */
export function ProductsPanel() {
  const { data, isLoading, isError, refetch } = useProducts()
  const { toggle } = useProductActions()
  const { data: promotions } = usePromotions()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [offerFor, setOfferFor] = useState<Product | null>(null)
  // "Add offer" opens the 3-tap sheet; its Advanced link opens the full form.
  const [quickFor, setQuickFor] = useState<Product | null>(null)
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null)
  // ?scan=1 (from the AI sales manager) opens the menu scan straight away.
  const [searchParams, setSearchParams] = useSearchParams()
  const [scanOpen, setScanOpenState] = useState(() => searchParams.get('scan') === '1')
  const setScanOpen = (open: boolean) => {
    setScanOpenState(open)
    if (!open && searchParams.has('scan')) {
      searchParams.delete('scan')
      setSearchParams(searchParams, { replace: true })
    }
  }

  const products = data ?? []
  const { visible, hasMore, sentinelRef } = useProgressiveReveal(products, 12)

  // One promotion per product for the card badge — prefer the one running now.
  const promoByProduct = useMemo(() => {
    const map = new Map<string, Promotion>()
    for (const promo of promotions ?? []) {
      // An ended offer no longer blocks "Add offer" on the card.
      if (!promo.productId || isPromotionOver(promo)) continue
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

  function toggleStock(product: Product, value: boolean) {
    // Counted stock at zero: back in stock means entering how many came in.
    if (value && product.stockQty === 0) {
      toast.info('Enter the new stock quantity')
      openEdit(product)
      return
    }
    toggle.mutate(
      { id: product.id, field: 'in_stock', value },
      {
        onSuccess: () => toast.success(value ? `${product.name} is back in stock` : `${product.name} marked sold out`),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic),
      },
    )
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
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" leftIcon={<ScanLine className="size-5" />} onClick={() => setScanOpen(true)}>
          Scan menu with AI
        </Button>
        <Button leftIcon={<Plus className="size-5" />} onClick={openCreate}>
          Add product
        </Button>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={<Package className="size-7" />}
          title="No products yet"
          description="Snap a photo of your printed menu and the AI fills it in for you — or add products one by one."
          actionLabel="Scan menu with AI"
          onAction={() => setScanOpen(true)}
        />
      ) : (
        <>
          <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {visible.map((product) => (
              <StaggerItem key={product.id}>
                <ProductCard
                  product={product}
                  onEdit={openEdit}
                  onToggleVisible={toggleVisible}
                  onToggleStock={toggleStock}
                  onSmartOffer={setQuickFor}
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

      <MenuScanSheet open={scanOpen} onOpenChange={setScanOpen} />

      <QuickOfferSheet
        product={quickFor}
        onOpenChange={(open) => !open && setQuickFor(null)}
        onAdvanced={(product) => {
          setQuickFor(null)
          setOfferFor(product)
        }}
      />

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
    </div>
  )
}
