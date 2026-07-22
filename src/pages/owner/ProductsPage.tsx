import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductsPanel } from '@/features/owner/components/ProductsPanel'
import { CombosPanel } from '@/features/owner/components/CombosPanel'
import { usePageTitle } from '@/hooks/usePageTitle'

/**
 * Owner menu management (Phase 7.2a / 7.3). Products and combos live under one
 * screen (07A — menu under Products) as two tabs.
 */
export function ProductsPage() {
  usePageTitle('Products')

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-title font-bold text-foreground">Menu</h1>
        <p className="text-caption text-text-secondary">
          Your products and combos. Add items once — run time-bound discounts from Grow sales.
        </p>
      </header>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="combos">Combos</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="mt-4">
          <ProductsPanel />
        </TabsContent>
        <TabsContent value="combos" className="mt-4">
          <CombosPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
