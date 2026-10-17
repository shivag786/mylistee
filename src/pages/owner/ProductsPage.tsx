import { Link, useSearchParams } from 'react-router-dom'
import { Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SegmentedControl } from '@/components/navigation/SegmentedControl'
import { ProductsPanel } from '@/features/owner/components/ProductsPanel'
import { ProductOffersPanel } from '@/features/owner/components/ProductOffersPanel'
import { ROUTES } from '@/constants/routes'
import { usePageTitle } from '@/hooks/usePageTitle'

type Tab = 'products' | 'offers'

/**
 * Owner catalogue (Phase 7.2a) with two tabs: the products, and the offers run
 * on them (today's, past ones, any date — with Repeat). The tab is in the URL
 * (`?tab=offers`) so it survives a reload and can be linked to.
 */
export function ProductsPage() {
  usePageTitle('Products')
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'offers' ? 'offers' : 'products'

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-title font-bold text-foreground">Products</h1>
          <p className="text-caption text-text-secondary">Your menu items and the offers on them.</p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<Layers className="size-4" />} asChild>
          <Link to={ROUTES.owner.combos}>Combos</Link>
        </Button>
      </header>

      <SegmentedControl<Tab>
        ariaLabel="Products or offers"
        options={[
          { value: 'products', label: 'Products' },
          { value: 'offers', label: 'Offers' },
        ]}
        value={tab}
        onChange={(next) => setParams(next === 'offers' ? { tab: 'offers' } : {}, { replace: true })}
        className="w-full sm:w-auto"
      />

      {tab === 'products' ? <ProductsPanel /> : <ProductOffersPanel />}
    </div>
  )
}
