import { Link } from 'react-router-dom'
import { Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductsPanel } from '@/features/owner/components/ProductsPanel'
import { ROUTES } from '@/constants/routes'
import { usePageTitle } from '@/hooks/usePageTitle'

/**
 * Owner product catalogue (Phase 7.2a). Combos now live on their own screen
 * (see CombosPage); this page is just the products, with a quick link across.
 */
export function ProductsPage() {
  usePageTitle('Products')

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-title font-bold text-foreground">Products</h1>
          <p className="text-caption text-text-secondary">
            Your menu items. Run time-bound discounts from Grow sales.
          </p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<Layers className="size-4" />} asChild>
          <Link to={ROUTES.owner.combos}>Combos</Link>
        </Button>
      </header>

      <ProductsPanel />
    </div>
  )
}
