import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CombosPanel } from '@/features/owner/components/CombosPanel'
import { ROUTES } from '@/constants/routes'
import { usePageTitle } from '@/hooks/usePageTitle'

/**
 * Combos (Phase 7.3) — its own screen, split out from Products. Bundle 2–3
 * products at a special price. Links back to Products for quick switching.
 */
export function CombosPage() {
  usePageTitle('Combos')

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-title font-bold text-foreground">Combos</h1>
          <p className="text-caption text-text-secondary">
            Bundle products into a deal. Add products first, then group them here.
          </p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<Package className="size-4" />} asChild>
          <Link to={ROUTES.owner.products}>Products</Link>
        </Button>
      </header>

      <CombosPanel />
    </div>
  )
}
