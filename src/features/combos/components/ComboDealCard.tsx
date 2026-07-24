import { Link } from 'react-router-dom'
import { Utensils, Layers } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ComboDeal } from '../types'

interface ComboDealCardProps {
  combo: ComboDeal
}

/**
 * A meal-combo card for the home "Meal combos" row. Shows the combo image (or a
 * stack of item thumbnails), price vs total, and savings. The whole card links
 * to the shop profile to order.
 */
export function ComboDealCard({ combo }: ComboDealCardProps) {
  return (
    <Card padding="none" interactive className="group relative h-full overflow-hidden">
      <div className="relative h-28 w-full bg-surface-muted">
        {combo.imageUrl ? (
          <img
            src={combo.imageUrl}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center -space-x-3">
            {combo.items.slice(0, 3).map((item, i) => (
              <span
                key={item.productId ?? i}
                className="grid size-12 place-items-center overflow-hidden rounded-full border-2 border-surface bg-surface"
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="size-full object-cover" />
                ) : (
                  <Utensils className="size-4 text-text-muted" aria-hidden />
                )}
              </span>
            ))}
          </div>
        )}
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-small font-semibold text-white shadow-sm">
          <Layers className="size-3" aria-hidden />
          Combo
        </span>
      </div>

      <div className="p-3">
        <h3 className="line-clamp-1 text-body font-semibold leading-tight text-foreground">
          <Link
            to={ROUTES.businessProfile(combo.business.slug)}
            className="after:absolute after:inset-0"
          >
            {combo.name}
          </Link>
        </h3>

        <div className="mt-0.5 flex flex-wrap items-baseline gap-1.5">
          <span className="text-body font-bold text-foreground">₹{combo.comboPrice}</span>
          {combo.totalPrice > combo.comboPrice && (
            <span className="text-caption text-text-muted line-through">₹{combo.totalPrice}</span>
          )}
          {combo.savings > 0 && <Badge tone="success" size="sm">Save ₹{combo.savings}</Badge>}
        </div>

        <p className="mt-1 truncate text-caption text-text-secondary">{combo.business.name}</p>
      </div>
    </Card>
  )
}
