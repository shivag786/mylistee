import { Link } from 'react-router-dom'
import { Utensils, Store, Tag, Clock } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Card } from '@/components/ui/card'
import type { Deal } from '../types'

interface DealCardProps {
  deal: Deal
}

/** Hours until an ISO timestamp, or null when absent/invalid/past. */
function hoursUntil(iso: string | null | undefined): number | null {
  if (!iso) return null
  const ms = new Date(iso).getTime() - Date.now()
  return Number.isNaN(ms) ? null : ms / 3_600_000
}

/**
 * A single product deal for the home "Today's Deals" row. The whole card is a
 * stretched link to the shop's profile, where the offer can be ordered. Mirrors
 * ShopCard's compact styling so the rows feel like one system.
 */
export function DealCard({ deal }: DealCardProps) {
  const discounted = deal.effectivePrice < deal.sellingPrice
  const hoursLeft = hoursUntil(deal.offer?.endsAt)
  const endingSoon = hoursLeft !== null && hoursLeft > 0 && hoursLeft <= 24

  return (
    <Card padding="none" interactive className="group relative h-full overflow-hidden">
      <div className="relative">
        {deal.imageUrl ? (
          <img
            src={deal.imageUrl}
            alt=""
            loading="lazy"
            className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-28 w-full place-items-center bg-surface-muted text-text-muted">
            <Utensils className="size-7" aria-hidden />
          </div>
        )}
        {deal.offer && (
          <span className="absolute left-2 top-2 inline-flex max-w-[calc(100%-1rem)] items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-small font-semibold text-primary-foreground shadow-sm">
            <Tag className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{deal.offer.label}</span>
          </span>
        )}
        {endingSoon && (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-warning px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
            <Clock className="size-2.5" aria-hidden />
            {hoursLeft! <= 1 ? 'Ends soon' : `Ends in ${Math.ceil(hoursLeft!)}h`}
          </span>
        )}
      </div>

      <div className="p-3">
        <h3 className="line-clamp-1 text-body font-semibold leading-tight text-foreground">
          <Link
            to={`${ROUTES.businessProfile(deal.business.slug)}?item=${deal.id}`}
            className="after:absolute after:inset-0"
          >
            {deal.name}
          </Link>
        </h3>

        {/* Promotion type */}
        {deal.offer && (
          <span className="mt-1 inline-block rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">
            {deal.offer.typeLabel}
          </span>
        )}

        <div className="mt-1 flex items-baseline gap-1.5">
          {discounted ? (
            <>
              <span className="text-body font-bold text-success">₹{deal.effectivePrice}</span>
              <span className="text-caption text-text-muted line-through">₹{deal.sellingPrice}</span>
            </>
          ) : (
            <span className="text-body font-bold text-foreground">₹{deal.sellingPrice}</span>
          )}
        </div>

        <p className="mt-1 flex items-center gap-1 text-caption text-text-secondary">
          <span className="grid size-4 shrink-0 place-items-center overflow-hidden rounded bg-surface-muted text-text-muted">
            {deal.business.logo ? (
              <img src={deal.business.logo} alt="" className="size-full object-cover" />
            ) : (
              <Store className="size-3" aria-hidden />
            )}
          </span>
          <span className="truncate">{deal.business.name}</span>
        </p>
      </div>
    </Card>
  )
}
